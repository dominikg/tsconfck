// very simple .d.ts to .md converter
// splits blocks extracts title and wraps in ```ts ``` code fence

import fs from 'fs';

const header = '<!-- generated, do not modify -->\n## API \n\n';

function toMD(block) {
	const title = block.match(/declare function ([^(]+)/)[1];
	return '### ' + title + '\n\n```ts\n' + block + '\n```';
}
const dts = fs.readFileSync('dist/index.d.ts', 'utf-8');
const blocks = dts.split('\n\n').slice(0, -1);
const md = header + blocks.map((block) => toMD(block)).join('\n\n') + '\n';
fs.writeFileSync('docs/api.md', md);
console.log('generated docs/api.md from dist/index.d.ts');
