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
interface TSConfckParseOptions {
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
    filename: string;
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
declare class TSConfckParseError extends Error {
    constructor(message: string, code: string, cause?: Error);
    /**
     * error code
     */
    code: string;
    /**
     * the cause of this error
     */
    cause: Error | undefined;
}
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
    filename: string;
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
declare class TSConfckParseNativeError extends Error {
    constructor(diagnostic: TSDiagnosticError, result?: any);
    /**
     * code of typescript diagnostic, prefixed with "TS "
     */
    code: string;
    /**
     * full ts diagnostic that caused this error
     */
    diagnostic: any;
    /**
     * native result if present, contains all errors in result.errors
     */
    result: any | undefined;
}
interface TSDiagnosticError {
    code: number;
    category: number;
    messageText: string;
    start?: number;
}
```
