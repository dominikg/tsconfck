import path from 'path';
import { promises as fs } from 'fs';
import { ParseResult } from './parse';
import { ParseNativeResult } from './parse-native';

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

export function resolveReferencedTSConfigFiles(result: ParseResult | ParseNativeResult): string[] {
	if (!result.tsconfig.references) {
		return [];
	}
	const dir = path.dirname(result.filename);
	return result.tsconfig.references.map((ref: { path: string }) => {
		const refPath = ref.path.endsWith('.json')
			? ref.path
			: path.posix.join(ref.path, 'tsconfig.json');
		return path.posix.resolve(dir, refPath);
	});
}

export function findTSConfigForFileInSolution(
	filename: string,
	solution: ParseResult | ParseNativeResult
): any {
	if (isIncluded(filename, solution)) {
		return solution;
	}
	return solution.referenced?.find((referenced) => isIncluded(filename, referenced));
}

function isIncluded(filename: string, result: ParseResult | ParseNativeResult): boolean {
	const dir = path.dirname(result.filename);
	const files = (result.tsconfig.files || []).map((file: string) =>
		path.posix.resolve(dir, native2posix(file))
	);
	if (files.includes(filename)) {
		return true;
	}
	const isIncluded = isMatched(
		filename,
		dir,
		result.tsconfig.include || (result.tsconfig.files ? [] : ['*/**'])
	);
	if (isIncluded) {
		const isExcluded = isMatched(filename, dir, result.tsconfig.exclude || []);
		return !isExcluded;
	}
	return false;
}

function isMatched(filename: string, dir: string, patterns: string[]): boolean {
	return patterns.some((pattern) => {
		const resolvedPattern = path.posix.resolve(dir, native2posix(pattern));
		if (pattern.includes('*') || pattern.includes('?')) {
			let regexp = resolvedPattern
				.replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape all regex chars except * and ?
				.replace(/\*\*/g, '(?:[^\\/]*\\/*)*') // replace all ** with greedy multiple path segment group
				.replace(/\*/g, '(?:[^\\/]*)') // replace all * with greedy group path segment
				.replace(/\?/g, '(?:.)'); // replace ? with single char group
			if (pattern.endsWith('*')) {
				regexp += '(?:\\.ts|\\.tsx|\\.d\\.ts)';
			}
			return filename.match(regexp);
		}
		return resolvedPattern === filename;
	});
}
