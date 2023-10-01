import { describe, it, expect } from 'vitest';
import path from 'node:path';
import os from 'os';
import { findNative } from '../src/find-native.js';
import { absFixture, absRoot, posixAbsFix, relFixture } from './util/fixture-paths.js';
import { native2posix } from '../src/util.js';
import { TSConfckCache } from '../src/cache.js';

describe('find-native', () => {
	it('should be a function', () => {
		expect(findNative).toBeTypeOf('function');
	});

	it('should return a Promise', () => {
		expect(findNative('str')).toBeInstanceOf(Promise);
	});

	it('should reject for invalid filename arg', async () => {
		for (const filename of [{}, [], 0, null, undefined]) {
			await expect(findNative(filename), `filename type: ${typeof filename}`).rejects.toThrow();
		}
		await expect(findNative(), 'no filename arg').rejects.toThrow();
		await expect(findNative('str'), `filename string arg`).resolves.toEqual(
			native2posix(absRoot('tsconfig.json'))
		);
	});

	it('should find tsconfig in same directory', async () => {
		const fixtureDir = 'find/a';
		const expected = posixAbsFix(`${fixtureDir}/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await findNative(input), `input: ${input}`).toBe(expected);
		}
	});

	it('should find tsconfig in parent directory', async () => {
		const fixtureDir = 'find/a';
		const expected = posixAbsFix(`${fixtureDir}/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/b/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/b/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await findNative(input), `input: ${input}`).toBe(expected);
		}
	});

	it('should find jsconfig with configName=jsconfig.json', async () => {
		const fixtureDir = 'find/a/b/c';
		const expected = posixAbsFix(`${fixtureDir}/jsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/y.js`);
		const absoluteTS = absFixture(`${fixtureDir}/y.js`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await findNative(input, { configName: 'jsconfig.json' }), `input: ${input}`).toBe(
				expected
			);
		}
	});

	it('should find jsconfig in parent directory with configName=jsconfig.json', async () => {
		const fixtureDir = 'find/a';
		const expected = posixAbsFix(`${fixtureDir}/jsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/b/qoox.js`);
		const absoluteTS = absFixture(`${fixtureDir}/b/qoox.js`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await findNative(input, { configName: 'jsconfig.json' }), `input: ${input}`).toBe(
				expected
			);
		}
	});

	it('should ignore jsconfig without configName=jsconfig.json', async () => {
		const fixtureDir = 'find/a/b/c';
		const expected = posixAbsFix(`find/a/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/x.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/x.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await findNative(input), `input: ${input}`).toBe(expected);
		}
	});

	it('should ignore files in node_modules directory with ignoreNodeModules=true', async () => {
		const fixtureDir = 'find/a';
		const relativeTS = relFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await findNative(input, { ignoreNodeModules: true }), `input: ${input}`).toBe(null);
		}
	});

	it('should ignore files in node_modules directory with ignoreNodeModules=true and configName=jsconfig.json', async () => {
		const fixtureDir = 'find/a';
		const relativeTS = relFixture(`${fixtureDir}/node_modules/some-js-lib/src/foo.js`);
		const absoluteTS = absFixture(`${fixtureDir}/node_modules/some-js-lib/src/foo.js`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(
				await findNative(input, { ignoreNodeModules: true, configName: 'jsconfig.json' }),
				`input: ${input}`
			).toBe(null);
		}
	});

	it('should find tsconfig in node_modules', async () => {
		const fixtureDir = 'find/a';
		const expected = posixAbsFix(`${fixtureDir}/node_modules/some-lib/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/node_modules/some-lib/src/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await findNative(input), `input: ${input}`).toBe(expected);
		}
	});

	it('should find jsconfig in node_modules with configName=jsconfig.json', async () => {
		const fixtureDir = 'find/a';
		const expected = posixAbsFix(`${fixtureDir}/node_modules/some-js-lib/jsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/node_modules/some-js-lib/src/foo.js`);
		const absoluteTS = absFixture(`${fixtureDir}/node_modules/some-js-lib/src/foo.js`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await findNative(input, { configName: 'jsconfig.json' }), `input: ${input}`).toBe(
				expected
			);
		}
	});

	it('should stop searching at root', async () => {
		const fixtureDir = 'find-root/a';
		const relativeTS = relFixture(`${fixtureDir}/b/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/b/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];

		for (const input of inputs) {
			expect(await findNative(input, { root: absFixture(fixtureDir) })).toBe(null);
		}
	});

	it('should use provided cache', async () => {
		const fixtureDir = 'find-root';
		const relativeTS = relFixture(`${fixtureDir}/a/b/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/a/b/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		const real = absFixture(`${fixtureDir}/tsconfig.json`);
		const expected = native2posix(real);
		const cache = new TSConfckCache();
		for (const input of inputs) {
			expect(await findNative(input, { cache }), `input: ${input}`).toBe(expected);
		}
		const dir = path.dirname(absoluteTS);
		expect(cache.hasConfigPath(dir)).toBe(true);
		expect(await cache.getConfigPath(dir)).toBe(expected);
		const parent = path.dirname(dir);
		expect(cache.hasConfigPath(parent)).toBe(true);
		expect(await cache.getConfigPath(parent)).toBe(expected);
		const root = path.dirname(real);
		expect(cache.hasConfigPath(root)).toBe(true);
		expect(await cache.getConfigPath(root)).toBe(expected);
		[dir, parent, root].forEach((d) => {
			cache.setConfigPath(d, Promise.resolve('fake'));
		});
		for (const input of inputs) {
			expect(await findNative(input, { cache }), `input: ${input}`).toBe('fake');
		}
	});

	it('should return null when no tsconfig file was found', async () => {
		const doesntExist = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
		expect(await findNative(doesntExist)).toBe(null);
	});

	it('should cache and return null when no tsconfig file was found', async () => {
		const doesntExist = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
		const cache = new TSConfckCache();
		expect(await findNative(doesntExist, { cache })).toBe(null);
		const parent = path.dirname(doesntExist);
		expect(cache.hasConfigPath(parent)).toBe(true);
		expect(await cache.getConfigPath(parent)).toBe(null);
		expect(await findNative(doesntExist, { cache })).toBe(null);
	});

	it('should work with different configNames in the same cache', async () => {
		const fixtureDir = 'find/a';
		const jsFile = relFixture(`${fixtureDir}/b/c/y.js`);
		const expectedJSConfig = posixAbsFix(`${fixtureDir}/b/c/jsconfig.json`);
		const tsFile = relFixture(`${fixtureDir}/b/c/x.ts`);
		const expectedTSConfig = posixAbsFix(`${fixtureDir}/tsconfig.json`);
		const cache = new TSConfckCache();
		const actualJSConfig = await findNative(jsFile, { cache, configName: 'jsconfig.json' });
		const actualTSConfig = await findNative(tsFile, { cache });
		expect(actualJSConfig).toBe(expectedJSConfig);
		expect(actualTSConfig).toBe(expectedTSConfig);
		expect(cache.getConfigPath(posixAbsFix(`${fixtureDir}`))).toBe(expectedTSConfig);
		expect(cache.getConfigPath(posixAbsFix(`${fixtureDir}/b`))).toBe(expectedTSConfig);
		expect(cache.getConfigPath(posixAbsFix(`${fixtureDir}/b/c`))).toBe(expectedTSConfig);
		expect(cache.getConfigPath(posixAbsFix(`${fixtureDir}`), 'jsconfig.json')).toBe(undefined);
		expect(cache.getConfigPath(posixAbsFix(`${fixtureDir}/b`), 'jsconfig.json')).toBe(undefined);
		expect(cache.getConfigPath(posixAbsFix(`${fixtureDir}/b/c`), 'jsconfig.json')).toBe(
			expectedJSConfig
		);
	});
});
