import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 *
 * @param {string} from
 * @param {string} to
 * @param {(x:Dirent)=>boolean?}filter
 * @returns {Promise<string>}
 */
export async function copyFixtures(from, to, filter) {
	const src = path.join('tests', 'fixtures', from);
	const dest = path.join('tests', 'temp', to);
	try {
		await fs.rm(dest, { recursive: true });
		// eslint-disable-next-line no-unused-vars
	} catch (e) {
		// ignore
	}
	await copy(src, dest, filter);
	return dest;
}

/**
 *
 * @param {string} src
 * @param {string} dest
 * @param {(x:Dirent)=>boolean?}filter
 * @return {Promise<void>}
 */
async function copy(src, dest, filter) {
	const [entries] = await Promise.all([
		fs.readdir(src, { withFileTypes: true }),
		fs.mkdir(dest, { recursive: true })
	]);

	await Promise.all(
		entries.map((entry) => {
			if (filter && !filter(entry)) {
				return;
			}
			const srcPath = path.join(src, entry.name);
			const destPath = path.join(dest, entry.name);
			return entry.isDirectory() ? copy(srcPath, destPath, filter) : fs.copyFile(srcPath, destPath);
		})
	);
}
