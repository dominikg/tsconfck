import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { parseNative, TSConfckParseNativeError } from '../src/parse-native.js';
import os from 'os';

import { absFixture, globFixtures } from './util/fixture-paths.js';
import { expectToMatchErrorSnap, expectToMatchSnap } from './util/expect.js';
import { copyFixtures } from './util/copy-fixtures.js';
import glob from 'tiny-glob';
import { promises as fs } from 'node:fs';
import { transform as esbuildTransform } from 'esbuild';
import ts from 'typescript';
import { TSConfckCache } from '../src/cache.js';

const ts_ver = ts.version.slice(3).split('.');
const IS_TS_5_5 = ts_ver[0] >= 5 && ts_ver[1] >= 5;

describe('parse', () => {
	it('should be a function', () => {
		expect(parseNative).toBeTypeOf('function');
	});

	it('should return a Promise', () => {
		expect(parseNative('str')).toBeInstanceOf(Promise);
	});

	it('should reject for invalid filename arg', async () => {
		for (const filename of [{}, [], 0, null, undefined]) {
			await expect(parseNative(filename), `filename type: ${typeof filename}`).rejects.toThrow();
		}
		await expect(parseNative(), 'no filename arg').rejects.toThrow();
		await expect(parseNative('str'), `filename string arg`).resolves.toHaveProperty('tsconfigFile');
	});

	it('should reject for not existing json file', async () => {
		await expect(parseNative('doesntexist.json')).rejects.toThrow();
	});

	it('should reject for directory named tsconfig.json', async () => {
		await expect(parseNative(absFixture('parse/invalid/tsconfig.json'))).rejects.toThrow(
			/exists but is not a regular file/
		);
	});

	it('should resolve with empty result when no tsconfig is found', async () => {
		const doesntExist = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
		expect(await parseNative(doesntExist)).toEqual({
			tsconfigFile: null,
			tsconfig: {},
			result: null
		});
	});

	it('should resolve with expected valid tsconfig.json', async () => {
		const samples = await globFixtures('parse/valid/**/tsconfig.json');
		for (const filename of samples) {
			if (!IS_TS_5_5 && filename.includes('configDir')) {
				continue; // configDir doesn't work in 5.4
			}
			const actual = await parseNative(filename);
			expect(actual.tsconfigFile).toBe(filename);
			await expectToMatchSnap(actual.tsconfig, `input: ${filename}`, filename, 'parse-native');
		}
	});

	it('should resolve with expected valid jsconfig.json with configName=jsconfig.json', async () => {
		const samples = await globFixtures('parse/valid/**/jsconfig.json');
		for (const filename of samples) {
			const actual = await parseNative(filename, { configName: 'jsconfig.json' });
			expect(actual.tsconfigFile).toBe(filename);
			await expectToMatchSnap(actual.tsconfig, `input: ${filename}`, filename, 'parse-native');
		}
	});

	it('should resolve with expected tsconfig.json for valid tsconfig that is part of a solution', async () => {
		const samples = await globFixtures('parse/solution/**/tsconfig.json');
		for (const filename of samples) {
			const actual = await parseNative(filename);
			expect(actual.tsconfigFile).toBe(filename);
			await expectToMatchSnap(actual.tsconfig, `input: ${filename}`, filename, 'parse-native');
		}
	});

	it('should resolve with expected jsconfig.json for valid jsconfig that is part of a solution', async () => {
		const samples = await globFixtures('parse/solution/jsconfig/**/jsconfig.json');
		for (const filename of samples) {
			const actual = await parseNative(filename, { configName: 'jsconfig.json' });
			expect(actual.tsconfigFile).toBe(filename);
			await expectToMatchSnap(actual.tsconfig, `input: ${filename}`, filename, 'parse-native');
		}
	});

	it('should resolve with expected tsconfig.json for ts file that is part of a solution', async () => {
		const samples = await globFixtures('/parse/solution/**/*.{ts,mts,cts}');
		for (const filename of samples) {
			const actual = await parseNative(filename);
			await expectToMatchSnap(
				actual.tsconfig,
				`input: ${filename}`,
				filename,
				'tsconfig.parse-native.json'
			);
		}
	});

	it('should resolve with expected tsconfig.json for ts file that is part of a solution', async () => {
		const samples = await globFixtures('/parse/solution/jsconfig/**/*.{js,mjs,cjs}');
		for (const filename of samples) {
			const actual = await parseNative(filename, { configName: 'jsconfig.json' });
			await expectToMatchSnap(
				actual.tsconfig,
				`input: ${filename}`,
				filename,
				'jsconfig.parse-native.json'
			);
		}
	});

	it('should work with cache', async () => {
		// use the more interesting samples with extensions and solution-style
		const samples = [
			...(await globFixtures('parse/valid/with_extends/**/tsconfig.json')),
			...(await globFixtures('parse/solution/**/*.ts'))
		];
		const cache = new TSConfckCache();
		for (const filename of samples) {
			expect(cache.hasParseResult(filename), `cache does not exist for ${filename}`).toBe(false);
			const actual = await parseNative(filename, { cache });
			await expectToMatchSnap(
				actual.tsconfig,
				`input: ${filename}`,
				filename,
				filename.endsWith('tsconfig.json') ? 'parse-native' : '.tsconfig.parse-native.json'
			);
			expect(cache.hasParseResult(filename), `cache exists for ${filename}`).toBe(true);
			const cached = cache.getParseResult(filename);
			expect(cached.tsconfig, `input: ${filename} cached tsconfig is equal`).toEqual(
				actual.tsconfig
			);
			const reparsedResult = await parseNative(filename, { cache });
			expect(reparsedResult, `reparsedResult was returned from cache for ${filename}`).toBe(cached);

			if (filename.endsWith('.ts')) {
				expect(
					cache.hasParseResult(actual.tsconfigFile),
					`cache exists for ${actual.tsconfigFile}`
				).toBe(true);
				const cachedByResultFilename = cache.getParseResult(actual.tsconfigFile);
				expect(
					cachedByResultFilename.tsconfig,
					`cache of ${actual.tsconfigFile} matches for: ${filename}`
				).toBe(actual.tsconfig);
				const reparsedByResultFilename = await parseNative(actual.tsconfigFile, { cache });
				expect(
					reparsedByResultFilename,
					`reparsedByResultFilename was returned from cache for ${actual.tsconfigFile}`
				).toBe(cachedByResultFilename);
			}
			await cache.clear();
			const newParse = await parseNative(filename, { cache });
			expect(newParse, `input: ${filename} new parse is different object from old cached`).not.toBe(
				cached
			);
			expect(cache.hasParseResult(filename), `cache exists again after clear for ${filename}`).toBe(
				true
			);
			const newCached = cache.getParseResult(filename);
			expect(newCached, `input: ${filename} new cache different object from old cached`).not.toBe(
				cached
			);
			expect(newParse, `input: ${filename} cached again`).toBe(newCached);
		}
	});

	it('should resolve with tsconfig that is isomorphic', async () => {
		const tempDir = await copyFixtures(
			'parse/valid',
			'parse-isomorphic-native',
			(x) => x.isDirectory() || x.name.startsWith('tsconfig')
		);
		const samples = await glob(`${tempDir}/**/tsconfig.json`);
		for (const filename of samples) {
			const result = await parseNative(filename);
			await fs.copyFile(filename, `${filename}.orig`);
			await fs.writeFile(filename, JSON.stringify(result.tsconfig, null, 2));
			const result2 = await parseNative(filename);
			expect(result2.tsconfig, `filename: ${filename}`).toEqual(result.tsconfig);
		}
	});

	it('should resolve with tsconfig that works when transpiling', async () => {
		const samples = await globFixtures('transpile/**/tsconfig.json');
		for (const filename of samples) {
			const { tsconfig } = await parseNative(filename);
			const inputFiles = await glob(filename.replace('tsconfig.json', '**/input.ts'));
			for (const inputFile of inputFiles) {
				const input = await fs.readFile(inputFile, 'utf-8');
				const esbuildResult = (
					await esbuildTransform(input, { loader: 'ts', tsconfigRaw: tsconfig })
				).code;
				await expectToMatchSnap(
					esbuildResult,
					`esbuild transpile result for ${inputFile} with ${filename}`,
					inputFile,
					'.esbuild.parse-native.js'
				);
				const tsResult = ts.transpile(input, tsconfig.compilerOptions);
				await expectToMatchSnap(
					tsResult,
					`ts transpile result for ${inputFile} with ${filename}`,
					inputFile,
					'.typescript.parse-native.js'
				);
			}
		}
	});

	it('should reject with correct error for invalid tsconfig.json', async () => {
		let samples = await globFixtures('parse/invalid/**/tsconfig.json');
		const excluded = [
			path.join('extends-fallback-not-found', 'dir'),
			path.join('invalid', 'tsconfig.json') // directory, not a file, does
		];
		samples = samples.filter((sample) => !excluded.some((excluded) => sample.includes(excluded)));
		for (const filename of samples) {
			try {
				await parseNative(filename);
				expect.unreachable(`parse for ${filename} did not reject`);
			} catch (e) {
				expect(e).toBeInstanceOf(TSConfckParseNativeError);
				expect(e.tsconfigFile).toBe(filename);
				await expectToMatchErrorSnap(`${e.code}: ${e.message}`, filename, 'parse-native');
			}
		}
	});

	it('should cache error for invalid tsconfig.json', async () => {
		let samples = await globFixtures('parse/invalid/**/tsconfig.json');
		const excluded = [
			path.join('extends-fallback-not-found', 'dir'),
			path.join('invalid', 'tsconfig.json') // directory, not a file, does
		];
		samples = samples.filter((sample) => !excluded.some((excluded) => sample.includes(excluded)));
		const cache = new TSConfckCache();
		for (const filename of samples) {
			expect(cache.hasParseResult(filename)).toBe(false);
			let error;
			try {
				await parseNative(filename, { cache });
				expect.unreachable(`parse for ${filename} did not reject`);
			} catch (e) {
				expect(e).toBeInstanceOf(TSConfckParseNativeError);
				expect(e.tsconfigFile).toBe(filename);
				error = e;
			}
			expect(cache.hasParseResult(filename)).toBe(true);
			try {
				await cache.getParseResult(filename);
				expect.unreachable(`cache.getParseResult for ${filename} did not reject`);
			} catch (e) {
				expect(e).toBe(error);
			}
		}
	});

	it('should prevent typescript file scanning when ignoreSourceFiles: true is set', async () => {
		// use the more interesting samples with extensions and solution-style
		const samples = [
			...(await globFixtures('parse/valid/with_extends/**/tsconfig.json')),
			...(await globFixtures('parse/solution/**/*.ts'))
		];

		for (const filename of samples) {
			const actual = await parseNative(filename, { ignoreSourceFiles: true });
			await expectToMatchSnap(
				actual.tsconfig,
				`ignoreSourceFiles with ${filename}`,
				filename,
				filename.endsWith('tsconfig.json')
					? 'parse-native.ignore-files'
					: '.tsconfig.parse-native.ignore-files.json'
			);
			expect(actual.result.fileNames.length, `ignoreSourceFiles with ${filename}`).toBe(0);
		}
	});
});
