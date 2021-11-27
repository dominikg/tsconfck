import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import glob from 'tiny-glob';
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from '../src/parse.js';
import { TSConfckParseError, TSConfckParseResult } from '../src/types.js';
import os from 'os';
import { copyFixtures } from './util/copy-fixtures.js';
import { transform as esbuildTransform } from 'esbuild';
import ts from 'typescript';
import { loadExpectedJSON, loadExpectedTXT } from './util/load-expected.js';

const test = suite('parse');

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

test('should resolve with empty result when filename is a tsconfig.json that does not exist and option is set', async () => {
	const notExisting = path.resolve(os.homedir(), '..', 'tsconfig.json'); // outside of user home there should not be a tsconfig
	try {
		const result = await parse(notExisting, { resolveWithEmptyIfConfigNotFound: true });
		assert.equal(result, { tsconfigFile: 'no_tsconfig_file_found', tsconfig: {} }, 'empty result');
	} catch (e) {
		if (e.code === 'ERR_ASSERTION') {
			throw e;
		}
		assert.unreachable(
			`parse("${notExisting}",{resolveWithEmptyIfConfigNotFound: true}) did reject`
		);
	}
});

test('should resolve with expected for valid tsconfig.json', async () => {
	const samples = await glob('tests/fixtures/parse/valid/**/tsconfig.json');
	for (const filename of samples) {
		const expected = await loadExpectedJSON(filename, 'expected.native.json');
		try {
			const actual = await parse(filename);
			assert.equal(actual.tsconfig, expected, `testfile: ${filename}`);
			assert.equal(actual.tsconfigFile, path.resolve(filename));
		} catch (e) {
			if (e.code === 'ERR_ASSERTION') {
				throw e;
			}
			assert.unreachable(`parsing ${filename} failed: ${e}`);
		}
	}
});

test('should resolve with expected tsconfig.json for ts file that is part of a solution', async () => {
	const samples = await glob('tests/fixtures/parse/solution/**/*.{ts,mts,cts}');
	for (const filename of samples) {
		const expectedFilename = `${path.basename(filename)}.expected.json`;
		const expected = await loadExpectedJSON(filename, expectedFilename);
		try {
			const actual = await parse(filename);
			assert.equal(actual.tsconfig, expected, `testfile: ${filename}`);
		} catch (e) {
			if (e.code === 'ERR_ASSERTION') {
				throw e;
			}
			assert.unreachable(`parsing ${filename} failed: ${e}`);
		}
	}
});

test('should work with cache', async () => {
	// use the more interesting samples with extensions and solution-style
	const samples = [
		...(await glob('tests/fixtures/parse/valid/with_extends/**/tsconfig.json')),
		...(await glob('tests/fixtures/parse/solution/**/*.ts'))
	];
	const cache = new Map<string, TSConfckParseResult>();
	for (const filename of samples) {
		try {
			const expectedFilename = filename.endsWith('.ts')
				? `${path.basename(filename)}.expected.json`
				: 'expected.native.json';
			const expected = await loadExpectedJSON(filename, expectedFilename);
			assert.is(cache.has(filename), false, `cache does not exist for ${filename}`);
			const actual = await parse(filename, { cache });
			assert.equal(actual.tsconfig, expected, `expected for testfile: ${filename}`);
			assert.is(cache.has(filename), true, `cache exists for ${filename}`);
			const cached = cache.get(filename)!;
			assert.equal(cached.tsconfig, expected, `cached for testfile: ${filename}`);
			const reparsedResult = await parse(filename, { cache });
			assert.is(reparsedResult, cached, `reparsedResult was returned from cache for ${filename}`);
			if (filename.endsWith('.ts')) {
				assert.is(cache.has(actual.tsconfigFile), true, `cache exists for ${actual.tsconfigFile}`);
				const cachedByResultFilename = cache.get(actual.tsconfigFile)!;
				assert.equal(
					cachedByResultFilename.tsconfig,
					expected,
					`cache of ${actual.tsconfigFile} matches for: ${filename}`
				);
				const reparsedByResultFilename = await parse(actual.tsconfigFile, { cache });
				assert.is(
					reparsedByResultFilename,
					cachedByResultFilename,
					`reparsedByResultFilename was returned from cache for ${actual.tsconfigFile}`
				);
			}
			cache.clear();
			const afterClear = await parse(filename, { cache });
			assert.equal(afterClear.tsconfig, expected, `expected after clear for testfile: ${filename}`);
			assert.is(cache.has(filename), true, `cache exists again after clear for ${filename}`);
		} catch (e) {
			if (e.code === 'ERR_ASSERTION') {
				throw e;
			}
			assert.unreachable(`unexpected error when testing cache with ${filename}: ${e}`);
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
		try {
			const result = await parse(filename);
			await fs.copyFile(filename, `${filename}.orig`);
			await fs.writeFile(filename, JSON.stringify(result.tsconfig, null, 2));
			const result2 = await parse(filename);
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
			const { tsconfig } = await parse(filename);
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

test('should reject with correct error for invalid tsconfig.json', async () => {
	const samples = await glob('tests/fixtures/parse/invalid/**/tsconfig.json');
	for (const filename of samples) {
		const expected = await loadExpectedTXT(filename);
		try {
			await parse(filename);
			assert.unreachable(`${filename} did not reject`);
		} catch (e) {
			if (e.code === 'ERR_ASSERTION') {
				throw e;
			}
			assert.instance(e, TSConfckParseError);
			const actual = e.message;
			assert.match(
				actual,
				expected,
				`expected "${expected}" for filename: ${filename}, got actual "${actual}"`
			);
			assert.is(e.tsconfigFile, path.resolve(filename));
		}
	}
});

test.run();
