import { find } from './find.js';
import fs from 'fs/promises';
import { toJson } from './to-json.js';

/**
 * parse the closest tsconfig.json file
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @returns {Promise<object|void>} tsconfig parsed as object
 */
export async function parse(filename: string): Promise<object | void> {
	const tsconfig = await find(filename);
	if (!tsconfig) {
		return;
	}
	const tsconfigJson = await fs.readFile(tsconfig, 'utf-8');
	const json = toJson(tsconfigJson);
	return JSON.parse(json);
}
