import { suite } from 'uvu';
import * as assert from 'uvu/assert';
// @ts-ignore
// eslint-disable-next-line node/no-missing-import
import * as dist from '../dist/index.cjs';
import * as path from 'path';
import * as os from 'os';
const { findTSConfig } = dist;
const test = suite('findTSConfig');

test('should be a function', () => {
	assert.type(findTSConfig, 'function');
});

test('should validate filename arg as string', async () => {
	// TODO rewrite to assert.rejects once https://github.com/lukeed/uvu/pull/132 landed
	for (const filename of [{}, [], 0, null, undefined]) {
		const result = await findTSConfig(filename).then(
			(x: any) => x,
			(x: any) => x
		);
		assert.instance(result, TypeError, `filename type: ${typeof filename}`);
	}
	const notSetResult = await findTSConfig().then(
		(x: any) => x,
		(x: any) => x
	);
	assert.instance(notSetResult, TypeError, `filename not set`);

	const strResult = await findTSConfig('str').then(
		(x: any) => x,
		(x: any) => x
	);
	assert.not.instance(strResult, TypeError, `filename type: string`);
});

test('should return a Promise', () => {
	assert.instance(findTSConfig('str'), Promise);
});

test('should find tsconfig in same directory', async () => {
	const expected = path.resolve('tests', 'fixtures', 'find-tsconfig', 'a', 'tsconfig.json');
	const inputs = [
		path.join('tests', 'fixtures', 'find-tsconfig', 'a', 'foo.ts'),
		path.join('.', 'tests', 'fixtures', 'find-tsconfig', 'a', 'foo.ts'),
		path.resolve('tests', 'fixtures', 'find-tsconfig', 'a', 'foo.ts')
	];
	for (const input of inputs) {
		const tsconfig = await findTSConfig(input);
		assert.is(tsconfig, expected, `input: ${input}`);
	}
});

test('should find tsconfig in parent directory', async () => {
	const expected = path.resolve('tests', 'fixtures', 'find-tsconfig', 'a', 'tsconfig.json');
	const inputs = [
		path.join('tests', 'fixtures', 'find-tsconfig', 'a', 'b', 'bar.ts'),
		path.join('.', 'tests', 'fixtures', 'find-tsconfig', 'a', 'b', 'bar.ts'),
		path.resolve('tests', 'fixtures', 'find-tsconfig', 'a', 'b', 'bar.ts')
	];
	for (const input of inputs) {
		const tsconfig = await findTSConfig(input);
		assert.is(tsconfig, expected, `input: ${input}`);
	}
});

test('should not find tsconfig when missing', async () => {
	const input = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
	const tsconfig = await findTSConfig(input);
	assert.is(tsconfig, null, `input: ${input}`);
});

test.run();
