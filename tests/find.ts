import { suite } from 'uvu';
import assert from 'uvu/assert';
// @ts-ignore
// eslint-disable-next-line node/no-missing-import
import dist from '../dist/index.cjs';
import path from 'path';
import os from 'os';
const { find } = dist;
const test = suite('find');

test('should be a function', () => {
	assert.type(find, 'function');
});

test('should return a Promise', () => {
	assert.instance(find('str'), Promise);
});

test('should reject for invalid filename arg', async () => {
	// TODO rewrite to assert.rejects once https://github.com/lukeed/uvu/pull/132 landed
	for (const filename of [{}, [], 0, null, undefined]) {
		const result = await find(filename).then(
			() => 'resolved',
			() => 'rejected'
		);
		assert.is(result, 'rejected', `filename type: ${typeof filename}`);
	}
	const notSetResult = await find().then(
		() => 'resolved',
		() => 'rejected'
	);
	assert.is(notSetResult, 'rejected', `filename not set`);

	const strResult = await find('str').then(
		() => 'resolved',
		() => 'rejected'
	);
	assert.is(strResult, 'resolved', `filename type: string`);
});

test('should find tsconfig in same directory', async () => {
	const expected = path.resolve('tests', 'fixtures', 'find', 'a', 'tsconfig.json');
	const inputs = [
		path.join('tests', 'fixtures', 'find', 'a', 'foo.ts'),
		path.join('.', 'tests', 'fixtures', 'find', 'a', 'foo.ts'),
		path.resolve('tests', 'fixtures', 'find', 'a', 'foo.ts')
	];
	for (const input of inputs) {
		const tsconfig = await find(input);
		assert.is(tsconfig, expected, `input: ${input}`);
	}
});

test('should find tsconfig in parent directory', async () => {
	const expected = path.resolve('tests', 'fixtures', 'find', 'a', 'tsconfig.json');
	const inputs = [
		path.join('tests', 'fixtures', 'find', 'a', 'b', 'bar.ts'),
		path.join('.', 'tests', 'fixtures', 'find', 'a', 'b', 'bar.ts'),
		path.resolve('tests', 'fixtures', 'find', 'a', 'b', 'bar.ts')
	];
	for (const input of inputs) {
		const tsconfig = await find(input);
		assert.is(tsconfig, expected, `input: ${input}`);
	}
});

test('should not find tsconfig when missing', async () => {
	const input = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
	const tsconfig = await find(input);
	assert.is(tsconfig, null, `input: ${input}`);
});

test.run();
