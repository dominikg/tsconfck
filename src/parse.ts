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

/**
 * parse the closest tsconfig.json file
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @returns {Promise<ParseResult>}
 * @throws {ParseError}
 */
export async function parse(filename: string): Promise<ParseResult> {
	const tsconfigFile = (await resolveTSConfig(filename)) || (await find(filename));
	const result = await parseFile(tsconfigFile);
	await Promise.all([parseExtends(result), parseReferences(result)]);
	return resolveSolutionTSConfig(filename, result);
}

async function parseFile(tsconfigFile: string): Promise<ParseResult> {
	try {
		const tsconfigJson = await fs.readFile(tsconfigFile, 'utf-8');
		const json = toJson(tsconfigJson);
		return {
			filename: tsconfigFile,
			tsconfig: normalizeTSConfig(JSON.parse(json), path.dirname(tsconfigFile))
		};
	} catch (e) {
		throw new ParseError(`parsing ${tsconfigFile} failed: ${e}`, 'PARSE_FILE', e);
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

async function parseReferences(result: ParseResult) {
	if (!result.tsconfig.references) {
		return;
	}
	const referencedFiles = resolveReferencedTSConfigFiles(result);
	const referenced = await Promise.all(referencedFiles.map((file) => parseFile(file)));
	await Promise.all(referenced.map((ref) => parseExtends(ref)));
	result.referenced = referenced;
}

async function parseExtends(result: ParseResult) {
	if (!result.tsconfig.extends) {
		return;
	}
	// use result as first element in extended
	// but dereference tsconfig so that mergeExtended can modify the original without affecting extended[0]
	const extended = [
		{ filename: result.filename, tsconfig: JSON.parse(JSON.stringify(result.tsconfig)) }
	];

	while (extended[extended.length - 1].tsconfig.extends) {
		const extending = extended[extended.length - 1];
		const extendedTSConfigFile = resolveExtends(extending.tsconfig.extends, extending.filename);
		if (extended.some((x) => x.filename === extendedTSConfigFile)) {
			const circle = extended
				.concat({ filename: extendedTSConfigFile, tsconfig: null })
				.map((e) => e.filename)
				.join(' -> ');
			throw new ParseError(`Circular dependency in "extends": ${circle}`, 'EXTENDS_CIRCULAR');
		}
		extended.push(await parseFile(extendedTSConfigFile));
	}
	result.extended = extended;
	// skip first as it is the original config
	for (const ext of result.extended!.slice(1)) {
		extendTSConfig(result, ext);
	}
}

function resolveExtends(extended: string, from: string): string {
	try {
		return createRequire(from).resolve(extended);
	} catch (e) {
		throw new ParseError(
			`failed to resolve "extends":"${extended}" in ${from}`,
			'EXTENDS_RESOLVE',
			e
		);
	}
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
function extendTSConfig(extending: ParseResult, extended: ParseResult): any {
	const extendingConfig = extending.tsconfig;
	const extendedConfig = extended.tsconfig;
	const relativePath = native2posix(
		path.relative(path.dirname(extending.filename), path.dirname(extended.filename))
	);
	for (const key of Object.keys(extendedConfig).filter((key) => EXTENDABLE_KEYS.includes(key))) {
		if (key === 'compilerOptions') {
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

export interface ParseResult {
	/**
	 * absolute path to parsed tsconfig.json
	 */
	filename: string;

	/**
	 * parsed result, including merged values from extended
	 */
	tsconfig: any;

	/**
	 * ParseResult for parent solution
	 */
	solution?: ParseResult;

	/**
	 * ParseResults for all tsconfig files referenced in a solution
	 */
	referenced?: ParseResult[];

	/**
	 * ParseResult for all tsconfig files
	 *
	 * [a,b,c] where a extends b and b extends c
	 */
	extended?: ParseResult[];
}

export class ParseError extends Error {
	constructor(message: string, code: string, cause?: Error) {
		super(message);
		// Set the prototype explicitly.
		Object.setPrototypeOf(this, ParseError.prototype);
		this.name = ParseError.name;
		this.code = code;
		this.cause = cause;
	}

	/**
	 * error code
	 */
	code: string;
	/**
	 * code of typescript diagnostic, prefixed with "TS "
	 */
	cause: Error | undefined;
}
