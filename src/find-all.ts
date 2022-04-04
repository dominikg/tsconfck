import path from 'path';
import { promises as fs } from 'fs';

/**
 * find all tsconfig.json files in dir
 *
 * @param {string} dir - path to dir (absolute or relative to cwd)
 * @param {TSConfckFindAllOptions} options - options
 * @returns {Promise<string[]>} list of absolute paths to all found tsconfig.json files
 */
export async function findAll(dir: string, options?: TSConfckFindAllOptions): Promise<string[]> {
	const files = [];
	for await (const tsconfigFile of findTSConfig(path.resolve(dir), options)) {
		files.push(tsconfigFile);
	}
	return files;
}

async function* findTSConfig(
	dir: string,
	options?: TSConfckFindAllOptions,
	visited: Set<string> = new Set<string>()
): AsyncGenerator<string> {
	if (!visited.has(dir)) {
		visited.add(dir);
		try {
			const dirents = await fs.readdir(dir, { withFileTypes: true });
			for (const dirent of dirents) {
				if (dirent.isDirectory() && (!options?.skip || !options.skip(dirent.name))) {
					yield* findTSConfig(path.resolve(dir, dirent.name), options, visited);
				} else if (dirent.isFile() && dirent.name === 'tsconfig.json') {
					yield path.resolve(dir, dirent.name);
				}
			}
		} catch (e) {
			if (e.code === 'EACCES' || e.code === 'ENOENT') {
				return; // directory inaccessible or deleted
			}
			throw e;
		}
	}
}

export interface TSConfckFindAllOptions {
	/**
	 * helper to skip subdirectories when scanning for tsconfig.json
	 *
	 * eg ` dir => dir === 'node_modules' || dir === '.git'`
	 */ // eslint-disable-next-line no-unused-vars
	skip?: (dir: string) => boolean;
}
