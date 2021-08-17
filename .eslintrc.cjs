module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:node/recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'prettier'
	],
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly'
	},
	plugins: ['@typescript-eslint', 'markdown'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020
	},
	rules: {
		'no-debugger': ['error'],
		'node/no-missing-import': 'off', // doesn't work with typescript's "import from 'src/foo.js'" for src/foo.ts
		'node/no-extraneous-import': ['error'],
		'node/no-deprecated-api': ['warn'],
		'node/no-unpublished-import': 'off',
		'node/no-unsupported-features/es-syntax': 'off'
	},
	overrides: [
		{
			files: ['**/*.md'],
			processor: 'markdown/markdown',
			rules: {
				'no-undef': 'off',
				'no-unused-vars': 'off',
				'no-console': 'off',
				'padded-blocks': 'off',
				'node/no-missing-import': 'off',
				'node/no-extraneous-require': 'off',
				'import/no-unresolved': 'off',
				'node/no-missing-require': 'off'
			}
		},
		{
			files: ['**/*.md/*.**'],
			rules: {
				'no-undef': 'off',
				'no-unused-vars': 'off',
				'no-console': 'off',
				'padded-blocks': 'off',
				'node/no-missing-import': 'off',
				'node/no-extraneous-require': 'off',
				'import/no-unresolved': 'off',
				'node/no-missing-require': 'off'
			}
		}
	]
};
