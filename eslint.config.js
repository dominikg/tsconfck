import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import node from 'eslint-plugin-n';

export default [
	js.configs.recommended,
	node.configs['flat/recommended-module'],
	prettierRecommended,
	{
		ignores: [
			'packages/tsconfck/tests/fixtures/parse/invalid/**/*',
			'packages/tsconfck/tests/fixtures/find-all/recursive-symlink/**/*',
			'packages/tsconfck/tests/snapshots/**/*'
		]
	},
	{
		plugins: {
			node,
			prettier
		}
	},
	{
		languageOptions: {
			globals: {
				Atomics: 'readonly',
				SharedArrayBuffer: 'readonly'
			},
			parserOptions: {
				ecmaVersion: 2022
			}
		},
		rules: {
			'no-debugger': ['error']
		}
	},
	{
		files: ['**/tests/fixtures/**/*.js', '**/tests/fixtures/**/*.ts'],
		rules: {
			'no-unused-vars': 'off'
		}
	}
];
