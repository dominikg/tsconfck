import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import glob from 'tiny-glob';
import fs from 'fs/promises';
import path from 'path';
import { toJson } from '../src/to-json.js';
const test = suite('toJson');

test('should be a function', () => {
	assert.type(toJson, 'function');
});

test('should return a String', () => {
	assert.is(typeof toJson('str'), 'string');
});

test('should throw for invalid tsconfigJson arg', () => {
	for (const tsconfigJson of [{}, [], 0, null, undefined]) {
		assert.throws(
			// @ts-ignore
			() => toJson(tsconfigJson),
			TypeError,
			`tsconfigJson type: ${typeof tsconfigJson}`
		);
	}
	// @ts-ignore
	assert.throws(() => toJson(), TypeError, 'tsConfigJson not set');
	assert.not.throws(() => toJson('str'));
});

test('should convert tsconfig.json to regular json', async () => {
	const samples = (await glob('tests/fixtures/files/valid/**/tsconfig.json')).map((file) =>
		path.resolve(file)
	);
	for (const filename of samples) {
		const tsconfigJson = await fs.readFile(filename, 'utf-8');
		const expected = await fs.readFile(
			filename.replace(/tsconfig.json$/, 'expected.json'),
			'utf-8'
		);
		const actual = toJson(tsconfigJson);
		assert.fixture(actual, expected, `testfile: ${filename}`);
		assert.not.throws(
			() => {
				JSON.parse(actual);
			},
			undefined,
			`testfile: ${filename}`
		);
	}
});

test.run();
