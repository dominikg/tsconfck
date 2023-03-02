import path from 'path';
import { promises as fs } from 'fs';
import { createRequire } from 'module';
import { find, TSConfckFindOptions } from './find.js';
import { toJson } from './to-json.js';
import {
	native2posix,
	resolve2posix,
	resolveReferencedTSConfigFiles,
	resolveSolutionTSConfig,
	resolveTSConfig
} from './util';

/**
 * parse the closest tsconfig.json file
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @param {TSConfckParseOptions} options - options
 * @returns {Promise<TSConfckParseResult>}
 * @throws {TSConfckParseError}
 */
export async function parse(
	filename: string,
	options?: TSConfckParseOptions
): Promise<TSConfckParseResult> {
	const cache = options?.cache;
	if (cache?.has(filename)) {
		return cache.get(filename)!;
	}
	let tsconfigFile;
	if (options?.resolveWithEmptyIfConfigNotFound) {
		try {
			tsconfigFile = (await resolveTSConfig(filename)) || (await find(filename, options));
		} catch (e) {
			const notFoundResult = {
				tsconfigFile: 'no_tsconfig_file_found',
				tsconfig: {}
			};
			cache?.set(filename, notFoundResult);
			return notFoundResult;
		}
	} else {
		tsconfigFile = (await resolveTSConfig(filename)) || (await find(filename, options));
	}
	let result;
	if (cache?.has(tsconfigFile)) {
		result = cache.get(tsconfigFile)!;
	} else {
		result = await parseFile(tsconfigFile, cache);
		await Promise.all([parseExtends(result, cache), parseReferences(result, cache)]);
		cache?.set(tsconfigFile, result);
	}
	result = resolveSolutionTSConfig(filename, result);
	cache?.set(filename, result);
	return result;
}

async function parseFile(
	tsconfigFile: string,
	cache?: Map<string, TSConfckParseResult>
): Promise<TSConfckParseResult> {
	if (cache?.has(tsconfigFile)) {
		return cache.get(tsconfigFile)!;
	}
	try {
		const tsconfigJson = await fs.readFile(tsconfigFile, 'utf-8');
		const json = toJson(tsconfigJson);
		const result = {
			tsconfigFile,
			tsconfig: normalizeTSConfig(JSON.parse(json), path.dirname(tsconfigFile))
		};
		cache?.set(tsconfigFile, result);
		return result;
	} catch (e) {
		throw new TSConfckParseError(
			`parsing ${tsconfigFile} failed: ${e}`,
			'PARSE_FILE',
			tsconfigFile,
			e
		);
	}
}

/**
 * normalize to match the output of ts.parseJsonConfigFileContent
 *
 * @param tsconfig
 */
function normalizeTSConfig(tsconfig: any, dir: string) {
	// set baseUrl to absolute path
	if (tsconfig.compilerOptions?.baseUrl && !path.isAbsolute(tsconfig.compilerOptions.baseUrl)) {
		tsconfig.compilerOptions.baseUrl = resolve2posix(dir, tsconfig.compilerOptions.baseUrl);
	}
	return tsconfig;
}

async function parseReferences(
	result: TSConfckParseResult,
	cache?: Map<string, TSConfckParseResult>
) {
	if (!result.tsconfig.references) {
		return;
	}
	const referencedFiles = resolveReferencedTSConfigFiles(result);
	const referenced = await Promise.all(referencedFiles.map((file) => parseFile(file, cache)));
	await Promise.all(referenced.map((ref) => parseExtends(ref, cache)));
	result.referenced = referenced;
}

async function parseExtends(result: TSConfckParseResult, cache?: Map<string, TSConfckParseResult>) {
	if (!result.tsconfig.extends) {
		return;
	}
	// use result as first element in extended
	// but dereference tsconfig so that mergeExtended can modify the original without affecting extended[0]
	const extended: TSConfckParseResult[] = [
		{ tsconfigFile: result.tsconfigFile, tsconfig: JSON.parse(JSON.stringify(result.tsconfig)) }
	];

	// flatten extends graph into extended
	let pos = 0;
	const extendsPath: string[] = [];
	let currentBranchDepth = 0;
	while (pos < extended.length) {
		const extending = extended[pos];
		extendsPath.push(extending.tsconfigFile);
		if (extending.tsconfig.extends) {
			// keep following this branch
			currentBranchDepth += 1;
			let resolvedExtends: string[];
			if (!Array.isArray(extending.tsconfig.extends)) {
				resolvedExtends = [resolveExtends(extending.tsconfig.extends, extending.tsconfigFile)];
			} else {
				// reverse because typescript 5.0 treats ['a','b','c'] as c extends b extends a
				resolvedExtends = extending.tsconfig.extends
					.reverse()
					.map((ex: string) => resolveExtends(ex, extending.tsconfigFile));
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
	for (const ext of result.extended!.slice(1)) {
		extendTSConfig(result, ext);
	}
}

function resolveExtends(extended: string, from: string): string {
	let error: any;

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
function extendTSConfig(extending: TSConfckParseResult, extended: TSConfckParseResult): any {
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

type PathValue = string | string[];

function rebaseRelative(key: string, value: PathValue, prependPath: string): PathValue {
	if (!REBASE_KEYS.includes(key)) {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map((x) => rebasePath(x, prependPath));
	} else {
		return rebasePath(value as string, prependPath);
	}
}

function rebasePath(value: string, prependPath: string): string {
	if (path.isAbsolute(value)) {
		return value;
	} else {
		// relative paths use posix syntax in tsconfig
		return path.posix.normalize(path.posix.join(prependPath, value));
	}
}

export interface TSConfckParseOptions extends TSConfckFindOptions {
	/**
	 * optional cache map to speed up repeated parsing with multiple files
	 * it is your own responsibility to clear the cache if tsconfig files change during its lifetime
	 * cache keys are input `filename` and absolute paths to tsconfig.json files
	 *
	 * You must not modify cached values.
	 */
	cache?: Map<string, TSConfckParseResult>;

	/**
	 * treat missing tsconfig as empty result instead of an error
	 * parse resolves with { filename: 'no_tsconfig_file_found',tsconfig:{}} instead of reject with error
	 */
	resolveWithEmptyIfConfigNotFound?: boolean;
}

export interface TSConfckParseResult {
	/**
	 * absolute path to parsed tsconfig.json
	 */
	tsconfigFile: string;

	/**
	 * parsed result, including merged values from extended
	 */
	tsconfig: any;

	/**
	 * ParseResult for parent solution
	 */
	solution?: TSConfckParseResult;

	/**
	 * ParseResults for all tsconfig files referenced in a solution
	 */
	referenced?: TSConfckParseResult[];

	/**
	 * ParseResult for all tsconfig files
	 *
	 * [a,b,c] where a extends b and b extends c
	 */
	extended?: TSConfckParseResult[];
}

export class TSConfckParseError extends Error {
	constructor(message: string, code: string, tsconfigFile: string, cause?: Error) {
		super(message);
		// Set the prototype explicitly.
		Object.setPrototypeOf(this, TSConfckParseError.prototype);
		this.name = TSConfckParseError.name;
		this.code = code;
		this.cause = cause;
		this.tsconfigFile = tsconfigFile;
	}

	/**
	 * error code
	 */
	code: string;
	/**
	 * the cause of this error
	 */
	cause: Error | undefined;

	/**
	 * absolute path of tsconfig file where the error happened
	 */
	tsconfigFile: string;
}
