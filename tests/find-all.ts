import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import path from 'path';
import { findAll } from '../src/find-all.js';
import glob from 'tiny-glob';
const test = suite('findAll');

test('should be a function', () => {
	assert.type(findAll, 'function');
});

test('should return a Promise', () => {
	assert.instance(findAll('scripts'), Promise);
});

test('should reject for invalid dir arg', async () => {
	// TODO rewrite to assert.rejects once https://github.com/lukeed/uvu/pull/132 landed
	for (const dir of [{}, [], 0, null, undefined]) {
		// @ts-ignore
		const result = await findAll(dir).then(
			() => 'resolved',
			() => 'rejected'
		);
		assert.is(result, 'rejected', `dir type: ${typeof dir}`);
	}
	// @ts-ignore
	const notSetResult = await findAll().then(
		() => 'resolved',
		() => 'rejected'
	);
	assert.is(notSetResult, 'rejected', `dir not set`);

	const strResult = await findAll('scripts').then(
		() => 'resolved',
		() => 'rejected'
	);
	assert.is(strResult, 'resolved', `dir type: string`);
});

test('should find tsconfig in same directory', async () => {
	const expected = path.resolve('tests', 'fixtures', 'find', 'a', 'tsconfig.json');
	const found = await findAll(path.join('tests', 'fixtures', 'find', 'a'));
	assert.is(found.length, 1, 'found 1 tsconfig');
	assert.is(found[0], expected, 'found expected');
});

test('should find tsconfig in child directory', async () => {
	const expected = path.resolve('tests', 'fixtures', 'find', 'a', 'tsconfig.json');
	const found = await findAll(path.join('tests', 'fixtures', 'find'));
	assert.is(found.length, 1, 'found 1 tsconfig');
	assert.is(found[0], expected, 'found expected');
});

test('should find multiple tsconfig in child directories', async () => {
	const expected = (await glob('tests/fixtures/**/tsconfig.json')).map((file) =>
		path.resolve(file)
	);
	expected.sort();
	const found = await findAll(path.join('tests', 'fixtures'));
	found.sort();
	assert.equal(found, expected, 'found all tsconfig in test/fixtures');
});

test('should handle directories with recursive symlinks', async () => {
	const expected = [
		path.resolve('tests', 'fixtures', 'find-all', 'recursive-symlink', 'tsconfig.json'),
		path.resolve('tests', 'fixtures', 'find-all', 'recursive-symlink', 'child', 'tsconfig.json')
	];
	expected.sort();
	const found = await findAll(path.join('tests', 'fixtures', 'find-all', 'recursive-symlink'));
	found.sort();
	assert.equal(found, expected, 'found all tsconfig in test/fixtures/find-all/recursive-symlink');
});
test.run();

test('should exclude skipped directories', async () => {
	const expected = [
		path.resolve('tests', 'fixtures', 'find-all', 'recursive-symlink', 'tsconfig.json')
	];
	expected.sort();
	const found = await findAll(path.join('tests', 'fixtures', 'find-all', 'recursive-symlink'), {
		skip: (dir) => dir === 'child'
	});
	found.sort();
	assert.equal(
		found,
		expected,
		'found filtered tsconfig in test/fixtures/find-all/recursive-symlink'
	);
});
test.run();
