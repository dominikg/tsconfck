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
		'node/no-missing-import': [
			'error',
			{
				allowModules: ['types', 'estree', 'testUtils'],
				tryExtensions: ['.ts', '.js', '.jsx', '.tsx']
			}
		],
		'node/no-extraneous-import': [
			'error'
		],
		'node/no-deprecated-api': 'off',
		'node/no-unpublished-import': 'off',
		'node/no-unpublished-require': 'off',
		'node/no-unsupported-features/es-syntax': 'off',
		'no-process-exit': 'off'
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
