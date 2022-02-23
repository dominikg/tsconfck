#!/usr/bin/env node
import { parse, find, findAll } from '../dist/index.js';
import * as process from 'process';

const HELP_TEXT = `
Usage: tsconfck <command> <file>

Commands: find, find-all, parse, parse-result

Examples:
> tsconfck find src/index.ts
> /path/to/tsconfig.json

> tsconfck find-all src/
> /src/foo/tsconfig.json
> /src/bar/tsconfig.json
> /src/tsconfig.json

> tsconfck parse src/index.ts
>{
>  ... tsconfig json
>}

> tsconfck parse src/index.ts > parsed.tsconfig.json

> tsconfck parse-result src/index.ts
>{
>  ... TSConfckParseResult json
>}
`;

const HELP_ARGS = ['-h', '--help', '-?', 'help'];
const COMMANDS = ['find', 'find-all', 'parse', 'parse-result'];
function needsHelp(args) {
	if (args.some((arg) => HELP_ARGS.includes(arg))) {
		return HELP_TEXT;
	}
	if (args.length !== 2) {
		return 'invalid number of arguments\n' + HELP_TEXT;
	} else if (!COMMANDS.includes(args[0])) {
		return 'invalid command ' + args[0] + '\n' + HELP_TEXT;
	}
}
async function main() {
	const args = process.argv.slice(2);
	const help = needsHelp(args);
	if (help) {
		return help;
	}
	const command = args[0];
	const file = args[1];
	if (command === 'find') {
		return find(file);
	} else if (command === 'parse') {
		return JSON.stringify((await parse(file)).tsconfig, null, 2);
	} else if (command === 'parse-result') {
		return JSON.stringify(await parse(file), null, 2);
	} else if (command === 'find-all') {
		return (await findAll(file || '.')).join('\n');
	}
}

main().then(
	(result) => {
		process.stdout.write(result);
		process.stdout.write('\n');
	},
	(err) => {
		console.error(err.message, err);
		// eslint-disable-next-line no-process-exit
		process.exit(1);
	}
);
