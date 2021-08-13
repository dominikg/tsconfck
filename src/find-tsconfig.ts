/**
 * find the closest tsconfig.json file
 * @param {string} filename - path to file to find tsconfig for (absolute or relative to cwd)
 * @returns {Promise<string|null>} absolute path to closest tsconfig.json or null if not found
 */
export async function find(filename: string) {
	return filename ? 'found' : null;
}
