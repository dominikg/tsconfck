import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import { toJson } from '../src/to-json.js';
import { globFixtures } from './util/fixture-paths.js';
import { expectToMatchSnap } from './util/expect.js';

describe('toJson', () => {
	it('should be a function', () => {
		expect(toJson).toBeTypeOf('function');
	});

	it('should return a string', () => {
		expect(toJson('str')).toBeTypeOf('string');
	});

	it('should throw for invalid tsconfigJson arg', async () => {
		for (const tsconfigJson of [{}, [], 0, null, undefined]) {
			expect(() => toJson(tsconfigJson), `toJson with arg type ${typeof tsconfigJson}`).toThrow();
		}
		expect(() => toJson(), `toJson without arg`).toThrow();
	});

	it('should convert tsconfig.json to regular json', async () => {
		const samples = await globFixtures('parse/valid/**/tsconfig.json');
		for (const filename of samples) {
			const tsconfigJson = await fs.readFile(filename, 'utf-8');
			const actual = toJson(tsconfigJson);
			expect(
				() => JSON.parse(actual),
				`toJSON returns parsable json for ${filename}`
			).not.toThrow();
			expectToMatchSnap(actual, `toJSON for content of ${filename}`, filename, 'to-json.json');
		}
	});
});
