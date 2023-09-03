import path from 'path';
import { loadTS } from './util.js';

/**
 * find the closest tsconfig.json file using native ts.findConfigFile
 *
 * You must have `typescript` installed to use this
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @param {import('./public.d.ts').TSConfckFindOptions} [options] - options
 * @returns {Promise<string>} absolute path to closest tsconfig.json
 */
export async function findNative(filename, options) {
	const fileDir = path.dirname(path.resolve(filename));
	const cache = options?.cache;
	const root = options?.root ? path.resolve(options.root) : undefined;
	if (cache?.hasTSConfigPath(fileDir)) {
		return cache.getTSConfigPath(fileDir);
	}
	const ts = await loadTS();
	const { findConfigFile, sys } = ts;
	let tsconfigFile = findConfigFile(fileDir, sys.fileExists);
	if (!tsconfigFile || is_out_of_root(tsconfigFile, root)) {
		tsconfigFile = null;
	}
	if (cache) {
		cache_result(tsconfigFile, fileDir, cache, root);
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
 * @param {string|null} tsconfigFile
 * @param {string} fileDir
 * @param {import('./cache.js').TSConfckCache} cache
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
	directories.forEach((d) => {
		cache.setTSConfigPath(d, Promise.resolve(tsconfigFile));
	});
}
