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

	it('should find jsconfig with configName=jsconfig.json', async () => {
		const fixtureDir = 'find/a/b/c';
		const expected = absFixture(`${fixtureDir}/jsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/y.js`);
		const absoluteTS = absFixture(`${fixtureDir}/y.js`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await find(input, { configName: 'jsconfig.json' }), `input: ${input}`).toBe(expected);
		}
	});

	it('should find jsconfig in parent directory with configName=jsconfig.json', async () => {
		const fixtureDir = 'find/a';
		const expected = absFixture(`${fixtureDir}/jsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/b/qoox.js`);
		const absoluteTS = absFixture(`${fixtureDir}/b/qoox.js`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await find(input, { configName: 'jsconfig.json' }), `input: ${input}`).toBe(expected);
		}
	});

	it('should ignore jsconfig without configName=jsconfig.json', async () => {
		const fixtureDir = 'find/a/b/c';
		const expected = absFixture(`find/a/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/x.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/x.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await find(input), `input: ${input}`).toBe(expected);
		}
	});

	it('should ignore files in node_modules directory with ignoreNodeModules=true', async () => {
		const fixtureDir = 'find/a';
		const relativeTS = relFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await find(input, { ignoreNodeModules: true }), `input: ${input}`).toBe(null);
		}
	});

	it('should ignore files in node_modules directory with ignoreNodeModules=true and configName=jsconfig.json', async () => {
		const fixtureDir = 'find/a';
		const relativeTS = relFixture(`${fixtureDir}/node_modules/some-js-lib/src/foo.js`);
		const absoluteTS = absFixture(`${fixtureDir}/node_modules/some-js-lib/src/foo.js`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(
				await find(input, { ignoreNodeModules: true, configName: 'jsconfig.json' }),
				`input: ${input}`
			).toBe(null);
		}
	});

	it('should find tsconfig in node_modules', async () => {
		const fixtureDir = 'find/a';
		const expected = absFixture(`${fixtureDir}/node_modules/some-lib/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await find(input), `input: ${input}`).toBe(expected);
		}
	});

	it('should find jsconfig in node_modules with configName=jsconfig.json', async () => {
		const fixtureDir = 'find/a';
		const expected = absFixture(`${fixtureDir}/node_modules/some-js-lib/jsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/node_modules/some-js-lib/src/foo.js`);
		const absoluteTS = absFixture(`${fixtureDir}/node_modules/some-js-lib/src/foo.js`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await find(input, { configName: 'jsconfig.json' }), `input: ${input}`).toBe(expected);
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
		for (const input of inputs) {
			expect(await find(input, { root: relFixture(fixtureDir) })).toBe(null);
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
		cache.setConfigPath(path.dirname(fake), Promise.resolve(fake));

		for (const input of inputs) {
			expect(await find(input), `input: ${input}`).toBe(real);
			expect(await find(input, { cache }), `input: ${input}`).toBe(fake);
		}
		const added_key = path.dirname(absoluteTS);
		expect(cache.hasConfigPath(added_key)).toBe(true);
		expect(await cache.getConfigPath(added_key)).toBe(fake);
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
		expect(cache.hasConfigPath(parent)).toBe(true);
		expect(await cache.getConfigPath(parent)).toBe(null);
		expect(await find(doesntExist, { cache })).toBe(null);
	});

	it('should work with different configNames in the same cache', async () => {
		const fixtureDir = 'find/a';
		const jsFile = relFixture(`${fixtureDir}/b/c/y.js`);
		const expectedJSConfig = absFixture(`${fixtureDir}/b/c/jsconfig.json`);
		const tsFile = relFixture(`${fixtureDir}/b/c/x.ts`);
		const expectedTSConfig = absFixture(`${fixtureDir}/tsconfig.json`);
		const cache = new TSConfckCache();
		const actualJSConfig = await find(jsFile, { cache, configName: 'jsconfig.json' });
		const actualTSConfig = await find(tsFile, { cache });
		expect(actualJSConfig).toBe(expectedJSConfig);
		expect(actualTSConfig).toBe(expectedTSConfig);
		expect(cache.getConfigPath(absFixture(`${fixtureDir}`))).toBe(expectedTSConfig);
		expect(cache.getConfigPath(absFixture(`${fixtureDir}/b`))).toBe(expectedTSConfig);
		expect(cache.getConfigPath(absFixture(`${fixtureDir}/b/c`))).toBe(expectedTSConfig);
		expect(cache.getConfigPath(absFixture(`${fixtureDir}`), 'jsconfig.json')).toBe(undefined);
		expect(cache.getConfigPath(absFixture(`${fixtureDir}/b`), 'jsconfig.json')).toBe(undefined);
		expect(cache.getConfigPath(absFixture(`${fixtureDir}/b/c`), 'jsconfig.json')).toBe(
			expectedJSConfig
		);
	});
});
