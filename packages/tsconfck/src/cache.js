/** @template T */
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
	 * @returns {Promise<string|null>|string|null}
	 */
	getTSConfigPath(dir) {
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
	 * @returns {Promise<T>|T}
	 */
	getParseResult(file) {
		return this.#parsed.get(file);
	}

	/**
	 * @internal
	 * @private
	 * @param file
	 * @param {Promise<T>} result
	 */
	setParseResult(file, result) {
		this.#parsed.set(file, result);
		result
			.then((parsed) => {
				if (this.#parsed.get(file) === result) {
					this.#parsed.set(file, parsed);
				}
			})
			.catch(() => {
				if (this.#parsed.get(file) === result) {
					this.#parsed.delete(file);
				}
			});
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
			.then((path) => {
				if (this.#tsconfigPaths.get(dir) === tsconfigPath) {
					this.#tsconfigPaths.set(dir, path);
				}
			})
			.catch(() => {
				if (this.#tsconfigPaths.get(dir) === tsconfigPath) {
					this.#tsconfigPaths.delete(dir);
				}
			});
	}

	/**
	 * map directories to their closest tsconfig.json
	 * @internal
	 * @private
	 * @type{Map<string,(Promise<string|null>|string|null)>}
	 */
	#tsconfigPaths = new Map();

	/**
	 * map files to their parsed tsconfig result
	 * @internal
	 * @private
	 * @type {Map<string,(Promise<T>|T)> }
	 */
	#parsed = new Map();
}
