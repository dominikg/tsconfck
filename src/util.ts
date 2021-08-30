import path from 'path';
import { promises as fs } from 'fs';
import { ParseResult } from './parse';

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

/**
 * converts params to native separator, resolves path and converts native back to posix
 *
 * needed on windows to handle posix paths in tsconfig
 *
 * @param dir {string} directory to resolve from
 * @param filename {string} filename or pattern to resolve
 */
export function resolve2posix(dir: string | null, filename: string) {
	if (path.sep === path.posix.sep) {
		return dir ? path.resolve(dir, filename) : path.resolve(filename);
	}
	return native2posix(
		dir
			? path.resolve(posix2native(dir), posix2native(filename))
			: path.resolve(posix2native(filename))
	);
}

export function resolveReferencedTSConfigFiles(result: ParseResult): string[] {
	if (!result.tsconfig.references) {
		return [];
	}
	const dir = path.dirname(result.filename);
	return result.tsconfig.references.map((ref: { path: string }) => {
		const refPath = ref.path.endsWith('.json') ? ref.path : path.join(ref.path, 'tsconfig.json');
		return resolve2posix(dir, refPath);
	});
}

export function resolveSolutionTSConfig(filename: string, result: ParseResult): ParseResult {
	if (['.ts', '.tsx'].some((ext) => filename.endsWith(ext)) && !isIncluded(filename, result)) {
		const solutionTSConfig = result.referenced?.find((referenced) =>
			isIncluded(filename, referenced)
		);
		if (solutionTSConfig) {
			return {
				...solutionTSConfig,
				solution: result
			};
		}
	}
	return result;
}

function isIncluded(filename: string, result: ParseResult): boolean {
	const dir = path.dirname(result.filename);
	const files = (result.tsconfig.files || []).map((file: string) => resolve2posix(dir, file));
	const absoluteFilename = resolve2posix(null, filename);
	if (files.includes(filename)) {
		return true;
	}

	const isIncluded = isMatched(
		absoluteFilename,
		dir,
		result.tsconfig.include || (result.tsconfig.files ? [] : ['**/*'])
	);
	if (isIncluded) {
		const isExcluded = isMatched(absoluteFilename, dir, result.tsconfig.exclude || []);
		return !isExcluded;
	}
	return false;
}

function isMatched(filename: string, dir: string, patterns: string[]): boolean {
	return patterns.some((pattern) => {
		const resolvedPattern = resolve2posix(dir, pattern);
		if (pattern.includes('*') || pattern.includes('?')) {
			let regexp =
				'^' +
				resolvedPattern
					.replace(/[/.+^${}()|[\]\\]/g, '\\$&') // escape all regex chars except * and ?
					.replace(/\?/g, '[^\\/]') // replace ? with excactly one char excluding /
					.replace(/(?<!\*)\*(?!\*)/g, '[^\\/]*') // replace * with any number of chars excluding /
					.replace(/\*\*\\\//g, '(?:[^\\/]*\\/*)*'); // replace **/ with any number of path segments

			// add known file endings if pattern ends on *
			if (pattern.endsWith('*')) {
				regexp += '\\.(?:ts|tsx|d\\.ts)';
			}
			regexp += '$';
			return new RegExp(regexp).test(filename);
		}
		return resolvedPattern === filename;
	});
}
