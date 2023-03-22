import path from 'path';
import { Dirent, readdir } from 'fs';

interface WalkState {
	files: string[];
	calls: number;
	// eslint-disable-next-line no-unused-vars
	skip?: (dir: string) => boolean;
	err: boolean;
}

const sep = path.sep;

/**
 * find all tsconfig.json files in dir
 *
 * @param {string} dir - path to dir (absolute or relative to cwd)
 * @param {TSConfckFindAllOptions} options - options
 * @returns {Promise<string[]>} list of absolute paths to all found tsconfig.json files
 */
export async function findAll(dir: string, options?: TSConfckFindAllOptions): Promise<string[]> {
	const state: WalkState = {
		files: [],
		calls: 0,
		skip: options?.skip,
		err: false
	};
	return new Promise((resolve, reject) => {
		walk(path.resolve(dir), state, (err, files) => (err ? reject(err) : resolve(files!)));
	});
}

function walk(
	dir: string,
	state: WalkState,
	// eslint-disable-next-line no-unused-vars
	done: (err: NodeJS.ErrnoException | null, files?: string[]) => void
) {
	if (state.err) {
		return;
	}
	state.calls++;
	readdir(dir, { withFileTypes: true }, (err, entries: Dirent[] = []) => {
		if (state.err) {
			return;
		}
		// skip deleted or inaccessible directories
		if (err && !(err.code === 'ENOENT' || err.code === 'EACCES')) {
			state.err = true;
			done(err);
		} else {
			for (const ent of entries) {
				if (ent.isDirectory() && !state.skip?.(ent.name)) {
					walk(`${dir}${sep}${ent.name}`, state, done);
				} else if (ent.isFile() && ent.name === 'tsconfig.json') {
					state.files.push(`${dir}${sep}tsconfig.json`);
				}
			}
			if (--state.calls === 0) {
				if (!state.err) {
					done(null, state.files);
				}
			}
		}
	});
}

export interface TSConfckFindAllOptions {
	/**
	 * helper to skip subdirectories when scanning for tsconfig.json
	 *
	 * eg ` dir => dir === 'node_modules' || dir === '.git'`
	 */ // eslint-disable-next-line no-unused-vars
	skip?: (dir: string) => boolean;
}
