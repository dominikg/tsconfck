export class TSConfckCache {
	/**
	 * clear cache, use this if you have a long running process and tsconfig files have been added,changed or deleted
	 * await it to ensure all find and parse calls are settled before continuing
	 */
	async clear() {
		if (!this.#clearing) {
			this.#clearing = Promise.allSettled([
				...this.#tsconfigPaths.values(),
				...this.#parsed.values()
			])
				.then(() => {
					this.#tsconfigPaths.clear();
					this.#parsed.clear();
				})
				.finally(() => {
					this.#clearing = undefined;
				});
		}
		return this.#clearing;
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
	 * @returns {import('./public.d.ts').Awaitable<string|null>}
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
	 * @returns {import('./public.d.ts').Awaitable<import('./public.d.ts').TSConfckParseResult | import('./public.d.ts').TSConfckParseNativeResult>}
	 */
	getParseResult(file) {
		return this.#parsed.get(file);
	}

	/**
	 * @internal
	 * @private
	 * @param file
	 * @param {Promise<import('./public.d.ts').TSConfckParseResult | import('./public.d.ts').TSConfckParseNativeResult>} result
	 */
	setParseResult(file, result) {
		this.#parsed.set(file, result);
		result.then((parsed) => this.#parsed.set(file, parsed)).catch(() => this.#parsed.delete(file));
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
	 * @param {Promise<string|null>} tsconfigPath
	 */
	setTSConfigPath(dir, tsconfigPath) {
		this.#tsconfigPaths.set(dir, tsconfigPath);
		tsconfigPath
			.then((path) => this.#tsconfigPaths.set(dir, path))
			.catch(() => this.#tsconfigPaths.delete(dir));
	}

	/**
	 * map directories to their closest tsconfig.json
	 * @internal
	 * @private
	 * @type{Map<string,import('./public.d.ts').Awaitable<string|null>>}
	 */
	#tsconfigPaths = new Map();

	/**
	 * map files to their parsed tsconfig result
	 * @internal
	 * @private
	 * @type {Map<string,import('./public.d.ts').Awaitable<import('./public.d.ts').TSConfckParseResult | import('./public.d.ts').TSConfckParseNativeResult>> }
	 */
	#parsed = new Map();

	/** @type{Promise<void>} */
	#clearing;
}
