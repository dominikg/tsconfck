import path from 'path';

/**
 * parse the closest tsconfig.json file with typescript native functions
 *
 * You need to have `typescript` installed to use this
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @returns {Promise<ParseNativeResult>}
 */
export async function parseNative(filename: string): Promise<ParseNativeResult> {
	let ts;
	try {
		ts = (await import('typescript')).default;
	} catch (e) {
		console.error('typescript must be installed to use parseNative');
		throw e;
	}
	const { findConfigFile, parseJsonConfigFileContent, readConfigFile, sys } = ts;
	const tsconfigFile = findConfigFile(path.dirname(path.resolve(filename)), sys.fileExists);
	if (!tsconfigFile) {
		throw new Error(`no tsconfig file found for ${filename}`);
	}
	const { config, error } = readConfigFile(tsconfigFile, sys.readFile);
	if (error) {
		throw error;
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

	// for some reason the extended compilerOptions are in result.options but NOT in result.raw or config
	// and contain an extra field 'configFilePath'. Use everything but that field
	if (Object.keys(result.options).filter((x) => x !== 'configFilePath').length > 0) {
		const extendedCompilerOptions = {
			...result.options
		};
		delete extendedCompilerOptions['configFilePath'];
		config.compilerOptions = extendedCompilerOptions;
	}
	return {
		// findConfigFile returns posix path separator on windows, restore platform native
		filename: posix2native(tsconfigFile),
		tsconfig: config,
		result
	};
}

function posix2native(filename: string) {
	return path.posix.sep !== path.sep && filename.includes(path.posix.sep)
		? filename.split(path.posix.sep).join(path.sep)
		: filename;
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
	 * full output of ts.parseJsonConfigFileContent
	 */
	result: any;
}
