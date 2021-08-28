import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import glob from 'tiny-glob';
import { promises as fs } from 'fs';
import path from 'path';
import { parse, ParseResult } from '../src/parse.js';
import os from 'os';
import { copyFixtures } from './util/copy-fixtures.js';
const test = suite('parse');
import { transform as esbuildTransform } from 'esbuild';
import ts from 'typescript';

test('should be a function', () => {
	assert.type(parse, 'function');
});

test('should return a Promise', () => {
	assert.instance(parse('str'), Promise);
});

test('should reject for invalid filename arg', async () => {
	// TODO rewrite to assert.rejects once https://github.com/lukeed/uvu/pull/132 landed
	for (const filename of [{}, [], 0, null, undefined]) {
		// @ts-ignore
		const result = await parse(filename).then(
			() => 'resolved',
			() => 'rejected'
		);
		assert.is(result, 'rejected', `filename type: ${typeof filename}`);
	}
	// @ts-ignore
	const notSetResult = await parse().then(
		() => 'resolved',
		() => 'rejected'
	);
	assert.is(notSetResult, 'rejected', `filename not set`);

	const strResult = await parse('str').then(
		() => 'resolved',
		() => 'rejected'
	);
	assert.is(strResult, 'resolved', `filename type: string`);
});

test('should reject when filename is a tsconfig.json that does not exist', async () => {
	const notExisting = path.resolve(os.homedir(), '..', 'tsconfig.json'); // outside of user home there should not be a tsconfig
	try {
		await parse(notExisting);
		assert.unreachable(`parse("${notExisting}") did not reject`);
	} catch (e) {
		if (e.code === 'ERR_ASSERTION') {
			throw e;
		}
		assert.equal(e.message, `no tsconfig file found for ${notExisting}`);
	}
});

test('should resolve with expected for valid tsconfig.json', async () => {
	const samples = await glob('tests/fixtures/parse/valid/**/tsconfig.json');
	for (const filename of samples) {
		const expectedFilename = filename.replace(/tsconfig.json$/, 'expected.native.json');
		let actual: ParseResult;
		let expected;
		try {
			expected = JSON.parse(await fs.readFile(path.resolve(expectedFilename), 'utf-8'));
		} catch (e) {
			assert.unreachable(`unexpected exception parsing ${expectedFilename}: ${e}`);
		}
		try {
			actual = await parse(filename);
			assert.equal(actual.tsconfig, expected, `testfile: ${filename}`);
			assert.equal(actual.filename, path.resolve(filename));
		} catch (e) {
			if (e.code === 'ERR_ASSERTION') {
				throw e;
			}
			assert.unreachable(`parsing ${filename} failed: ${e}`);
		}
	}
});

test('should resolve with expected tsconfig.json for ts file that is part of a solution', async () => {
	const samples = await glob('tests/fixtures/parse/solution/**/*.ts');
	for (const filename of samples) {
		const expectedFilename = `${filename}.expected.json`;
		let actual: ParseResult;
		let expected;
		try {
			expected = JSON.parse(await fs.readFile(path.resolve(expectedFilename), 'utf-8'));
		} catch (e) {
			assert.unreachable(`unexpected exception parsing ${expectedFilename}: ${e}`);
		}
		try {
			actual = await parse(filename);
			assert.equal(actual.tsconfig, expected, `testfile: ${filename}`);
		} catch (e) {
			if (e.code === 'ERR_ASSERTION') {
				throw e;
			}
			assert.unreachable(`parsing ${filename} failed: ${e}`);
		}
	}
});

test('should resolve with tsconfig that is isomorphic', async () => {
	const tempDir = await copyFixtures(
		'parse/valid',
		'parse-isomorphic',
		(x) => x.isDirectory() || x.name.startsWith('tsconfig')
	);
	const samples = await glob(`${tempDir}/**/tsconfig.json`);
	for (const filename of samples) {
		const result = await parse(filename);
		await fs.copyFile(filename, `${filename}.orig`);
		await fs.writeFile(filename, JSON.stringify(result.tsconfig, null, 2));
		const result2 = await parse(filename);
		assert.equal(result.tsconfig, result2.tsconfig, `filename: ${filename}`);
	}
});

test('should resolve with tsconfig that works when transpiling', async () => {
	const samples = await glob('tests/fixtures/transpile/**/tsconfig.json');
	for (const filename of samples) {
		try {
			const { tsconfig } = await parse(filename);
			const inputFiles = await glob(filename.replace('tsconfig.json', '**/input.ts'));
			for (const inputFile of inputFiles) {
				const input = await fs.readFile(inputFile, 'utf-8');
				const esbuildExpectedFile = inputFile.replace('input.ts', 'expected.esbuild.txt');
				const esbuildExpected = await fs.readFile(esbuildExpectedFile, 'utf-8');
				const esbuildResult = (
					await esbuildTransform(input, { loader: 'ts', tsconfigRaw: tsconfig })
				).code;
				assert.fixture(
					esbuildResult,
					esbuildExpected,
					`esbuild result with config: ${filename} and input ${inputFile}`
				);
				const tsExpectedFile = inputFile.replace('input.ts', 'expected.typescript.txt');
				const tsExpected = await fs.readFile(tsExpectedFile, 'utf-8');
				const tsResult = ts.transpile(input, tsconfig.compilerOptions);
				assert.fixture(
					tsResult,
					tsExpected,
					`typescript result with config: ${filename} and input ${inputFile}`
				);
			}
		} catch (e) {
			if (e.code === 'ERR_ASSERTION') {
				throw e;
			}
			assert.unreachable(`compiling parse result of ${filename} failed: ${e}`);
		}
	}
});

test('should reject with correct error for invalid tsconfig.json', async () => {
	const samples = await glob('tests/fixtures/parse/invalid/**/tsconfig.json');
	for (const filename of samples) {
		const expected = await fs.readFile(filename.replace(/tsconfig.json$/, 'expected.txt'), 'utf-8');
		try {
			await parse(filename);
			assert.unreachable(`${filename} did not reject`);
		} catch (e) {
			if (e.code === 'ERR_ASSERTION') {
				throw e;
			}
			const actual = e.message;
			assert.match(
				actual,
				expected,
				`expected "${expected}" for filename: ${filename}, got actual "${actual}"`
			);
		}
	}
});

test.run();
