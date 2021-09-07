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
 * @returns {Promise<ParseResult>}
 * @throws {ParseError}
 */
declare function parse(filename: string): Promise<ParseResult>;
interface ParseResult {
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
    solution?: ParseResult;
    /**
     * ParseResults for all tsconfig files referenced in a solution
     */
    referenced?: ParseResult[];
    /**
     * ParseResult for all tsconfig files
     *
     * [a,b,c] where a extends b and b extends c
     */
    extended?: ParseResult[];
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
 * @returns {Promise<ParseNativeResult>}
 * @throws {ParseNativeError}
 */
declare function parseNative(filename: string): Promise<ParseNativeResult>;
interface ParseNativeResult {
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
    solution?: ParseNativeResult;
    /**
     * ParseNativeResults for all tsconfig files referenced in a solution
     */
    referenced?: ParseNativeResult[];
    /**
     * full output of ts.parseJsonConfigFileContent
     */
    result: any;
}
```
