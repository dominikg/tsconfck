import path from 'node:path';
import { promises as fs } from 'node:fs';

const POSIX_SEP_RE = new RegExp('\\' + path.posix.sep, 'g');
const NATIVE_SEP_RE = new RegExp('\\' + path.sep, 'g');
/** @type {Map<string,RegExp>}*/
const PATTERN_REGEX_CACHE = new Map();
const GLOB_ALL_PATTERN = `**/*`;
const DEFAULT_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];
const DEFAULT_EXTENSIONS_RE_GROUP = `\\.(?:${DEFAULT_EXTENSIONS.map((ext) => ext.substring(1)).join(
	'|'
)})`;

const IS_POSIX = path.posix.sep === path.sep;

/**
 * loads typescript async to avoid direct dependency
 * @returns {Promise<any>}
 */
export async function loadTS() {
	try {
		return import('typescript').then((m) => m.default);
	} catch (e) {
		console.error('typescript must be installed to use "native" functions');
		throw e;
	}
}

/**
 * @param {string} filename
 * @param {import('./cache.js').TSConfckCache} [cache]
 * @returns {Promise<string|void>}
 */
export async function resolveTSConfig(filename, cache) {
	if (path.extname(filename) !== '.json') {
		return;
	}
	const tsconfig = path.resolve(filename);
	const dir = path.dirname(tsconfig);
	if (cache?.hasTSConfigPath(dir)) {
		const cached = await cache.getTSConfigPath(dir);
		return cached === tsconfig ? tsconfig : undefined;
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
export const posix2native = IS_POSIX
	? (s) => s
	: (filename) => {
			return filename.includes(path.posix.sep)
				? filename.replace(POSIX_SEP_RE, path.sep)
				: filename;
	  };

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
export const native2posix = IS_POSIX
	? (s) => s
	: (filename) => {
			return filename.includes(path.sep)
				? filename.replace(NATIVE_SEP_RE, path.posix.sep)
				: filename;
	  };

/**
 * converts params to native separator, resolves path and converts native back to posix
 *
 * needed on windows to handle posix paths in tsconfig
 *
 * @param dir {string|null} directory to resolve from
 * @param filename {string} filename or pattern to resolve
 * @returns string
 */
export function resolve2posix(dir, filename) {
	if (IS_POSIX) {
		return dir ? path.resolve(dir, filename) : path.resolve(filename);
	}
	return native2posix(
		dir
			? path.resolve(posix2native(dir), posix2native(filename))
			: path.resolve(posix2native(filename))
	);
}

/**
 *
 * @param {import('./public.d.ts').TSConfckParseResult} result
 * @returns {string[]}
 */
export function resolveReferencedTSConfigFiles(result) {
	const dir = path.dirname(result.tsconfigFile);
	return result.tsconfig.references.map((ref) => {
		const refPath = ref.path.endsWith('.json') ? ref.path : path.join(ref.path, 'tsconfig.json');
		return resolve2posix(dir, refPath);
	});
}

/**
 * @param {string} filename
 * @param {import('./public.d.ts').TSConfckParseResult} result
 * @returns {import('./public.d.ts').TSConfckParseResult}
 */
export function resolveSolutionTSConfig(filename, result) {
	if (
		result.referenced &&
		DEFAULT_EXTENSIONS.some((ext) => filename.endsWith(ext)) &&
		!isIncluded(filename, result)
	) {
		const solutionTSConfig = result.referenced.find((referenced) =>
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

/**
 *
 * @param {string} filename
 * @param {import('./public.d.ts').TSConfckParseResult} result
 * @returns {boolean}
 */
function isIncluded(filename, result) {
	const dir = native2posix(path.dirname(result.tsconfigFile));
	const files = (result.tsconfig.files || []).map((file) => resolve2posix(dir, file));
	const absoluteFilename = resolve2posix(null, filename);
	if (files.includes(filename)) {
		return true;
	}
	const isIncluded = isGlobMatch(
		absoluteFilename,
		dir,
		result.tsconfig.include || (result.tsconfig.files ? [] : [GLOB_ALL_PATTERN])
	);
	if (isIncluded) {
		const isExcluded = isGlobMatch(absoluteFilename, dir, result.tsconfig.exclude || []);
		return !isExcluded;
	}
	return false;
}

/**
 * test filenames agains glob patterns in tsconfig
 *
 * @param filename {string} posix style abolute path to filename to test
 * @param dir {string} posix style absolute path to directory of tsconfig containing patterns
 * @param patterns {string[]} glob patterns to match against
 * @returns {boolean} true when at least one pattern matches filename
 */
export function isGlobMatch(filename, dir, patterns) {
	return patterns.some((pattern) => {
		// filename must end with part of pattern that comes after last wildcard
		let lastWildcardIndex = pattern.length;
		let hasWildcard = false;
		for (let i = pattern.length - 1; i > -1; i--) {
			if (pattern[i] === '*' || pattern[i] === '?') {
				lastWildcardIndex = i;
				hasWildcard = true;
				break;
			}
		}

		// if pattern does not end with wildcard, filename must end with pattern after last wildcard
		if (
			lastWildcardIndex < pattern.length - 1 &&
			!filename.endsWith(pattern.slice(lastWildcardIndex + 1))
		) {
			return false;
		}

		// if pattern ends with *, filename must end with a default extension
		if (pattern.endsWith('*') && !DEFAULT_EXTENSIONS.some((ext) => filename.endsWith(ext))) {
			return false;
		}

		// for **/* , filename must start with the dir
		if (pattern === GLOB_ALL_PATTERN) {
			return filename.startsWith(`${dir}/`);
		}

		const resolvedPattern = resolve2posix(dir, pattern);

		// filename must start with part of pattern that comes before first wildcard
		let firstWildcardIndex = -1;
		for (let i = 0; i < resolvedPattern.length; i++) {
			if (resolvedPattern[i] === '*' || resolvedPattern[i] === '?') {
				firstWildcardIndex = i;
				hasWildcard = true;
				break;
			}
		}
		if (
			firstWildcardIndex > 1 &&
			!filename.startsWith(resolvedPattern.slice(0, firstWildcardIndex - 1))
		) {
			return false;
		}

		// if no wildcard in pattern, filename must be equal to resolved pattern
		if (!hasWildcard) {
			return filename === resolvedPattern;
		}

		// complex pattern, use regex to check it
		if (PATTERN_REGEX_CACHE.has(resolvedPattern)) {
			return PATTERN_REGEX_CACHE.get(resolvedPattern).test(filename);
		}
		const regex = pattern2regex(resolvedPattern);
		PATTERN_REGEX_CACHE.set(resolvedPattern, regex);
		return regex.test(filename);
	});
}

/**
 * @param {string} resolvedPattern
 * @returns {RegExp}
 */
function pattern2regex(resolvedPattern) {
	let regexStr = '^';
	for (let i = 0; i < resolvedPattern.length; i++) {
		const char = resolvedPattern[i];
		if (char === '?') {
			regexStr += '[^\\/]';
			continue;
		}
		if (char === '*') {
			if (resolvedPattern[i + 1] === '*' && resolvedPattern[i + 2] === '/') {
				i += 2;
				regexStr += '(?:[^\\/]*\\/)*'; // zero or more path segments
				continue;
			}
			regexStr += '[^\\/]*';
			continue;
		}
		if ('/.+^${}()|[]\\'.includes(char)) {
			regexStr += `\\`;
		}
		regexStr += char;
	}

	// add known file endings if pattern ends on *
	if (resolvedPattern.endsWith('*')) {
		regexStr += DEFAULT_EXTENSIONS_RE_GROUP;
	}
	regexStr += '$';

	return new RegExp(regexStr);
}
