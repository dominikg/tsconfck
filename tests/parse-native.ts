import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import glob from 'tiny-glob';
import { promises as fs } from 'fs';
import path from 'path';
import { parseNative, ParseNativeResult } from '../src/parse-native.js';
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
		} catch (e) {
			if (e.code === 'ERR_ASSERTION') {
				throw e;
			}
			if (e.messageText == null || e.start == null) {
				console.error(
					`unexpected error without messageText or start properties:\n ${JSON.stringify(
						e,
						null,
						2
					)}`
				);
				throw e;
			}
			const actual = { start: e.start, message: e.messageText };
			assert.equal(actual, expected, `filename: ${filename}`);
		}
	}
});

test.run();
