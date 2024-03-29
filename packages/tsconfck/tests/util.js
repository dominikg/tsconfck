import { describe, it, expect } from 'vitest';
import path from 'node:path';
import os from 'os';
import { isGlobMatch, native2posix, resolve2posix } from '../src/util.js';

const GLOBMATCH_TEST_DATA = [
	{
		files: [
			{ name: 'bar.ts', expected: true },
			{ name: 'baz.tsx', expected: true },
			{ name: 'foo/bar.ts', expected: true },
			{ name: 'foo/bar/baz.tsx', expected: true },
			{ name: '../qoox.txt', expected: false },
			{ name: '../xxx/qoox.txt', expected: false },
			{ name: '../xxx/bar.ts', expected: false },
			{ name: '../xxx/bar.tsx', expected: false },
			{ name: '../bar.ts', expected: false },
			{ name: '../bar.tsx', expected: false }
		],
		patterns: ['**/*'],
		allowJs: false
	},
	{
		files: [
			{ name: 'a/bar.ts', expected: true },
			{ name: 'foo/a/bar/baz.tsx', expected: true },
			{ name: 'foo/a/bar.ts', expected: true },
			{ name: 'foo/bar/a/baz.tsx', expected: true },
			{ name: 'a/bar.txt', expected: false },
			{ name: 'foo/abar/baz.tsx', expected: false },
			{ name: 'foo/abar.ts', expected: false },
			{ name: 'foo/bar/a/baz.txt', expected: false },
			{ name: 'not-a/bar.ts', expected: false }
		],
		patterns: ['**/a/**/*'],
		allowJs: false
	},
	{
		files: [
			{ name: 'bar.ts', expected: true },
			{ name: 'foo/a/bar/baz.tsx', expected: false },
			{ name: 'foo/a/bar.ts', expected: false },
			{ name: '../foo/bar.ts', expected: false }
		],
		patterns: ['*.ts'],
		allowJs: false
	},
	{
		files: [
			{ name: 'foo/bar.ts', expected: true },
			{ name: '../foo/bar.ts', expected: false },
			{ name: 'bar.ts', expected: false },
			{ name: 'foo/a/bar.ts', expected: false }
		],
		patterns: ['*/*'],
		allowJs: false
	},
	{
		files: [
			{ name: 'a/bar.ts', expected: true },
			{ name: 'b/bar.ts', expected: true },
			{ name: 'cc/bar.ts', expected: false },
			{ name: '../foo/bar.ts', expected: false },
			{ name: 'bar.ts', expected: false },
			{ name: 'a/b/bar.ts', expected: false }
		],
		patterns: ['?/*'],
		allowJs: false
	},
	{
		files: [
			{ name: 'bar.ts', expected: true },
			{ name: 'bar.mts', expected: true },
			{ name: 'bar.cts', expected: true },
			{ name: 'baz.tsx', expected: true },
			{ name: 'foo/bar.ts', expected: true },
			{ name: 'foo/bar/baz.tsx', expected: true },
			{ name: '../qoox.txt', expected: false },
			{ name: '../xxx/qoox.txt', expected: false },
			{ name: '../xxx/bar.ts', expected: false },
			{ name: '../xxx/bar.tsx', expected: false },
			{ name: '../bar.ts', expected: false },
			{ name: '../bar.tsx', expected: false },
			{ name: 'bar.js', expected: true },
			{ name: 'bar.mjs', expected: true },
			{ name: 'bar.cjs', expected: true },
			{ name: 'baz.jsx', expected: true },
			{ name: 'foo/bar.js', expected: true },
			{ name: 'foo/bar/baz.jsx', expected: true },
			{ name: '../xxx/bar.js', expected: false },
			{ name: '../xxx/bar.jsx', expected: false },
			{ name: '../bar.js', expected: false },
			{ name: '../bar.jsx', expected: false }
		],
		patterns: ['**/*'],
		allowJs: true
	}
];
describe('util', () => {
	describe('isGlobMatch', () => {
		it('should work', () => {
			const dir = native2posix(path.join(os.homedir(), 'foo', 'src'));
			for (const { files, patterns, allowJs } of GLOBMATCH_TEST_DATA) {
				for (const { name, expected } of files) {
					const absName = resolve2posix(dir, name);
					const actual = isGlobMatch(absName, dir, patterns, allowJs);
					expect(actual, `isGlobMatch("${absName}","${dir}",${JSON.stringify(patterns)})`).toBe(
						expected
					);
				}
			}
		});
	});
});
