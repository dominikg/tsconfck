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
	let dir = path.dirname(path.resolve(filename));
	const root = options?.root ? path.resolve(options.root) : null;
	while (dir) {
		const tsconfig = await tsconfigInDir(dir, options);
		if (tsconfig) {
			return tsconfig;
		} else {
			if (root === dir) {
				break;
			}
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

/**
 * test if tsconfig exists in dir
 * @param {string} dir
 * @param {import('./public.d.ts').TSConfckFindOptions} [options] - options
 * @returns {Promise<string|undefined>}
 */
async function tsconfigInDir(dir, options) {
	const tsconfig = path.join(dir, 'tsconfig.json');
	if (options?.tsconfigPaths) {
		return options.tsconfigPaths.has(tsconfig) ? tsconfig : undefined;
	}
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
