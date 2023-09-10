import path from 'node:path';
import fs from 'node:fs';
import { makePromise, stripNodeModules } from './util.js';
/**
 * find the closest tsconfig.json file
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @param {import('./public.d.ts').TSConfckFindOptions} [options] - options
 * @returns {Promise<string|null>} absolute path to closest tsconfig.json or null if not found
 */
export async function find(filename, options) {
	const cache = options?.cache;
	let dir = path.dirname(path.resolve(filename));
	if (!options?.scanNodeModules) {
		dir = stripNodeModules(dir);
	}
	if (cache?.hasTSConfigPath(dir)) {
		return cache.getTSConfigPath(dir);
	}
	const { /** @type {Promise<string|null>} */ promise, resolve, reject } = makePromise();
	const root = options?.root ? path.resolve(options.root) : null;
	findUp(dir, { promise, resolve, reject }, options?.cache, root);
	return promise;
}

/**
 *
 * @param {string} dir
 * @param {{promise:Promise<string|null>,resolve:(result:string|null)=>void,reject:(err:any)=>void}} madePromise
 * @param {import('./cache.js').TSConfckCache}  [cache]
 * @param {string} [root]
 */
function findUp(dir, { resolve, reject, promise }, cache, root) {
	const tsconfig = path.join(dir, 'tsconfig.json');
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
				findUp(parent, { promise, resolve, reject }, cache, root);
			}
		}
	});
}
