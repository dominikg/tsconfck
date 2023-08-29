import { TSConfckCache } from './cache';

export interface TSConfckFindOptions {
	/**
	 * A cache to improve performance for multiple calls in the same project
	 *
	 * Warning: You must clear this cache in case tsconfig files are added/removed during it's lifetime
	 */
	cache?: TSConfckCache;

	/**
	 * project root dir, does not continue scanning outside of this directory.
	 *
	 * Improves performance but may lead to different results from native typescript when no tsconfig is found inside root
	 */
	root?: string;
}

export interface TSConfckFindAllOptions {
	/**
	 * helper to skip subdirectories when scanning for tsconfig.json
	 *
	 * eg ` dir => dir === 'node_modules' || dir === '.git'`
	 */ // eslint-disable-next-line no-unused-vars
	skip?: (dir: string) => boolean;
}

export interface TSConfckParseOptions extends TSConfckFindOptions {
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

export interface TSConfckParseNativeOptions extends TSConfckParseOptions {
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

export type Awaitable<T> = Promise<T> | T;
