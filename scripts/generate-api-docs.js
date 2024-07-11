// very simple .d.ts to .md converter
// splits blocks extracts title and wraps in ```ts ``` code fence

import fs from 'fs';

const header = '<!-- generated, do not modify -->\n## API \n\n';

function parseBlock(block) {
	const m = block.match(/(function|class|interface|type) ([a-zA-Z]+)/);
	if (!m) {
		return {
			kind: 'ignored',
			md: ''
		};
	}
	// eslint-disable-next-line no-unused-vars
	const [_, kind, title] = m;
	if (title === 'TSDiagnosticError') {
		return {
			kind: 'ignored',
			md: ''
		};
	}
	const heading = '#'.repeat(blockHeadings[title] || 3);
	return {
		kind,
		title,
		md: heading + ' ' + title + '\n\n```ts\n' + stripPrivate(block) + '\n```'
	};
}

function stripPrivate(str) {
	return str.replace(/^\s*#?private[; ].*\n?/gm, '');
}

const typesFile = 'packages/tsconfck/types/index.d.ts';
const blockSeparator = '\n-- cut here --\n';
let dts = fs
	.readFileSync(typesFile, 'utf-8')
	.replace("declare module 'tsconfck' {\n", '')
	.replace(/export \{[^}]+}/, '')
	.replace('}\n\n//# sourceMappingURL=index.d.ts.map', '')
	.replace(/^\s*(?:export )?function [a-zA-Z]+\(.*$/gm, `$&${blockSeparator}`)
	.replace(/^\s*(?:export )?interface [a-zA-Z]+\s*\{.*$/gm, `${blockSeparator}$&`)
	.replace(/^\s*}\s*$/gm, `$&${blockSeparator}`)
	.replace(/^\t/gm, '');

const blocks = dts
	.split(blockSeparator)
	.map((b) => b.trim())
	.filter(Boolean);

const blockHeadings = {
	find: 3,
	TSConfckFindOptions: 4,
	parse: 3,
	TSConfckParseOptions: 4,
	TSConfckParseResult: 4,
	TSConfckParseError: 4,
	findNative: 3,
	parseNative: 3,
	TSConfckParseNativeOptions: 4,
	TSConfckParseNativeResult: 4,
	TSConfckParseNativeError: 4,
	findAll: 3,
	TSConfckFindAllOptions: 4,
	toJson: 3,
	TSConfckCache: 3
};
const order = Object.keys(blockHeadings);

function sortBlocks(a, b) {
	const aIndex = order.indexOf(a.title);
	const bIndex = order.indexOf(b.title);
	if (aIndex < 0) {
		console.log('misssing title order: ', a.title);
	}
	if (bIndex < 0) {
		console.log('misssing title order: ', b.title);
	}
	return aIndex - bIndex;
}

const md =
	header +
	blocks
		.map((block) => parseBlock(block))
		.filter((b) => b.md.length > 0)
		.sort(sortBlocks)
		.map((b) => b.md)
		.join('\n\n') +
	'\n';
fs.writeFileSync('docs/api.md', md);
console.log(`generated docs/api.md from ${typesFile}`);
