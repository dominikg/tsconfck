import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import path from 'path';
import os from 'os';
import { findNative } from '../../src/sync/find-native.js';
import { native2posix } from '../../src/util.js';
const test = suite('sync/findNative');

test('should be a function', () => {
	assert.type(findNative, 'function');
});

test('should return a string', () => {
	const result = findNative('str');
	console.log('result', result);
	assert.type(result, 'string');
});

test('should reject for invalid filename arg', () => {
	// TODO rewrite to assert.rejects once https://github.com/lukeed/uvu/pull/132 landed
	for (const filename of [{}, [], 0, null, undefined]) {
		// @ts-ignore
		assert.throws(() => findNative(filename), undefined, `filename type: ${typeof filename}`);
	}
	// @ts-ignore
	assert.throws(() => findNative(), undefined, `filename type: undefined`);

	assert.not.throws(() => findNative('str'), undefined, `filename type: string`);
});

test('should find tsconfig in same directory', () => {
	const expected = native2posix(path.resolve('tests', 'fixtures', 'find', 'a', 'tsconfig.json'));
	const inputs = [
		path.join('tests', 'fixtures', 'find', 'a', 'foo.ts'),
		path.join('.', 'tests', 'fixtures', 'find', 'a', 'foo.ts'),
		path.resolve('tests', 'fixtures', 'find', 'a', 'foo.ts')
	];
	for (const input of inputs) {
		const tsconfig = findNative(input);
		assert.is(tsconfig, expected, `input: ${input}`);
	}
});

test('should find tsconfig in parent directory', () => {
	const expected = native2posix(path.resolve('tests', 'fixtures', 'find', 'a', 'tsconfig.json'));
	const inputs = [
		path.join('tests', 'fixtures', 'find', 'a', 'b', 'bar.ts'),
		path.join('.', 'tests', 'fixtures', 'find', 'a', 'b', 'bar.ts'),
		path.resolve('tests', 'fixtures', 'find', 'a', 'b', 'bar.ts')
	];
	for (const input of inputs) {
		const tsconfig = findNative(input);
		assert.is(tsconfig, expected, `input: ${input}`);
	}
});

test('should reject when no tsconfig file was found', () => {
	const input = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
	try {
		findNative(input);
		assert.unreachable(`unexpectedly found tsconfig for ${input}`);
	} catch (e) {
		if (e.code === 'ERR_ASSERTION') {
			throw e;
		}
		assert.equal(e.message, 'no tsconfig file found for ' + input);
	}
});

test.run();
