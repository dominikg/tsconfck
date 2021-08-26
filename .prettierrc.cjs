module.exports = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	overrides: [
		{
			files: '**/*.ts',
			options: { parser: 'typescript' }
		},
		{
			files: ['**/CHANGELOG.md', '**/docs/api.md'],
			options: {
				requirePragma: true
			}
		},
		{
			files: '**/package.json',
			options: {
				useTabs: false,
				tabWidth: 2
			}
		},
		{
			files: '**/fixtures/**/*.json',
			options: {
				requirePragma: true
			}
		}
	]
};
