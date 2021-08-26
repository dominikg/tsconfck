import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import glob from 'tiny-glob';
import { promises as fs } from 'fs';
import path from 'path';
import { parseNative, ParseNativeResult } from '../src/parse-native.js';
import os from 'os';
import { copyFixtures } from './util/copy-fixtures.js';
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
	const samples = await glob('tests/fixtures/files/valid/**/tsconfig.json');
	for (const filename of samples) {
		const expectedFilename = filename.replace(/tsconfig.json$/, 'expected.native.json');
		let actual: ParseNativeResult;
		let expected;
		try {
			expected = JSON.parse(await fs.readFile(path.resolve(expectedFilename), 'utf-8'));
		} catch (e) {
			assert.unreachable(`unexpected exception parsing ${expectedFilename}: ${e}`);
		}
		try {
			actual = await parseNative(filename);
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

test('should resolve with tsconfig that is isomorphic', async () => {
	const tempDir = await copyFixtures(
		'files/valid',
		'parse-native-isomorphic',
		(x) => x.isDirectory() || x.name.startsWith('tsconfig')
	);
	const samples = await glob(`${tempDir}/**/tsconfig.json`);
	for (const filename of samples) {
		const result = await parseNative(filename);
		await fs.copyFile(filename, `${filename}.orig`);
		await fs.writeFile(filename, JSON.stringify(result.tsconfig, null, 2));
		const result2 = await parseNative(filename);
		assert.equal(result.tsconfig, result2.tsconfig, `filename: ${filename}`);
	}
});

test('should reject with correct error position for invalid tsconfig.json', async () => {
	const samples = await glob('tests/fixtures/files/invalid/parser/**/tsconfig.json');
	for (const filename of samples) {
		const expectedFilename = filename.replace(/tsconfig.json$/, 'expected.native.json');
		let expected;
		try {
			expected = JSON.parse(await fs.readFile(path.resolve(expectedFilename), 'utf-8'));
		} catch (e) {
			assert.unreachable(`unexpected exception parsing ${expectedFilename}: ${e}`);
		}
		try {
			await parseNative(filename);
			assert.unreachable(`${filename} did not reject`);
		} catch (err) {
			if (err.code === 'ERR_ASSERTION') {
				throw err;
			}
			if (!err.code?.startsWith('TS ')) {
				throw err;
			}
			assert.equal(err.code, expected.code, `filename: ${filename}, err: ${JSON.stringify(err)}`);
			if (expected.start != null) {
				assert.equal(
					err.start,
					expected.start,
					`filename: ${filename}, err: ${JSON.stringify(err)}`
				);
			}
			assert.match(
				err.message,
				expected.message,
				`expected "${expected.message}" for filename: ${filename}, got "${err.message}"`
			);
		}
	}
});

test.run();
