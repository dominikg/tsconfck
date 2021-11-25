import path from 'path';
import fs from 'fs';

/**
 * find the closest tsconfig.json file
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @returns {string} absolute path to closest tsconfig.json
 */
export function find(filename: string): string {
	let dir = path.dirname(path.resolve(filename));
	while (dir) {
		const tsconfig = tsconfigInDir(dir);
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

function tsconfigInDir(dir: string): string | void {
	const tsconfig = path.join(dir, 'tsconfig.json');
	try {
		const stat = fs.statSync(tsconfig);
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
