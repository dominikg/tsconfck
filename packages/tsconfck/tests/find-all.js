import { describe, it, expect } from 'vitest';
import { findAll } from '../src/find-all.js';
import { absFixture, globFixtures } from './util/fixture-paths.js';

describe('find-all', () => {
	it('should be a function', () => {
		expect(findAll).toBeTypeOf('function');
	});

	it('should return a Promise', () => {
		expect(findAll('str')).toBeInstanceOf(Promise);
	});

	it('should reject for invalid dir arg', async () => {
		for (const dir of [{}, [], 0, null, undefined]) {
			await expect(findAll(dir), `dir type: ${typeof dir}`).rejects.toThrow();
		}
		await expect(findAll(), 'no dir arg').rejects.toThrow();
		await expect(findAll('doesnotexist'), `filename string arg`).resolves.toEqual([]);
	});

	it('should find tsconfig in same directory', async () => {
		const fixtureDir = 'find/a';
		const expected = absFixture(`${fixtureDir}/tsconfig.json`);
		const found = await findAll(absFixture(fixtureDir));
		expect(found).toEqual([expected]);
	});

	it('should find tsconfig in child directory', async () => {
		const fixtureDir = 'find';
		const expected = absFixture(`${fixtureDir}/a/tsconfig.json`);
		const found = await findAll(absFixture(fixtureDir));
		expect(found).toEqual([expected]);
	});

	it('should find multiple tsconfig in child directories', async () => {
		const fixtureDir = absFixture('find-all/multiple');
		const expected = await globFixtures('find-all/multiple/**/tsconfig.json');
		const found = (await findAll(fixtureDir)).sort();
		expect(found, `found all tsconfig in ${fixtureDir}`).toEqual(expected);
	});

	it('should handle directories with recursive symlinks', async () => {
		const fixtureDir = absFixture('find-all/recursive-symlink');

		const expected = [`${fixtureDir}/tsconfig.json`, `${fixtureDir}/child/tsconfig.json`].sort();
		const found = (await findAll(fixtureDir)).sort();
		expect(found, `found all tsconfig in ${fixtureDir}`).toEqual(expected);
	});
});
/*








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

const test_inaccessible = suite('findAll inaccessible');
const inaccessible = path.resolve(
	'tests',
	'fixtures',
	'find-all',
	'inaccessible-dir',
	'_inaccessible'
);
test_inaccessible.before(() => {
	fs.mkdirSync(inaccessible);
	fs.chmodSync(inaccessible, 0o000);
});

test_inaccessible.after(() => {
	fs.chmodSync(inaccessible, 0o777);
	fs.rmdirSync(inaccessible);
});
test_inaccessible('should handle directories with inaccessible children', async () => {
	assert.equal(true, fs.existsSync(inaccessible));
	const expected = [
		path.resolve('tests', 'fixtures', 'find-all', 'inaccessible-dir', 'tsconfig.json')
	];
	expected.sort();
	const found = await findAll(path.join('tests', 'fixtures', 'find-all', 'inaccessible-dir'));
	found.sort();
	assert.equal(found, expected, 'found all tsconfig in test/fixtures/find-all/inaccessible-dir');
});

test_inaccessible.run();

*/
