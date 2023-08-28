export class TSConfckCache {
	/**
	 * clear cache, use this if you have a long running process and tsconfig files have been added,changed or deleted
	 */
	clear() {
		this.#tsconfigPaths.clear();
		this.#parsed.clear();
	}

	/**
	 * has cached closest tsconfig for files in dir
	 * @param {string} dir
	 * @returns {boolean}
	 */
	hasTSConfigPath(dir) {
		return this.#tsconfigPaths.has(dir);
	}

	/**
	 * get cached closest tsconfig for files in dir
	 * @param {string} dir
	 * @returns {Promise<string>}
	 */
	async getTSConfigPath(dir) {
		return this.#tsconfigPaths.get(dir);
	}

	/**
	 * has parsed tsconfig for file
	 * @param {string} file
	 * @returns {boolean}
	 */
	hasParseResult(file) {
		return this.#parsed.has(file);
	}

	/**
	 * get parsed tsconfig for file
	 * @param {string} file
	 * @returns {Promise<import('./public.d.ts').TSConfckParseResult | import('./public.d.ts').TSConfckParseNativeResult> }
	 */
	getParseResult(file) {
		return this.#parsed.get(file);
	}

	/**
	 * @internal
	 * @private
	 * @param file
	 * @param {Promise<import('./public.d.ts').TSConfckParseResult | import('./public.d.ts').TSConfckParseNativeResult> } result
	 */
	setParseResult(file, result) {
		this.#parsed.set(file, result);
	}

	/**
	 * @internal
	 * @private
	 * @param file
	 */
	deleteParseResult(file) {
		this.#parsed.delete(file);
	}

	/**
	 * @internal
	 * @private
	 * @param {string} dir
	 * @param {Promise<string>} tsconfigPath
	 */
	setTSConfigPath(dir, tsconfigPath) {
		this.#tsconfigPaths.set(dir, tsconfigPath);
	}

	/**
	 * map directories to their closest tsconfig.json
	 * @internal
	 * @private
	 * @type{Map<string,Promise<string>>}
	 */
	#tsconfigPaths = new Map();

	/**
	 * map files to their parsed tsconfig result
	 * @internal
	 * @private
	 * @type {Map<string,Promise<import('./public.d.ts').TSConfckParseResult | import('./public.d.ts').TSConfckParseNativeResult>>}
	 */
	#parsed = new Map();
}
