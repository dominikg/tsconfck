import path from 'path';
import { promises as fs } from 'fs';

/**
 * find the closest tsconfig.json file
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @param {import('./public.d.ts').TSConfckFindOptions} [options] - options
 * @returns {Promise<string>} absolute path to closest tsconfig.json
 */
export async function find(filename, options) {
	const cache = options?.cache;
	let dir = path.dirname(path.resolve(filename));
	const root = options?.root ? path.resolve(options.root) : null;
	/** @type {string[]} */
	const visited = [];
	let found;
	while (dir) {
		if (cache?.hasTSConfigPath(dir)) {
			found = cache.getTSConfigPath(dir);
			break;
		}
		visited.push(dir);
		const tsconfig = await tsconfigInDir(dir);
		if (tsconfig) {
			found = tsconfig;
			break;
		} else {
			const parent = path.dirname(dir);
			if (root === dir || parent === dir) {
				// reached root
				found = null;
				break;
			} else {
				dir = parent;
			}
		}
	}
	if (cache && visited.length) {
		cache.setTSConfigPath(found, visited);
	}
	if (!found) {
		throw new Error(`no tsconfig file found for ${filename}`);
	}
	return found;
}

/**
 * test if tsconfig exists in dir
 * @param {string} dir
 * @returns {Promise<string|undefined>}
 */
async function tsconfigInDir(dir) {
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
