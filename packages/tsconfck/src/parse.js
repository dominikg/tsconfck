import path from 'path';
import { promises as fs } from 'fs';
import { createRequire } from 'module';
import { find } from './find.js';
import { toJson } from './to-json.js';
import {
	native2posix,
	resolve2posix,
	resolveReferencedTSConfigFiles,
	resolveSolutionTSConfig,
	resolveTSConfig
} from './util.js';

const not_found_result = {
	tsconfigFile: null,
	tsconfig: {}
};

/**
 * parse the closest tsconfig.json file
 *
 * @param {string} filename - path to a tsconfig .json or a source file or directory (absolute or relative to cwd)
 * @param {import('./public.d.ts').TSConfckParseOptions} [options] - options
 * @returns {Promise<import('./public.d.ts').TSConfckParseResult>}
 * @throws {TSConfckParseError}
 */
export async function parse(filename, options) {
	/** @type {import('./cache.js').TSConfckCache} */
	const cache = options?.cache;
	if (cache?.hasParseResult(filename)) {
		return cache.getParseResult(filename);
	}
	/** @type {(result: import('./public.d.ts').TSConfckParseResult)=>void}*/
	let resolveConfigPromise;
	/** @type {Promise<import('./public.d.ts').TSConfckParseResult>}*/
	const configPromise = new Promise((r) => {
		resolveConfigPromise = r;
	});
	cache?.setParseResult(filename, configPromise);

	let tsconfigFile = (await resolveTSConfig(filename, cache)) || (await find(filename, options));
	if (!tsconfigFile) {
		resolveConfigPromise(not_found_result);
		return configPromise;
	}

	let result;
	if (filename !== tsconfigFile && cache?.hasParseResult(tsconfigFile)) {
		result = await cache.getParseResult(tsconfigFile);
	} else {
		result = await parseFile(tsconfigFile, cache, filename === tsconfigFile);
		await Promise.all([parseExtends(result, cache), parseReferences(result, cache)]);
	}
	resolveConfigPromise(resolveSolutionTSConfig(filename, result));
	return configPromise;
}

/**
 *
 * @param {string} tsconfigFile - path to tsconfig file
 * @param {import('./cache.js').TSConfckCache} [cache] - cache
 * @param {boolean} [skipCache] - skip cache
 * @returns {Promise<import('./public.d.ts').TSConfckParseResult>}
 */
async function parseFile(tsconfigFile, cache, skipCache) {
	if (!skipCache && cache?.hasParseResult(tsconfigFile)) {
		return cache.getParseResult(tsconfigFile);
	}
	const promise = fs
		.readFile(tsconfigFile, 'utf-8')
		.then(toJson)
		.then((json) => {
			return {
				tsconfigFile,
				tsconfig: normalizeTSConfig(JSON.parse(json), path.dirname(tsconfigFile))
			};
		})
		.catch((e) => {
			throw new TSConfckParseError(
				`parsing ${tsconfigFile} failed: ${e}`,
				'PARSE_FILE',
				tsconfigFile,
				e
			);
		});
	if (!skipCache) {
		cache?.setParseResult(tsconfigFile, promise);
	}
	return promise;
}

/**
 * normalize to match the output of ts.parseJsonConfigFileContent
 *
 * @param {any} tsconfig - typescript tsconfig output
 * @param {string} dir - directory
 */
function normalizeTSConfig(tsconfig, dir) {
	// set baseUrl to absolute path
	if (tsconfig.compilerOptions?.baseUrl && !path.isAbsolute(tsconfig.compilerOptions.baseUrl)) {
		tsconfig.compilerOptions.baseUrl = resolve2posix(dir, tsconfig.compilerOptions.baseUrl);
	}
	return tsconfig;
}

/**
 *
 * @param {import('./public.d.ts').TSConfckParseResult} result
 * @param {TSConfckCache} [cache]
 * @returns {Promise<void>}
 */
async function parseReferences(result, cache) {
	if (!result.tsconfig.references) {
		return;
	}
	const referencedFiles = resolveReferencedTSConfigFiles(result);
	const referenced = await Promise.all(referencedFiles.map((file) => parseFile(file, cache)));
	await Promise.all(referenced.map((ref) => parseExtends(ref, cache)));
	result.referenced = referenced;
}

/**
 * @param {import('./public.d.ts').TSConfckParseResult} result
 * @param {import('./cache.js').TSConfckCache}[cache]
 * @returns {Promise<void>}
 */
async function parseExtends(result, cache) {
	if (!result.tsconfig.extends) {
		return;
	}
	// use result as first element in extended
	// but dereference tsconfig so that mergeExtended can modify the original without affecting extended[0]
	/** @type {import('./public.d.ts').TSConfckParseResult[]} */
	const extended = [
		{ tsconfigFile: result.tsconfigFile, tsconfig: JSON.parse(JSON.stringify(result.tsconfig)) }
	];

	// flatten extends graph into extended
	let pos = 0;
	/** @type {string[]} */
	const extendsPath = [];
	let currentBranchDepth = 0;
	while (pos < extended.length) {
		const extending = extended[pos];
		extendsPath.push(extending.tsconfigFile);
		if (extending.tsconfig.extends) {
			// keep following this branch
			currentBranchDepth += 1;
			/** @type {string[]} */
			let resolvedExtends;
			if (!Array.isArray(extending.tsconfig.extends)) {
				resolvedExtends = [resolveExtends(extending.tsconfig.extends, extending.tsconfigFile)];
			} else {
				// reverse because typescript 5.0 treats ['a','b','c'] as c extends b extends a
				resolvedExtends = extending.tsconfig.extends
					.reverse()
					.map((ex) => resolveExtends(ex, extending.tsconfigFile));
			}

			const circularExtends = resolvedExtends.find((tsconfigFile) =>
				extendsPath.includes(tsconfigFile)
			);
			if (circularExtends) {
				const circle = extendsPath.concat([circularExtends]).join(' -> ');
				throw new TSConfckParseError(
					`Circular dependency in "extends": ${circle}`,
					'EXTENDS_CIRCULAR',
					result.tsconfigFile
				);
			}
			// add new extends to the list directly after current
			extended.splice(
				pos + 1,
				0,
				...(await Promise.all(resolvedExtends.map((file) => parseFile(file, cache))))
			);
		} else {
			// reached a leaf, backtrack to the last branching point and continue
			extendsPath.splice(-currentBranchDepth);
			currentBranchDepth = 0;
		}
		pos = pos + 1;
	}
	result.extended = extended;
	// skip first as it is the original config
	for (const ext of result.extended.slice(1)) {
		extendTSConfig(result, ext);
	}
}

/**
 *
 * @param {string} extended
 * @param {string} from
 * @returns {string}
 */
function resolveExtends(extended, from) {
	let error;

	try {
		return createRequire(from).resolve(extended);
	} catch (e) {
		error = e;
	}

	if (!path.isAbsolute(extended) && !extended.startsWith('./') && !extended.startsWith('../')) {
		try {
			const fallbackExtended = path.join(extended, 'tsconfig.json');
			return createRequire(from).resolve(fallbackExtended);
		} catch (e) {
			error = e;
		}
	}

	throw new TSConfckParseError(
		`failed to resolve "extends":"${extended}" in ${from}`,
		'EXTENDS_RESOLVE',
		from,
		error
	);
}

// references, extends and custom keys are not carried over
const EXTENDABLE_KEYS = [
	'compilerOptions',
	'files',
	'include',
	'exclude',
	'watchOptions',
	'compileOnSave',
	'typeAcquisition',
	'buildOptions'
];

/**
 *
 * @param {import('./public.d.ts').TSConfckParseResult} extending
 * @param {import('./public.d.ts').TSConfckParseResult} extended
 * @returns void
 */
function extendTSConfig(extending, extended) {
	const extendingConfig = extending.tsconfig;
	const extendedConfig = extended.tsconfig;
	const relativePath = native2posix(
		path.relative(path.dirname(extending.tsconfigFile), path.dirname(extended.tsconfigFile))
	);
	for (const key of Object.keys(extendedConfig).filter((key) => EXTENDABLE_KEYS.includes(key))) {
		if (key === 'compilerOptions') {
			if (!extendingConfig.compilerOptions) {
				extendingConfig.compilerOptions = {};
			}
			for (const option of Object.keys(extendedConfig.compilerOptions)) {
				if (Object.prototype.hasOwnProperty.call(extendingConfig.compilerOptions, option)) {
					continue; // already set
				}
				extendingConfig.compilerOptions[option] = rebaseRelative(
					option,
					extendedConfig.compilerOptions[option],
					relativePath
				);
			}
		} else if (extendingConfig[key] === undefined) {
			if (key === 'watchOptions') {
				extendingConfig.watchOptions = {};
				for (const option of Object.keys(extendedConfig.watchOptions)) {
					extendingConfig.watchOptions[option] = rebaseRelative(
						option,
						extendedConfig.watchOptions[option],
						relativePath
					);
				}
			} else {
				extendingConfig[key] = rebaseRelative(key, extendedConfig[key], relativePath);
			}
		}
	}
}

const REBASE_KEYS = [
	// root
	'files',
	'include',
	'exclude',
	// compilerOptions
	'baseUrl',
	'rootDir',
	'rootDirs',
	'typeRoots',
	'outDir',
	'outFile',
	'declarationDir',
	// watchOptions
	'excludeDirectories',
	'excludeFiles'
];

/** @typedef {string | string[]} PathValue */

/**
 *
 * @param {string} key
 * @param {PathValue} value
 * @param {string} prependPath
 * @returns {PathValue}
 */
function rebaseRelative(key, value, prependPath) {
	if (!REBASE_KEYS.includes(key)) {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map((x) => rebasePath(x, prependPath));
	} else {
		return rebasePath(value, prependPath);
	}
}

/**
 *
 * @param {string} value
 * @param {string} prependPath
 * @returns {string}
 */
function rebasePath(value, prependPath) {
	if (path.isAbsolute(value)) {
		return value;
	} else {
		// relative paths use posix syntax in tsconfig
		return path.posix.normalize(path.posix.join(prependPath, value));
	}
}

export class TSConfckParseError extends Error {
	/**
	 * error code
	 * @type {string}
	 */
	code;
	/**
	 * error cause
	 * @type { Error | undefined}
	 */
	cause;

	/**
	 * absolute path of tsconfig file where the error happened
	 * @type {string}
	 */
	tsconfigFile;
	/**
	 *
	 * @param {string} message - error message
	 * @param {string} code - error code
	 * @param {string} tsconfigFile - path to tsconfig file
	 * @param {Error?} cause - cause of this error
	 */
	constructor(message, code, tsconfigFile, cause) {
		super(message);
		// Set the prototype explicitly.
		Object.setPrototypeOf(this, TSConfckParseError.prototype);
		this.name = TSConfckParseError.name;
		this.code = code;
		this.cause = cause;
		this.tsconfigFile = tsconfigFile;
	}
}
