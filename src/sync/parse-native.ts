import path from 'path';
import {
	loadTSSync,
	native2posix,
	resolveReferencedTSConfigFiles,
	resolveSolutionTSConfig,
	resolveTSConfigSync
} from '../util.js';
import { findNative } from './find-native';
import { checkErrors, result2tsconfig } from '../parse-native.js';
import {
	TSConfckParseNativeOptions,
	TSConfckParseNativeResult,
	TSConfckParseNativeError
} from '../types.js';
/**
 * parse the closest tsconfig.json file with typescript native functions
 *
 * You need to have `typescript` installed to use this
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @param {TSConfckParseNativeOptions} options - options
 * @returns {TSConfckParseNativeResult}
 * @throws {TSConfckParseNativeError}
 */
export function parseNative(
	filename: string,
	options?: TSConfckParseNativeOptions
): TSConfckParseNativeResult {
	const cache = options?.cache;
	if (cache?.has(filename)) {
		return cache.get(filename)!;
	}
	let tsconfigFile;

	if (options?.resolveWithEmptyIfConfigNotFound) {
		try {
			tsconfigFile = resolveTSConfigSync(filename);
			if (!tsconfigFile) {
				tsconfigFile = findNative(filename);
			}
		} catch (e) {
			const notFoundResult = {
				tsconfigFile: 'no_tsconfig_file_found',
				tsconfig: {},
				result: null
			};
			cache?.set(filename, notFoundResult);
			return notFoundResult;
		}
	} else {
		tsconfigFile = resolveTSConfigSync(filename);
		if (!tsconfigFile) {
			tsconfigFile = findNative(filename);
		}
	}

	let result: TSConfckParseNativeResult;
	if (cache?.has(tsconfigFile)) {
		result = cache.get(tsconfigFile)!;
	} else {
		const ts = loadTSSync();
		result = parseFile(tsconfigFile, ts, options);
		parseReferences(result, ts, options);
		cache?.set(tsconfigFile, result);
	}

	//@ts-ignore
	result = resolveSolutionTSConfig(filename, result);
	//@ts-ignore
	cache?.set(filename, result);
	return result;
}

function parseFile(
	tsconfigFile: string,
	ts: any,
	options?: TSConfckParseNativeOptions
): TSConfckParseNativeResult {
	const cache = options?.cache;
	if (cache?.has(tsconfigFile)) {
		return cache.get(tsconfigFile)!;
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

	const result: TSConfckParseNativeResult = {
		tsconfigFile,
		tsconfig: result2tsconfig(nativeResult, ts),
		result: nativeResult
	};
	cache?.set(tsconfigFile, result);
	return result;
}

function parseReferences(
	result: TSConfckParseNativeResult,
	ts: any,
	options?: TSConfckParseNativeOptions
) {
	if (!result.tsconfig.references) {
		return;
	}
	const referencedFiles = resolveReferencedTSConfigFiles(result);
	result.referenced = referencedFiles.map((file) => parseFile(file, ts, options));
}
