import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import path from 'path';
import os from 'os';
import { findNative } from '../src/find-native.js';
import { native2posix } from '../src/util.js';
const test = suite('findNative');

test('should be a function', () => {
	assert.type(findNative, 'function');
});

test('should return a Promise', () => {
	assert.instance(findNative('str'), Promise);
});

test('should reject for invalid filename arg', async () => {
	// TODO rewrite to assert.rejects once https://github.com/lukeed/uvu/pull/132 landed
	for (const filename of [{}, [], 0, null, undefined]) {
		// @ts-ignore
		const result = await findNative(filename).then(
			() => 'resolved',
			() => 'rejected'
		);
		assert.is(result, 'rejected', `filename type: ${typeof filename}`);
	}
	// @ts-ignore
	const notSetResult = await findNative().then(
		() => 'resolved',
		() => 'rejected'
	);
	assert.is(notSetResult, 'rejected', `filename not set`);

	const strResult = await findNative('str').then(
		() => 'resolved',
		() => 'rejected'
	);
	assert.is(strResult, 'resolved', `filename type: string`);
});

test('should find tsconfig in same directory', async () => {
	const expected = native2posix(path.resolve('tests', 'fixtures', 'find', 'a', 'tsconfig.json'));
	const inputs = [
		path.join('tests', 'fixtures', 'find', 'a', 'foo.ts'),
		path.join('.', 'tests', 'fixtures', 'find', 'a', 'foo.ts'),
		path.resolve('tests', 'fixtures', 'find', 'a', 'foo.ts')
	];
	for (const input of inputs) {
		const tsconfig = await findNative(input);
		assert.is(tsconfig, expected, `input: ${input}`);
	}
});

test('should find tsconfig in parent directory', async () => {
	const expected = native2posix(path.resolve('tests', 'fixtures', 'find', 'a', 'tsconfig.json'));
	const inputs = [
		path.join('tests', 'fixtures', 'find', 'a', 'b', 'bar.ts'),
		path.join('.', 'tests', 'fixtures', 'find', 'a', 'b', 'bar.ts'),
		path.resolve('tests', 'fixtures', 'find', 'a', 'b', 'bar.ts')
	];
	for (const input of inputs) {
		const tsconfig = await findNative(input);
		assert.is(tsconfig, expected, `input: ${input}`);
	}
});

test('should reject when no tsconfig file was found', async () => {
	const input = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
	try {
		await findNative(input);
		assert.unreachable(`unexpectedly found tsconfig for ${input}`);
	} catch (e) {
		if (e.code === 'ERR_ASSERTION') {
			throw e;
		}
		assert.equal(e.message, 'no tsconfig file found for ' + input);
	}
});

test.run();
