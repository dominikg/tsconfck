// very simple .d.ts to .md converter
// splits blocks extracts title and wraps in ```ts ``` code fence

import fs from 'fs';

const header = '<!-- generated, do not modify -->\n## %%TITLE%% \n\n';

function toMD(block) {
	const title = block.match(/declare function ([^(]+)/)[1];
	return '### ' + title + '\n\n```ts\n' + block + '\n```';
}

function createDocs(title, dtsFile, outFile) {
	const dts = fs.readFileSync(dtsFile, 'utf-8');
	const blocks = dts.split('\n\n').slice(0, -1);
	const md =
		header.replace('%%TITLE%%', title) + blocks.map((block) => toMD(block)).join('\n\n') + '\n';
	fs.writeFileSync(outFile, md);
	console.log(`generated ${outFile} from ${dtsFile}`);
}
createDocs('API', 'dist/index.d.ts', 'docs/api.md');
createDocs('SYNC API', 'dist/sync/index.d.ts', 'docs/api-sync.md');
