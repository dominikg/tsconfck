import path from 'path';
import { loadTS } from './util.js';

/**
 * find the closest tsconfig.json file using native ts.findConfigFile
 *
 * You must have `typescript` installed to use this
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @param {import('./public.d.ts').TSConfckOptions} [options] - options
 * @returns {Promise<string>} absolute path to closest tsconfig.json
 */
export async function findNative(filename, options) {
	const fileDir = path.dirname(path.resolve(filename));
	const cache = options?.cache;
	const root = options?.root ? path.resolve(options.root) : undefined;
	if (cache?.hasTSConfigPath(fileDir)) {
		const tsconfigFile = await cache.getTSConfigPath(fileDir);
		if (!tsconfigFile) {
			throw new Error(`no tsconfig file found for ${filename}`);
		}
		return tsconfigFile;
	}
	const ts = await loadTS();
	const { findConfigFile, sys } = ts;
	let tsconfigFile = findConfigFile(fileDir, sys.fileExists);
	if (is_out_of_root(tsconfigFile, root)) {
		tsconfigFile = null;
	}
	if (cache) {
		cache_result(tsconfigFile, fileDir, cache, root);
	}
	if (!tsconfigFile) {
		throw new Error(`no tsconfig file found for ${filename}`);
	}
	return tsconfigFile;
}

/**
 *
 * @param {string} tsconfigFile
 * @param {string} root
 */
function is_out_of_root(tsconfigFile, root) {
	return root && !tsconfigFile.startsWith(root);
}

/**
 * add all intermediate directories between fileDir and tsconfigFile to cache
 * if no tsconfig was found, go up until root
 * @param {string} tsconfigFile
 * @param {string} fileDir
 * @param {TSConfckCache} cache
 * @param {string} [root]
 */
function cache_result(tsconfigFile, fileDir, cache, root) {
	const tsconfigDir = tsconfigFile ? path.dirname(tsconfigFile) : root;
	const directories = [];
	let dir = fileDir;
	while (dir) {
		directories.push(dir);
		const parent = path.dirname(dir);
		if (tsconfigDir === dir || parent === dir) {
			break;
		} else {
			dir = parent;
		}
	}
	const p = Promise.resolve(tsconfigFile);
	directories.forEach((d) => {
		cache.setTSConfigPath(d, p);
	});
}
