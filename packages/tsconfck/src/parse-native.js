import path from 'path';
import {
	loadTS,
	native2posix,
	resolveReferencedTSConfigFiles,
	resolveSolutionTSConfig,
	resolveTSConfig
} from './util.js';
import { findNative } from './find-native.js';

/**
 * parse the closest tsconfig.json file with typescript native functions
 *
 * You need to have `typescript` installed to use this
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @param {import('./public.d.ts').TSConfckParseNativeOptions} [options] - options
 * @returns {Promise<import('./public.d.ts').TSConfckParseNativeResult>}
 * @throws {TSConfckParseNativeError}
 */
export async function parseNative(filename, options) {
	const cache = options?.cache;
	if (cache?.hasParseResult(filename)) {
		return cache.getParseResult(filename);
	}
	let tsconfigFile;

	if (options?.resolveWithEmptyIfConfigNotFound) {
		try {
			tsconfigFile = await resolveTSConfig(filename);
			if (!tsconfigFile) {
				tsconfigFile = await findNative(filename);
			}
		} catch (e) {
			const notFoundResult = {
				tsconfigFile: 'no_tsconfig_file_found',
				tsconfig: {},
				result: null
			};
			cache?.setParseResult(filename, Promise.resolve(notFoundResult));
			return notFoundResult;
		}
	} else {
		tsconfigFile = await resolveTSConfig(filename);
		if (!tsconfigFile) {
			tsconfigFile = await findNative(filename);
		}
	}

	/** @type {import('./public.d.ts').TSConfckParseNativeResult} */
	let result;
	if (cache?.hasParseResult(tsconfigFile)) {
		result = cache.getParseResult(tsconfigFile);
	} else {
		const ts = await loadTS();
		result = await parseFile(tsconfigFile, ts, options);
		await parseReferences(result, ts, options);
		cache?.setParseResult(tsconfigFile, Promise.resolve(result));
	}

	//@ts-ignore
	result = resolveSolutionTSConfig(filename, result);
	//@ts-ignore
	cache?.setParseResult(filename, Promise.resolve(result));
	return result;
}

/**
 *
 * @param {string} tsconfigFile
 * @param {any} ts
 * @param {import('./public.d.ts').TSConfckParseNativeOptions} [options]
 * @returns {Promise<import('./public.d.ts').TSConfckParseNativeResult>}
 */
async function parseFile(tsconfigFile, ts, options) {
	const cache = options?.cache;
	if (cache?.hasParseResult(tsconfigFile)) {
		return cache.getParseResult(tsconfigFile);
	}
	const posixTSConfigFile = native2posix(tsconfigFile);
	const { parseJsonConfigFileContent, readConfigFile, sys } = ts;
	const { config, error } = readConfigFile(posixTSConfigFile, sys.readFile);
	if (error) {
		throw new TSConfckParseNativeError(error, tsconfigFile, null);
	}

	const host = {
		useCaseSensitiveFileNames: false,
		readDirectory: sys.readDirectory,
		fileExists: sys.fileExists,
		readFile: sys.readFile
	};

	if (options?.ignoreSourceFiles) {
		config.files = [];
		config.include = [];
	}
	const nativeResult = parseJsonConfigFileContent(
		config,
		host,
		path.dirname(posixTSConfigFile),
		undefined,
		posixTSConfigFile
	);
	checkErrors(nativeResult, tsconfigFile);

	/** @type {import('./public.d.ts').TSConfckParseNativeResult} */
	const result = {
		tsconfigFile,
		tsconfig: result2tsconfig(nativeResult, ts),
		result: nativeResult
	};
	cache?.setParseResult(tsconfigFile, Promise.resolve(result));
	return result;
}

/**
 *
 * @param {import('./public.d.ts').TSConfckParseNativeResult} result
 * @param {any} ts
 * @param {import('./public.d.ts').TSConfckParseNativeOptions} [options]
 */
async function parseReferences(result, ts, options) {
	if (!result.tsconfig.references) {
		return;
	}
	const referencedFiles = resolveReferencedTSConfigFiles(result);
	result.referenced = await Promise.all(
		referencedFiles.map((file) => parseFile(file, ts, options))
	);
}

/**
 * check errors reported by parseJsonConfigFileContent
 *
 * ignores errors related to missing input files as these may happen regularly in programmatic use
 * and do not affect the config itself
 *
 * @param {any} nativeResult - native typescript parse result to check for errors
 * @param {string} tsconfigFile
 * @throws {TSConfckParseNativeError} for critical error
 */
function checkErrors(nativeResult, tsconfigFile) {
	const ignoredErrorCodes = [
		// see https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
		18002, // empty files list
		18003 // no inputs
	];
	const criticalError = nativeResult.errors?.find(
		(error) => error.category === 1 && !ignoredErrorCodes.includes(error.code)
	);
	if (criticalError) {
		throw new TSConfckParseNativeError(criticalError, tsconfigFile, nativeResult);
	}
}

/**
 * convert the result of `parseJsonConfigFileContent` to a tsconfig that can be parsed again
 *
 * - use merged compilerOptions
 * - strip prefix and postfix of compilerOptions.lib
 * - convert enum values back to string
 *
 * @param {any} result
 * @param {any} ts typescript
 * @returns {object} tsconfig with merged compilerOptions and enums restored to their string form
 */
function result2tsconfig(result, ts) {
	// dereference result.raw so changes below don't modify original
	const tsconfig = JSON.parse(JSON.stringify(result.raw));
	// for some reason the extended compilerOptions are not available in result.raw but only in result.options
	// and contain an extra fields 'configFilePath' and 'pathsBasePath'. Use everything but those 2
	const ignoredOptions = ['configFilePath', 'pathsBasePath'];
	if (result.options && Object.keys(result.options).some((o) => !ignoredOptions.includes(o))) {
		tsconfig.compilerOptions = {
			...result.options
		};
		for (const ignored of ignoredOptions) {
			delete tsconfig.compilerOptions[ignored];
		}
	}

	const compilerOptions = tsconfig.compilerOptions;
	if (compilerOptions) {
		if (compilerOptions.lib != null) {
			// remove lib. and .dts from lib.es2019.d.ts etc
			compilerOptions.lib = compilerOptions.lib.map((x) =>
				x.replace(/^lib\./, '').replace(/\.d\.ts$/, '')
			);
		}
		const enumProperties = [
			{ name: 'importsNotUsedAsValues', enumeration: ts.ImportsNotUsedAsValues },
			{ name: 'module', enumeration: ts.ModuleKind },
			{
				name: 'moduleResolution',
				enumeration: {
					...ts.ModuleResolutionKind,
					2: 'node' /*ts.ModuleResolutionKind uses "Node10" but in tsconfig it is just node"*/
				}
			},
			{
				name: 'newLine',
				enumeration: { 0: 'crlf', 1: 'lf' } /*ts.NewLineKind uses different names*/
			},
			{ name: 'target', enumeration: ts.ScriptTarget }
		];
		for (const prop of enumProperties) {
			if (compilerOptions[prop.name] != null && typeof compilerOptions[prop.name] === 'number') {
				compilerOptions[prop.name] = prop.enumeration[compilerOptions[prop.name]].toLowerCase();
			}
		}
		if (compilerOptions.target === 'latest') {
			compilerOptions.target = 'esnext'; // why ts, why?
		}
	}

	// merged watchOptions
	if (result.watchOptions) {
		tsconfig.watchOptions = {
			...result.watchOptions
		};
	}

	const watchOptions = tsconfig.watchOptions;
	if (watchOptions) {
		const enumProperties = [
			{ name: 'watchFile', enumeration: ts.WatchFileKind },
			{ name: 'watchDirectory', enumeration: ts.WatchDirectoryKind },
			{ name: 'fallbackPolling', enumeration: ts.PollingWatchKind }
		];
		for (const prop of enumProperties) {
			if (watchOptions[prop.name] != null && typeof watchOptions[prop.name] === 'number') {
				const enumVal = prop.enumeration[watchOptions[prop.name]];
				watchOptions[prop.name] = enumVal.charAt(0).toLowerCase() + enumVal.slice(1);
			}
		}
	}
	if (tsconfig.compileOnSave === false) {
		// ts adds this property even if it isn't present in the actual config
		// delete if it is false to match content of tsconfig
		delete tsconfig.compileOnSave;
	}
	return tsconfig;
}

export class TSConfckParseNativeError extends Error {
	/**
	 *
	 * @param {TSDiagnosticError} diagnostic - diagnostics of ts
	 * @param {string} tsconfigFile - file that errored
	 * @param {any?} result  - parsed result, if any
	 */
	constructor(diagnostic, tsconfigFile, result) {
		super(diagnostic.messageText);
		// Set the prototype explicitly.
		Object.setPrototypeOf(this, TSConfckParseNativeError.prototype);
		this.name = TSConfckParseNativeError.name;
		this.code = `TS ${diagnostic.code}`;
		this.diagnostic = diagnostic;
		this.result = result;
		this.tsconfigFile = tsconfigFile;
	}

	/**
	 * code of typescript diagnostic, prefixed with "TS "
	 * @type {string}
	 */
	code;

	/**
	 * full ts diagnostic that caused this error
	 * @type {TSDiagnosticError}
	 */
	diagnostic;

	/**
	 * absolute path of tsconfig file where the error happened
	 * @type {string}
	 */
	tsconfigFile;

	/**
	 * native result if present, contains all errors in result.errors
	 * @type {any|undefined}
	 */
	result;
}

/** @typedef TSDiagnosticError {
	code: number;
	category: number;
	messageText: string;
	start?: number;
} TSDiagnosticError */
