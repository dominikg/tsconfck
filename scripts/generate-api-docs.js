// very simple .d.ts to .md converter
// splits blocks extracts title and wraps in ```ts ``` code fence

import fs from 'fs';

const header = '<!-- generated, do not modify -->\n## API \n\n';

function toMD(block) {
	const title = block.match(/(?:function|class|interface) ([a-zA-Z]+)/)[1];
	return '### ' + title + '\n\n```ts\n' + block + '\n```';
}
const typesFile = 'packages/tsconfck/types/index.d.ts';
const blockSeparator = '\n-- cut here --\n';
let dts = fs
	.readFileSync(typesFile, 'utf-8')
	.replace("declare module 'tsconfck' {\n", '')
	.replace('}\n\n//# sourceMappingURL=index.d.ts.map', '')
	.replace(/^\s+export function [a-zA-Z]+\(.*$/gm, `$&${blockSeparator}`)
	.replace(/^\s*}\s*$/gm, `$&${blockSeparator}`)
	.replace(/^\t/gm, '');

const blocks = dts
	.split(blockSeparator)
	.map((b) => b.trim())
	.filter(Boolean);

const md = header + blocks.map((block) => toMD(block)).join('\n\n') + '\n';
fs.writeFileSync('docs/api.md', md);
console.log(`generated docs/api.md from ${typesFile}`);
