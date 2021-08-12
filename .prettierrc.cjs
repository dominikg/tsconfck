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
			files: '**/CHANGELOG.md',
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
		}
	]
};
