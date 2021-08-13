import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * find the closest tsconfig.json file
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @returns {Promise<string|null>} absolute path to closest tsconfig.json or null if not found
 */
export async function findTSConfig(filename: string) {
	if (typeof filename !== 'string') {
		throw new TypeError(
			`Expected argument \`filename\` to be a \`string\`, got \`${typeof filename}\``
		);
	}
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
	return null;
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
