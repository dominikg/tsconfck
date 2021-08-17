import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import glob from 'tiny-glob';
import fs from 'fs/promises';
import path from 'path';
import { parse } from '../src/parse.js';
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

test('should resolve with expected for valid tsconfig.json', async () => {
	const samples = await glob('tests/fixtures/files/valid/**/tsconfig.json');
	for (const filename of samples) {
		const expectedFilename = filename.replace(/tsconfig.json$/, 'expected.json');
		let actual;
		let expected;
		try {
			actual = await parse(filename);
		} catch (e) {
			assert.unreachable(`parsing ${filename} failed: ${e}`);
		}
		try {
			expected = JSON.parse(await fs.readFile(path.resolve(expectedFilename), 'utf-8'));
		} catch (e) {
			assert.unreachable(`unexpected exception parsing ${expectedFilename}: ${e}`);
		}

		assert.equal(actual, expected, `testfile: ${filename}`);
	}
});

test('should reject with correct error position for invalid tsconfig.json', async () => {
	const samples = await glob('tests/fixtures/files/invalid/parser/**/tsconfig.json');
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
			assert.equal(actual, expected, `filename: ${filename}`);
		}
	}
});
test.run();
