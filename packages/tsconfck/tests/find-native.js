import { describe, it, expect } from 'vitest';
import path from 'path';
import os from 'os';
import { findNative } from '../src/find-native.js';
import { absFixture, absRoot, relFixture } from './util/fixture-paths.js';

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
			absRoot('tsconfig.json')
		);
	});

	it('should find tsconfig in same directory', async () => {
		const fixtureDir = 'find/a';
		const expected = absFixture(`${fixtureDir}/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await findNative(input), `input: ${input}`).toBe(expected);
		}
	});

	it('should find tsconfig in parent directory', async () => {
		const fixtureDir = 'find/a';
		const expected = absFixture(`${fixtureDir}/tsconfig.json`);
		const relativeTS = relFixture(`${fixtureDir}/b/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/b/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		for (const input of inputs) {
			expect(await findNative(input), `input: ${input}`).toBe(expected);
		}
	});

	it('should reject when no tsconfig file was found', async () => {
		const doesntExist = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
		await expect(findNative(doesntExist)).rejects.toThrow(
			'no tsconfig file found for ' + doesntExist
		);
	});
});
