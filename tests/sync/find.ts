import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import path from 'path';
import os from 'os';
import { find } from '../../src/sync/find.js';
const test = suite('sync/find');

test('should be a function', () => {
	assert.type(find, 'function');
});

test('should return a string', () => {
	assert.type(find('str'), 'string');
});

test('should reject for invalid filename arg', () => {
	// TODO rewrite to assert.rejects once https://github.com/lukeed/uvu/pull/132 landed
	for (const filename of [{}, [], 0, null, undefined]) {
		// @ts-ignore
		assert.throws(() => find(filename), TypeError, `filename type: ${typeof filename}`);
	}
	// @ts-ignore
	assert.throws(() => find(), TypeError, `filename type: undefined`);

	assert.not.throws(() => find('str'), TypeError, `filename type: string`);
});

test('should find tsconfig in same directory', () => {
	const expected = path.resolve('tests', 'fixtures', 'find', 'a', 'tsconfig.json');
	const inputs = [
		path.join('tests', 'fixtures', 'find', 'a', 'foo.ts'),
		path.join('.', 'tests', 'fixtures', 'find', 'a', 'foo.ts'),
		path.resolve('tests', 'fixtures', 'find', 'a', 'foo.ts')
	];
	for (const input of inputs) {
		const tsconfig = find(input);
		assert.is(tsconfig, expected, `input: ${input}`);
	}
});

test('should find tsconfig in parent directory', () => {
	const expected = path.resolve('tests', 'fixtures', 'find', 'a', 'tsconfig.json');
	const inputs = [
		path.join('tests', 'fixtures', 'find', 'a', 'b', 'bar.ts'),
		path.join('.', 'tests', 'fixtures', 'find', 'a', 'b', 'bar.ts'),
		path.resolve('tests', 'fixtures', 'find', 'a', 'b', 'bar.ts')
	];
	for (const input of inputs) {
		const tsconfig = find(input);
		assert.is(tsconfig, expected, `input: ${input}`);
	}
});

test('should reject when no tsconfig file was found', () => {
	const input = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
	try {
		find(input);
		assert.unreachable(`unexpectedly found tsconfig for ${input}`);
	} catch (e) {
		if (e.code === 'ERR_ASSERTION') {
			throw e;
		}
		assert.equal(e.message, 'no tsconfig file found for ' + input);
	}
});

test.run();
