<!-- generated, do not modify -->

## API

### find

```ts
/**
 * find the closest tsconfig.json file
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @returns {Promise<string>} absolute path to closest tsconfig.json
 */
declare function find(filename: string): Promise<string>;
```

### toJson

```ts
/**
 * convert content of tsconfig.json to regular json
 *
 * @param {string} tsconfigJson - content of tsconfig.json
 * @returns {string} content as regular json, comments and dangling commas have been replaced with whitespace
 */
declare function toJson(tsconfigJson: string): string;
```

### parse

```ts
/**
 * parse the closest tsconfig.json file
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @param {TSConfckParseOptions} options - options
 * @returns {Promise<TSConfckParseResult>}
 * @throws {TSConfckParseError}
 */
declare function parse(filename: string, options?: TSConfckParseOptions): Promise<TSConfckParseResult>;
```

### findNative

```ts
/**
 * find the closest tsconfig.json file using native ts.findConfigFile
 *
 * You must have `typescript` installed to use this
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @returns {Promise<string>} absolute path to closest tsconfig.json
 */
declare function findNative(filename: string): Promise<string>;
```

### parseNative

```ts
/**
 * parse the closest tsconfig.json file with typescript native functions
 *
 * You need to have `typescript` installed to use this
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @param {TSConfckParseNativeOptions} options - options
 * @returns {Promise<TSConfckParseNativeResult>}
 * @throws {TSConfckParseNativeError}
 */
declare function parseNative(filename: string, options?: TSConfckParseNativeOptions): Promise<TSConfckParseNativeResult>;
```



## SYNC API

### find

```ts
/**
 * find the closest tsconfig.json file
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @returns {string} absolute path to closest tsconfig.json
 */
declare function find(filename: string): string;
```

### parse

```ts
/**
 * parse the closest tsconfig.json file
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @param {TSConfckParseOptions} options - options
 * @returns {TSConfckParseResult}
 * @throws {TSConfckParseError}
 */
declare function parse(filename: string, options?: TSConfckParseOptions): TSConfckParseResult;
```

### findNative

```ts
/**
 * find the closest tsconfig.json file using native ts.findConfigFile
 *
 * You must have `typescript` installed to use this
 *
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @returns {string} absolute path to closest tsconfig.json
 */
declare function findNative(filename: string): string;
```

### parseNative

```ts
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
declare function parseNative(filename: string, options?: TSConfckParseNativeOptions): TSConfckParseNativeResult;
```



## TYPES

### TSConfckParseOptions

```ts
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
```

### TSConfckParseResult

```ts
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
```

### TSConfckParseError

```ts
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
```

### TSConfckParseNativeOptions

```ts
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
```

### TSConfckParseNativeResult

```ts
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
```

### TSConfckParseNativeError

```ts
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
```

### TSDiagnosticError

```ts
export interface TSDiagnosticError {
	code: number;
	category: number;
	messageText: string;
	start?: number;
}
```
