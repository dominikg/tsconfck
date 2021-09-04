import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { isGlobMatch } from '../src/util.js';
const test_isMatched = suite('isGlobMatch');

const IS_MATCHED_DATA = [
	{
		files: [
			{ name: '/src/bar.ts', expected: true },
			{ name: '/src/baz.tsx', expected: true },
			{ name: '/src/foo/bar.ts', expected: true },
			{ name: '/src/foo/bar/baz.tsx', expected: true },
			{ name: '/src/qoox.txt', expected: false },
			{ name: '/xxx/qoox.txt', expected: false },
			{ name: '/xxx/bar.ts', expected: false },
			{ name: '/xxx/bar.tsx', expected: false },
			{ name: '/bar.ts', expected: false },
			{ name: '/bar.tsx', expected: false }
		],
		dir: '/src',
		patterns: ['**/*']
	},
	{
		files: [
			{ name: '/foo/src/a/bar.ts', expected: true },
			{ name: '/foo/src/foo/a/bar/baz.tsx', expected: true },
			{ name: '/foo/src/foo/a/bar.ts', expected: true },
			{ name: '/foo/src/foo/bar/a/baz.tsx', expected: true },
			{ name: '/foo/src/a/bar.txt', expected: false },
			{ name: '/foo/src/foo/abar/baz.tsx', expected: false },
			{ name: '/foo/src/foo/abar.ts', expected: false },
			{ name: '/foo/src/foo/bar/a/baz.txt', expected: false },
			{ name: '/foo/src/not-a/bar.ts', expected: true }
		],
		dir: '/foo/src',
		patterns: ['/foo/src/**/a/**/*']
	},
	{
		files: [
			{ name: '/foo/src/bar.ts', expected: true },
			{ name: '/foo/src/foo/a/bar/baz.tsx', expected: false },
			{ name: '/foo/src/foo/a/bar.ts', expected: false },
			{ name: '/foo/bar.ts', expected: false }
		],
		dir: '/foo/src',
		patterns: ['/foo/src/*.ts']
	},
	{
		files: [
			{ name: '/foo/src/foo/bar.ts', expected: true },
			{ name: '/foo/bar.ts', expected: false },
			{ name: '/foo/src/bar.ts', expected: false },
			{ name: '/foo/src/foo/a/bar.ts', expected: false }
		],
		dir: '/foo/src',
		patterns: ['/foo/src/*/*']
	},
	{
		files: [
			{ name: '/foo/src/a/bar.ts', expected: true },
			{ name: '/foo/src/b/bar.ts', expected: true },
			{ name: '/foo/src/cc/bar.ts', expected: false },
			{ name: '/foo/bar.ts', expected: false },
			{ name: '/foo/src/bar.ts', expected: false },
			{ name: '/foo/src/a/b/bar.ts', expected: false }
		],
		dir: '/foo/src',
		patterns: ['/foo/src/?/*']
	}
];
test_isMatched(`should work`, () => {
	for (const { files, dir, patterns } of IS_MATCHED_DATA) {
		for (const { name, expected } of files) {
			const actual = isGlobMatch(name, dir, patterns);
			try {
				assert.is(actual, expected, `isGlobMatch("${name}","${dir}",${JSON.stringify(patterns)})`);
			} catch (e) {
				if (e.code === 'ERR_ASSERTION') {
					throw e;
				}
			}
		}
	}
});
test_isMatched.run();
