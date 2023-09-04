import { describe, it, expect } from 'vitest';
import path from 'node:path';
import os from 'os';
import { find } from '../src/find.js';
import { absFixture, absRoot, relFixture } from './util/fixture-paths.js';
import { TSConfckCache } from '../src/cache.js';

describe('find', () => {
	it('should be a function', () => {
		expect(find).toBeTypeOf('function');
	});

	it('should return a Promise', () => {
		expect(find('str')).toBeInstanceOf(Promise);
	});

	it('should reject for invalid filename arg', async () => {
		for (const filename of [{}, [], 0, null, undefined]) {
			await expect(find(filename), `filename type: ${typeof filename}`).rejects.toThrow();
		}
		await expect(find(), 'no filename arg').rejects.toThrow();
		await expect(find('str'), `filename string arg`).resolves.toEqual(absRoot('tsconfig.json'));
	});

	it('should find tsconfig in same directory', async () => {
		const fixtureDir = 'find/a';
		const expected = absFixture(`${fixtureDir}/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await find(input), `input: ${input}`).toBe(expected);
		}
	});

	it('should find tsconfig in parent directory', async () => {
		const fixtureDir = 'find/a';
		const expected = absFixture(`${fixtureDir}/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/b/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/b/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await find(input), `input: ${input}`).toBe(expected);
		}
	});

	it('should ignore tsconfig in node_modules directory', async () => {
		const fixtureDir = 'find/a';
		const expected = absFixture(`${fixtureDir}/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await find(input), `input: ${input}`).toBe(expected);
		}
	});

	it('should find tsconfig in node_modules directory with scanNodeModules=true', async () => {
		const fixtureDir = 'find/a';
		const expected = absFixture(`${fixtureDir}/node_modules/some-lib/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await find(input, { scanNodeModules: true }), `input: ${input}`).toBe(expected);
		}
	});

	it('should stop searching at root', async () => {
		const fixtureDir = 'find-root/a';
		const relativeTS = relFixture(`${fixtureDir}/b/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/b/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];

		for (const input of inputs) {
			expect(await find(input, { root: absFixture(fixtureDir) })).toBe(null);
		}
	});

	it('should use provided cache', async () => {
		const fixtureDir = 'find-root';
		const relativeTS = relFixture(`${fixtureDir}/a/b/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/a/b/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		const real = absFixture(`${fixtureDir}/tsconfig.json`);
		const fake = absFixture(`${fixtureDir}/a/tsconfig.json`);

		const cache = new TSConfckCache();
		cache.setTSConfigPath(path.dirname(fake), Promise.resolve(fake));

		for (const input of inputs) {
			expect(await find(input), `input: ${input}`).toBe(real);
			expect(await find(input, { cache }), `input: ${input}`).toBe(fake);
		}
		const added_key = path.dirname(absoluteTS);
		expect(cache.hasTSConfigPath(added_key)).toBe(true);
		expect(await cache.getTSConfigPath(added_key)).toBe(fake);
	});

	it('should return null when no tsconfig file was found', async () => {
		const doesntExist = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
		expect(await find(doesntExist)).toBe(null);
	});

	it('should cache and return null when no tsconfig file was found', async () => {
		const doesntExist = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
		const cache = new TSConfckCache();
		expect(await find(doesntExist, { cache })).toBe(null);
		const parent = path.dirname(doesntExist);
		expect(cache.hasTSConfigPath(parent)).toBe(true);
		expect(await cache.getTSConfigPath(parent)).toBe(null);
		expect(await find(doesntExist, { cache })).toBe(null);
	});
});
