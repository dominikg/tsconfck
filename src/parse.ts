import { promises as fs } from 'fs';
import { find } from './find.js';
import { toJson } from './to-json.js';

/**
 * parse the closest tsconfig.json file
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @returns {Promise<object|void>} tsconfig parsed as object
 */
export async function parse(filename: string): Promise<ParseResult> {
	const tsconfigFile = await find(filename);
	const tsconfigJson = await fs.readFile(tsconfigFile, 'utf-8');
	const json = toJson(tsconfigJson);
	return {
		filename: tsconfigFile,
		tsconfig: JSON.parse(json)
	};
}

export interface ParseResult {
	filename: string;
	tsconfig: object;
}
