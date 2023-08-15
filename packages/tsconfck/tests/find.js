import { describe, it, expect } from 'vitest';
import path from 'path';
import os from 'os';
import { find } from '../src/find.js';
import { absFixture, absRoot, relFixture } from './util/fixture-paths.js';

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

	it('should stop searching at root', async () => {
		const fixtureDir = 'find-root/a';
		const relativeTS = relFixture(`${fixtureDir}/b/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/b/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];

		for (const input of inputs) {
			await expect(find(input, { root: absFixture(fixtureDir) })).rejects.toThrow(
				'no tsconfig file found for ' + input
			);
		}
	});

	it('should use provided tsConfigPaths', async () => {
		const fixtureDir = 'find-root';
		const relativeTS = relFixture(`${fixtureDir}/a/b/foo.ts`);
		const absoluteTS = absFixture(`${fixtureDir}/a/b/foo.ts`);
		const inputs = [relativeTS, `./${relativeTS}`, absoluteTS];
		const real = absFixture(`${fixtureDir}/tsconfig.json`);
		const fake = absFixture(`${fixtureDir}/a/tsconfig.json`);

		const tsConfigPaths = new Set([fake]);

		for (const input of inputs) {
			expect(await find(input), `input: ${input}`).toBe(real);
			expect(await find(input, { tsConfigPaths }), `input: ${input}`).toBe(fake);
		}
	});

	it('should reject when no tsconfig file was found', async () => {
		const doesntExist = path.resolve(os.homedir(), '..', 'foo.ts'); // outside of user home there should not be a tsconfig
		await expect(find(doesntExist)).rejects.toThrow('no tsconfig file found for ' + doesntExist);
	});
});