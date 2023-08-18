declare module 'tsconfck' {
	/**
	 * find the closest tsconfig.json file
	 *
	 * @param filename - path to file to find tsconfig for (absolute or relative to cwd)
	 * @param options - options
	 * @returns absolute path to closest tsconfig.json
	 */
	export function find(filename: string, options: TSConfckFindOptions | null): Promise<string>;
	/**
	 * find all tsconfig.json files in dir
	 *
	 * @param dir - path to dir (absolute or relative to cwd)
	 * @param options - options
	 * @returns list of absolute paths to all found tsconfig.json files
	 */
	export function findAll(dir: string, options: TSConfckFindAllOptions | null): Promise<string[]>;
	/**
	 * convert content of tsconfig.json to regular json
	 *
	 * @param tsconfigJson - content of tsconfig.json
	 * @returns content as regular json, comments and dangling commas have been replaced with whitespace
	 */
	export function toJson(tsconfigJson: string): string;
	/**
	 * find the closest tsconfig.json file using native ts.findConfigFile
	 *
	 * You must have `typescript` installed to use this
	 *
	 * @param filename - path to file to find tsconfig for (absolute or relative to cwd)
	 * @returns absolute path to closest tsconfig.json
	 */
	export function findNative(filename: string): Promise<string>;
	/**
	 * parse the closest tsconfig.json file
	 *
	 * @param filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
	 * @param options - options
	 * */
	export function parse(filename: string, options: TSConfckParseOptions | null): Promise<TSConfckParseResult>;
	export class TSConfckParseError extends Error {
		/**
		 *
		 * @param message - error message
		 * @param code - error code
		 * @param tsconfigFile - path to tsconfig file
		 * @param cause - cause of this error
		 */
		constructor(message: string, code: string, tsconfigFile: string, cause: Error | null);
		/**
		 * error code
		 * */
		code: string;
		/**
		 * error cause
		 * */
		cause: Error | undefined;
		/**
		 * absolute path of tsconfig file where the error happened
		 * */
		tsconfigFile: string;
		name: any;
	}
	/**
	 * parse the closest tsconfig.json file with typescript native functions
	 *
	 * You need to have `typescript` installed to use this
	 *
	 * @param filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
	 * @param options - options
	 * */
	export function parseNative(filename: string, options: TSConfckParseNativeOptions | null): Promise<TSConfckParseNativeResult>;
	export class TSConfckParseNativeError extends Error {
		/**
		 *
		 * @param diagnostic - diagnostics of ts
		 * @param tsconfigFile - file that errored
		 * @param result  - parsed result, if any
		 */
		constructor(diagnostic: any, tsconfigFile: string, result: any | null);
		name: any;
		/**
		 * code of typescript diagnostic, prefixed with "TS "
		 * */
		code: string;
		/**
		 * full ts diagnostic that caused this error
		 * */
		diagnostic: any;
		/**
		 * native result if present, contains all errors in result.errors
		 * */
		result: any | undefined;
		/**
		 * absolute path of tsconfig file where the error happened
		 * */
		tsconfigFile: string;
	}
	interface TSConfckFindOptions {
		/**
		 * Set of known tsconfig file locations to use instead of scanning the file system
		 *
		 * This is better for performance in projects like vite where find is called frequently but tsconfig locations rarely change
		 * You can use `findAll` to build this
		 */
		tsconfigPaths?: Set<string>;

		/**
		 * project root dir, does not continue scanning outside of this directory.
		 *
		 * Improves performance but may lead to different results from native typescript when no tsconfig is found inside root
		 */
		root?: string;
	}

	interface TSConfckFindAllOptions {
		/**
		 * helper to skip subdirectories when scanning for tsconfig.json
		 *
		 * eg ` dir => dir === 'node_modules' || dir === '.git'`
		 */ // eslint-disable-next-line no-unused-vars
		skip?: (dir: string) => boolean;
	}

	interface TSConfckParseOptions extends TSConfckFindOptions {
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

	interface TSConfckParseResult {
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

	interface TSConfckParseNativeOptions {
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

	interface TSConfckParseNativeResult {
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
}

//# sourceMappingURL=index.d.ts.map