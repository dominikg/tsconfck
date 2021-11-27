// very simple .d.ts to .md converter
// splits blocks extracts title and wraps in ```ts ``` code fence
import fs from 'fs';

function block2md(block) {
	const match = block.match(
		/(?:declare function|declare class|export interface|export class) ([^( ]+)/
	);
	if (!match || !match[1]) {
		return;
	}
	const title = match[1];
	block = block.replace(/\n+$/, '');
	return '### ' + title + '\n\n```ts\n' + block + '\n```';
}

function dts2md(title, dtsFile) {
	const dts = fs.readFileSync(dtsFile, 'utf-8');
	const blocks = dts.split('\n\n');
	const md = `\n## ${title}\n\n` + blocks.map(block2md).filter(Boolean).join('\n\n') + '\n';
	return md;
}

function ts2md(title, tsFile) {
	const ts = fs.readFileSync(tsFile, 'utf-8');
	const blocks = ts.split('export ').map((b) => `export ${b}`);
	const md = `\n## ${title}\n\n` + blocks.map(block2md).filter(Boolean).join('\n\n') + '\n';
	return md;
}

let apiDocs = '<!-- generated, do not modify -->\n';
apiDocs += dts2md('API', 'dist/index.d.ts');
apiDocs += '\n\n';
apiDocs += dts2md('SYNC API', 'dist/sync/index.d.ts');
apiDocs += '\n\n';
apiDocs += ts2md('TYPES', 'src/types.ts');

fs.writeFileSync('docs/api.md', apiDocs, 'utf-8');
console.log('generated api docs in docs/api.md');
