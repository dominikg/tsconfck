import path from 'node:path';
import fs from 'node:fs';
import { isInNodeModules, makePromise } from './util.js';
/**
 * find the closest tsconfig.json file
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @param {import('./public.d.ts').TSConfckFindOptions} [options] - options
 * @returns {Promise<string|null>} absolute path to closest tsconfig.json or null if not found
 */
export async function find(filename, options) {
	let dir = path.dirname(path.resolve(filename));
	if (options?.ignoreNodeModules && isInNodeModules(dir)) {
		return null;
	}
	const cache = options?.cache;
	if (cache?.hasTSConfigPath(dir)) {
		return cache.getTSConfigPath(dir);
	}
	const { /** @type {Promise<string|null>} */ promise, resolve, reject } = makePromise();
	if (options?.root && !path.isAbsolute(options.root)) {
		options.root = path.resolve(options.root);
	}
	findUp(dir, { promise, resolve, reject }, options);
	return promise;
}

/**
 *
 * @param {string} dir
 * @param {{promise:Promise<string|null>,resolve:(result:string|null)=>void,reject:(err:any)=>void}} madePromise
 * @param {import('./public.d.ts').TSConfckFindOptions} [options] - options
 */
function findUp(dir, { resolve, reject, promise }, options) {
	const { cache, root } = options ?? {};
	if (cache) {
		if (cache.hasTSConfigPath(dir)) {
			let cached;
			try {
				cached = cache.getTSConfigPath(dir);
			} catch (e) {
				reject(e);
				return;
			}
			if (cached?.then) {
				cached.then(resolve).catch(reject);
			} else {
				resolve(cached);
			}
		} else {
			cache.setTSConfigPath(dir, promise);
		}
	}
	const tsconfig = path.join(dir, options?.configName ?? 'tsconfig.json');
	fs.stat(tsconfig, (err, stats) => {
		if (stats && (stats.isFile() || stats.isFIFO())) {
			resolve(tsconfig);
		} else if (err?.code !== 'ENOENT') {
			reject(err);
		} else {
			let parent;
			if (root === dir || (parent = path.dirname(dir)) === dir) {
				resolve(null);
			} else {
				findUp(parent, { promise, resolve, reject }, options);
			}
		}
	});
}
