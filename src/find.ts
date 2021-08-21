import path from 'path';
import { promises as fs } from 'fs';

/**
 * find the closest tsconfig.json file
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @returns {Promise<string>} absolute path to closest tsconfig.json
 */
export async function find(filename: string) {
	let dir = path.dirname(path.resolve(filename));
	while (dir) {
		const tsconfig = await tsconfigInDir(dir);
		if (tsconfig) {
			return tsconfig;
		} else {
			const parent = path.dirname(dir);
			if (parent === dir) {
				break;
			} else {
				dir = parent;
			}
		}
	}
	throw new Error(`no tsconfig file found for ${filename}`);
}

async function tsconfigInDir(dir: string): Promise<string | void> {
	const tsconfig = path.join(dir, 'tsconfig.json');
	try {
		const stat = await fs.stat(tsconfig);
		if (stat.isFile() || stat.isFIFO()) {
			return tsconfig;
		}
	} catch (e) {
		// ignore does not exist error
		if (e.code !== 'ENOENT') {
			throw e;
		}
	}
}
