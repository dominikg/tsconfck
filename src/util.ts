import path from 'path';
import { promises as fs } from 'fs';

// hide dynamic import from ts transform to prevent it turning into a require
// see https://github.com/microsoft/TypeScript/issues/43329#issuecomment-811606238
const dynamicImportDefault = new Function('path', 'return import(path).then(m => m.default)');

export async function loadTS(): Promise<any> {
	try {
		return dynamicImportDefault('typescript');
	} catch (e) {
		console.error('typescript must be installed to use "native" functions');
		throw e;
	}
}

export async function resolveTSConfig(filename: string): Promise<string | void> {
	const basename = path.basename(filename);
	if (basename !== 'tsconfig.json') {
		return;
	}
	const tsconfig = path.resolve(filename);
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
	throw new Error(`no tsconfig file found for ${filename}`);
}

/**
 * convert posix separator to native separator
 *
 * eg.
 * windows: C:/foo/bar -> c:\foo\bar
 * linux: /foo/bar -> /foo/bar
 *
 * @param filename {string} filename with posix separators
 * @returns {string} filename with native separators
 */
export function posix2native(filename: string) {
	return path.posix.sep !== path.sep && filename.includes(path.posix.sep)
		? filename.split(path.posix.sep).join(path.sep)
		: filename;
}

/**
 * convert native separator to posix separator
 *
 * eg.
 * windows: C:\foo\bar -> c:/foo/bar
 * linux: /foo/bar -> /foo/bar
 *
 * @param filename {string} filename with native separators
 * @returns {string} filename with posix separators
 */
export function native2posix(filename: string) {
	return path.posix.sep !== path.sep && filename.includes(path.sep)
		? filename.split(path.sep).join(path.posix.sep)
		: filename;
}
