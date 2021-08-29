import path from 'path';
import { loadTS, native2posix, posix2native, resolveTSConfig } from './util.js';
import { findNative } from './find-native.js';

/**
 * parse the closest tsconfig.json file with typescript native functions
 *
 * You need to have `typescript` installed to use this
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @returns {Promise<ParseNativeResult>}
 */
export async function parseNative(filename: string): Promise<ParseNativeResult> {
	let tsconfigFile = await resolveTSConfig(filename);
	if (tsconfigFile) {
		// convert to C:/foo/bar on windows as ts.readConfigFile expects it that way
		tsconfigFile = native2posix(tsconfigFile);
	} else {
		tsconfigFile = await findNative(filename);
	}

	const ts = await loadTS();
	const { parseJsonConfigFileContent, readConfigFile, sys } = ts;
	const { config, error } = readConfigFile(tsconfigFile, sys.readFile);
	if (error) {
		throw toError(error);
	}

	const host = {
		useCaseSensitiveFileNames: false,
		readDirectory: sys.readDirectory,
		fileExists: sys.fileExists,
		readFile: sys.readFile
	};

	const result = parseJsonConfigFileContent(
		config,
		host,
		path.dirname(tsconfigFile),
		undefined,
		tsconfigFile
	);
	checkErrors(result.errors);

	return {
		filename: posix2native(tsconfigFile),
		tsconfig: result2tsconfig(result, ts),
		result: result
	};
}

/**
 * check errors reported by parseJsonConfigFileContent
 *
 * ignores errors related to missing input files as these may happen regularly in programmatic use
 * and do not affect the config itself
 *
 * @param errors errors to check
 * @throws {message: string, code: string, start?: number} for critical error
 */
function checkErrors(errors: { code: number; category: number }[]) {
	const ignoredErrorCodes = [
		// see https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
		18002, // empty files list
		18003 // no inputs
	];
	const criticalError = errors?.find(
		(error) => error.category === 1 && !ignoredErrorCodes.includes(error.code)
	);
	if (criticalError) {
		throw toError(criticalError);
	}
}

function toError(tsError: any) {
	return {
		message: tsError.messageText,
		code: `TS ${tsError.code}`,
		start: tsError.start
	};
}

/**
 * convert the result of `parseJsonConfigFileContent` to a tsconfig that can be parsed again
 *
 * - use merged compilerOptions
 * - strip prefix and postfix of compilerOptions.lib
 * - convert enum values back to string
 *
 * @param result
 * @param ts typescript
 * @returns {object} tsconfig with merged compilerOptions and enums restored to their string form
 */
function result2tsconfig(result: any, ts: any) {
	// dereference result.raw so changes below don't modify original
	const tsconfig = JSON.parse(JSON.stringify(result.raw));
	// for some reason the extended compilerOptions are not available in result.raw but only in result.options
	// and contain an extra field 'configFilePath'. Use everything but that field
	if (Object.keys(result.options).filter((x) => x !== 'configFilePath').length > 0) {
		const extendedCompilerOptions = {
			...result.options
		};
		delete extendedCompilerOptions['configFilePath'];
		tsconfig.compilerOptions = extendedCompilerOptions;
	}
	const compilerOptions = tsconfig.compilerOptions;
	if (compilerOptions) {
		if (compilerOptions.lib != null) {
			// remove lib. and .dts from lib.es2019.d.ts etc
			compilerOptions.lib = compilerOptions.lib.map((x: string) =>
				x.replace(/^lib\./, '').replace(/\.d\.ts$/, '')
			);
		}
		const enumProperties = [
			{ name: 'importsNotUsedAsValues', enumeration: ts.ImportsNotUsedAsValues },
			{ name: 'jsxEmit', enumeration: ts.JsxEmit },
			{ name: 'module', enumeration: ts.ModuleKind },
			{ name: 'moduleResulution', enumeration: ts.ModuleResolutionKind },
			{ name: 'newLine', enumeration: ts.NewLineKind },
			{ name: 'target', enumeration: ts.ScriptTarget }
		];
		for (const prop of enumProperties) {
			if (compilerOptions[prop.name] != null) {
				compilerOptions[prop.name] = prop.enumeration[compilerOptions[prop.name]].toLowerCase();
			}
		}
	}

	const watchOptions = tsconfig.watchOptions;
	if (watchOptions) {
		const enumProperties = [
			{ name: 'watchFile', enumeration: ts.WatchFileKind },
			{ name: 'watchDirectory', enumeration: ts.WatchDirectoryKind },
			{ name: 'fallbackPolling', enumeration: ts.PollingWatchKind }
		];
		for (const prop of enumProperties) {
			if (compilerOptions[prop.name] != null) {
				const enumVal = prop.enumeration[compilerOptions[prop.name]];
				compilerOptions[prop.name] = enumVal.charAt(0).toLowerCase() + enumVal.slice(1);
			}
		}
	}
	return tsconfig;
}

export interface ParseNativeResult {
	/**
	 * absolute path to parsed tsconfig.json
	 */
	filename: string;
	/**
	 * parsed result, including merged values from extended
	 */
	tsconfig: any;

	/**
	 * ParseResult for all referenced tsconfig files
	 */
	referenced?: Pick<ParseNativeResult, 'filename' | 'tsconfig'>[];

	/**
	 * full output of ts.parseJsonConfigFileContent
	 */
	result: any;
}
