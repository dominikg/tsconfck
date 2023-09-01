import path from 'node:path';
import fs from 'node:fs';

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
	/** @type {((result: string|null,err?: ErrnoException)=>void)} */
	let done;
	/** @type {Promise<string|null> | string | null}*/
	const promise = new Promise((resolve, reject) => {
		done = (result, err) => {
			if (err) {
				reject(err);
			} else if (result === null) {
				reject(`no tsconfig file found for ${filename}`);
			} else {
				resolve(result);
			}
		};
	});
	findUp(dir, promise, done, options?.cache, root);
	return promise;
}

/**
 *
 * @param {string} dir
 * @param {Promise<string|null>} promise
 * @param {((result: string|null,err?: ErrnoException)=>void)} done
 * @param {import('./cache.js').TSConfckCache}  [cache]
 * @param {string} [root]
 */
function findUp(dir, promise, done, cache, root) {
	const tsconfig = path.join(dir, 'tsconfig.json');
	if (cache) {
		if (cache.hasTSConfigPath(dir)) {
			const cached = cache.getTSConfigPath(dir);
			if (cached.then) {
				cached.then(done).catch((err) => done(null, err));
			} else {
				done(/**@type {string|null} */ (cached));
			}
		} else {
			cache.setTSConfigPath(dir, promise);
		}
	}
	fs.stat(tsconfig, (err, stats) => {
		if (stats && (stats.isFile() || stats.isFIFO())) {
			done(tsconfig);
		} else if (err?.code !== 'ENOENT') {
			done(null, err);
		} else {
			let parent;
			if (root === dir || (parent = path.dirname(dir)) === dir) {
				done(null);
			} else {
				findUp(parent, promise, done, cache, root);
			}
		}
	});
}
