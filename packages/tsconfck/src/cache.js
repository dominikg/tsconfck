export class TSConfckCache {
	/**
	 * map directories to their closest tsconfig.json
	 * @internal
	 * @private
	 * @type{Map<string,string>}
	 */
	#tsconfigPaths = new Map();

	/**
	 * map files to their parsed tsconfig result
	 * @internal
	 * @private
	 * @type {Map<string,import('./public.d.ts').TSConfckParseResult | import('./public.d.ts').TSConfckParseNativeResult>}
	 */
	#parsed = new Map();

	/**
	 * clear cache, use this if you have a long running process and tsconfig files have been added,changed or deleted
	 */
	clear() {
		this.#tsconfigPaths.clear();
		this.#parsed.clear();
	}

	/**
	 * @internal
	 * @private
	 * @param {string} tsconfigPath
	 * @param {string[]} directories
	 */
	setTSConfigPath(tsconfigPath, directories) {
		for (const dir of directories) {
			this.#tsconfigPaths.set(dir, tsconfigPath);
		}
	}

	/**
	 * @internal
	 * @private
	 * @param {string} dir
	 * @returns {string}
	 */
	getTSConfigPath(dir) {
		return this.#tsconfigPaths.get(dir);
	}

	/**
	 * @internal
	 * @private
	 * @param {string} dir
	 * @returns {boolean}
	 */
	hasTSConfigPath(dir) {
		return this.#tsconfigPaths.has(dir);
	}

	/**
	 * @internal
	 * @private
	 * @param {string} file
	 * @returns {import('./public.d.ts').TSConfckParseResult | import('./public.d.ts').TSConfckParseNativeResult }
	 */
	getParseResult(file) {
		return this.#parsed.get(file);
	}

	/**
	 * @internal
	 * @private
	 * @param file
	 * @param {import('./public.d.ts').TSConfckParseResult | import('./public.d.ts').TSConfckParseNativeResult} result
	 */
	setParseResult(file, result) {
		this.#parsed.set(file, result);
	}

	/**
	 * @internal
	 * @private
	 * @param {string} file
	 * @returns {boolean}
	 */
	hasParseResult(file) {
		return this.#parsed.has(file);
	}
}
