export class TSConfckCache {
	/**
	 * @internal
	 * map directories to their closest tsconfig.json
	 * @type{Map<string,string>}
	 */
	#tsconfigPaths = new Map();

	/**
	 * @internal
	 * map files to their parsed tsconfig result
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
	 * @param {string} dir
	 * @returns {string}
	 */
	getTSConfigPath(dir) {
		return this.#tsconfigPaths.get(dir);
	}

	/**
	 * @internal
	 * @param {string} dir
	 * @returns {boolean}
	 */
	hasTSConfigPath(dir) {
		return this.#tsconfigPaths.has(dir);
	}

	/**
	 * @internal
	 * @param {string} file
	 * @returns {import('./public.d.ts').TSConfckParseResult | import('./public.d.ts').TSConfckParseNativeResult }
	 */
	getParseResult(file) {
		return this.#parsed.get(file);
	}

	/**
	 * @internal
	 * @param file
	 * @param {import('./public.d.ts').TSConfckParseResult | import('./public.d.ts').TSConfckParseNativeResult} result
	 */
	setParseResult(file, result) {
		this.#parsed.set(file, result);
	}

	/**
	 * @internal
	 * @param {string} file
	 * @returns {boolean}
	 */
	hasParseResult(file) {
		return this.#parsed.has(file);
	}
}
