import path from 'path';
import { promises as fs } from 'fs';

/**
 * find all tsconfig.json files in dir
 *
 * @param {string} dir - path to dir (absolute or relative to cwd)
 * @returns {Promise<string[]>} list of absolute paths to all found tsconfig.json files
 */
export async function findAll(dir: string): Promise<string[]> {
	const files = [];
	for await (const tsconfigFile of findTSConfig(path.resolve(dir))) {
		files.push(tsconfigFile);
	}
	return files;
}

const ignored_directories = ['node_modules', '.git'];
async function* findTSConfig(
	dir: string,
	visited: Set<string> = new Set<string>()
): AsyncGenerator<string> {
	if (!visited.has(dir)) {
		const dirents = await fs.readdir(dir, { withFileTypes: true });
		for (const dirent of dirents) {
			if (dirent.isDirectory() && !ignored_directories.includes(dirent.name)) {
				yield* findTSConfig(path.resolve(dir, dirent.name), visited);
			} else if (dirent.isFile() && dirent.name === 'tsconfig.json') {
				yield path.resolve(dir, dirent.name);
			}
		}
	}
}
