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
	if (cache?.hasTSConfigPath(dir)) {
		return cache.getTSConfigPath(dir);
	}
	const root = options?.root ? path.resolve(options.root) : null;

	/** @type {(result: string|null)=>void}*/
	let resolvePathPromise;
	/** @type {Promise<string|null> | string | null}*/
	const pathPromise = new Promise((r) => {
		resolvePathPromise = r;
	});
	while (dir) {
		if (cache) {
			if (cache.hasTSConfigPath(dir)) {
				const cached = cache.getTSConfigPath(dir);
				if (cached.then) {
					cached.then(resolvePathPromise);
				} else {
					resolvePathPromise(/**@type {string|null} */ (cached));
				}
				return pathPromise;
			} else {
				cache.setTSConfigPath(dir, pathPromise);
			}
		}
		const tsconfig = await tsconfigInDir(dir);
		if (tsconfig) {
			resolvePathPromise(tsconfig);
			return pathPromise;
		} else {
			const parent = path.dirname(dir);
			if (root === dir || parent === dir) {
				// reached root
				break;
			} else {
				dir = parent;
			}
		}
	}
	resolvePathPromise(null);
	throw new Error(`no tsconfig file found for ${filename}`);
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
