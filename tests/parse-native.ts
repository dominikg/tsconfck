import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import glob from 'tiny-glob';
import { promises as fs } from 'fs';
import path from 'path';
import { parseNative, ParseNativeError } from '../src/parse-native.js';
import os from 'os';
import { copyFixtures } from './util/copy-fixtures.js';
import { transform as esbuildTransform } from 'esbuild';
import ts from 'typescript';
import { loadExpectedJSON, loadExpectedTXT } from './util/load-expected.js';
const test = suite('parse-native');

test('should be a function', () => {
	assert.type(parseNative, 'function');
});

test('should return a Promise', () => {
	assert.instance(parseNative('str'), Promise);
});

test('should reject for invalid filename arg', async () => {
	// TODO rewrite to assert.rejects once https://github.com/lukeed/uvu/pull/132 landed
	for (const filename of [{}, [], 0, null, undefined]) {
		// @ts-ignore
		const result = await parseNative(filename).then(
			() => 'resolved',
			() => 'rejected'
		);
		assert.is(result, 'rejected', `filename type: ${typeof filename}`);
	}
	// @ts-ignore
	const notSetResult = await parseNative().then(
		() => 'resolved',
		() => 'rejected'
	);
	assert.is(notSetResult, 'rejected', `filename not set`);

	const strResult = await parseNative('str').then(
		() => 'resolved',
		() => 'rejected'
	);
	assert.is(strResult, 'resolved', `filename type: string`);
});

test('should reject when filename is a tsconfig.json that does not exist', async () => {
	const notExisting = path.resolve(os.homedir(), '..', 'tsconfig.json'); // outside of user home there should not be a tsconfig
	try {
		await parseNative(notExisting);
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
		const expected = await loadExpectedJSON(filename, 'expected.native.json');
		try {
			const actual = await parseNative(filename);
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
		const expectedFilename = `${path.basename(filename)}.expected.json`;
		const expected = await loadExpectedJSON(filename, expectedFilename);
		try {
			const actual = await parseNative(filename);
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
		'parse-native-isomorphic',
		(x) => x.isDirectory() || x.name.startsWith('tsconfig')
	);
	const samples = await glob(`${tempDir}/**/tsconfig.json`);
	for (const filename of samples) {
		try {
			const result = await parseNative(filename);
			await fs.copyFile(filename, `${filename}.orig`);
			await fs.writeFile(filename, JSON.stringify(result.tsconfig, null, 2));
			const result2 = await parseNative(filename);
			assert.equal(result.tsconfig, result2.tsconfig, `filename: ${filename}`);
		} catch (e) {
			if (e.code === 'ERR_ASSERTION') {
				throw e;
			}
			assert.unreachable(`parsing ${filename} failed: ${e}`);
		}
	}
});

test('should resolve with tsconfig that works when transpiling', async () => {
	const samples = await glob('tests/fixtures/transpile/**/tsconfig.json');
	for (const filename of samples) {
		try {
			const { tsconfig } = await parseNative(filename);
			const inputFiles = await glob(filename.replace('tsconfig.json', '**/input.ts'));
			for (const inputFile of inputFiles) {
				const input = await fs.readFile(inputFile, 'utf-8');
				const esbuildExpected = await loadExpectedTXT(inputFile, 'expected.esbuild.txt');
				const esbuildResult = (
					await esbuildTransform(input, { loader: 'ts', tsconfigRaw: tsconfig })
				).code;
				assert.fixture(
					esbuildResult,
					esbuildExpected,
					`esbuild result with config: ${filename} and input ${inputFile}`
				);
				const tsExpected = await loadExpectedTXT(inputFile, 'expected.typescript.txt');
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

test('should reject with correct error position for invalid tsconfig.json', async () => {
	const samples = await glob('tests/fixtures/parse/invalid/**/tsconfig.json');
	for (const filename of samples) {
		const expected = await loadExpectedJSON(filename, 'expected.native.json');
		try {
			await parseNative(filename);
			assert.unreachable(`${filename} did not reject`);
		} catch (err) {
			if (err.code === 'ERR_ASSERTION') {
				throw err;
			}
			assert.instance(err, ParseNativeError);

			assert.equal(err.code, expected.code, `filename: ${filename}, err: ${err}`);
			if (expected.start != null) {
				assert.equal(err.diagnostic.start, expected.start, `filename: ${filename}, err: ${err}`);
			}
			assert.match(
				err.message,
				expected.message,
				`expected "${expected.message}" for filename: ${filename}, got "${err.message}", err: ${err}`
			);
		}
	}
});

test.run();
