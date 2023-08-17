import path from 'node:path';
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

		const expected = [
			path.join(fixtureDir, 'tsconfig.json'),
			path.join(fixtureDir, 'child', 'tsconfig.json')
		].sort();
		const found = (await findAll(fixtureDir)).sort();
		expect(found, `found all tsconfig in ${fixtureDir}`).toEqual(expected);
	});
});
