import path from 'path';

/**
 * parse the closest tsconfig.json file with typescript native functions
 *
 * You need to have `typescript` installed to use this
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @returns {Promise<object|void>} tsconfig parsed as object
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

	const result = parseJsonConfigFileContent(config, host, path.basename(tsconfigFile));

	return {
		filename: tsconfigFile,
		result
	};
}

export interface ParseNativeResult {
	filename: string;
	result: any;
}
