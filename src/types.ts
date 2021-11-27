export interface TSConfckParseOptions {
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

export interface TSConfckParseNativeOptions {
	/**
	 * optional cache map to speed up repeated parsing with multiple files
	 * it is your own responsibility to clear the cache if tsconfig files change during its lifetime
	 * cache keys are input `filename` and absolute paths to tsconfig.json files
	 *
	 * You must not modify cached values.
	 */
	cache?: Map<string, TSConfckParseNativeResult>;

	/**
	 * treat missing tsconfig as empty result instead of an error
	 * parseNative resolves with { filename: 'no_tsconfig_file_found',tsconfig:{}, result: null} instead of reject with error
	 */
	resolveWithEmptyIfConfigNotFound?: boolean;

	/**
	 * Set this option to true to force typescript to ignore all source files.
	 *
	 * This is faster - especially for large projects - but comes with 2 caveats
	 *
	 * 1) output tsconfig always has `files: [],include: []` instead of any real values configured.
	 * 2) as a result of 1), it won't be able to resolve solution-style references and always return the closest tsconfig
	 */
	ignoreSourceFiles?: boolean;
}

export interface TSConfckParseNativeResult {
	/**
	 * absolute path to parsed tsconfig.json
	 */
	tsconfigFile: string;

	/**
	 * parsed result, including merged values from extended and normalized
	 */
	tsconfig: any;

	/**
	 * ParseResult for parent solution
	 */
	solution?: TSConfckParseNativeResult;

	/**
	 * ParseNativeResults for all tsconfig files referenced in a solution
	 */
	referenced?: TSConfckParseNativeResult[];

	/**
	 * full output of ts.parseJsonConfigFileContent
	 */
	result: any;
}

export class TSConfckParseNativeError extends Error {
	constructor(diagnostic: TSDiagnosticError, tsconfigFile: string, result?: any) {
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
	 */
	code: string;

	/**
	 * full ts diagnostic that caused this error
	 */
	diagnostic: any;

	/**
	 * absolute path of tsconfig file where the error happened
	 */
	tsconfigFile: string;

	/**
	 * native result if present, contains all errors in result.errors
	 */
	result: any | undefined;
}

export interface TSDiagnosticError {
	code: number;
	category: number;
	messageText: string;
	start?: number;
}
