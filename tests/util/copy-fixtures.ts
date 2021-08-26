import { promises as fs, Dirent } from 'fs';
import path from 'path';

// eslint-disable-next-line no-unused-vars
export async function copyFixtures(from: string, to: string, filter?: (x: Dirent) => boolean) {
	const src = path.join('tests', 'fixtures', from);
	const dest = path.join('tests', 'temp', to);
	try {
		await fs.rmdir(dest, { recursive: true });
	} catch (e) {
		// ignore
	}
	await copy(src, dest, filter);
	return dest;
}

// eslint-disable-next-line no-unused-vars
async function copy(src: string, dest: string, filter?: (x: Dirent) => boolean) {
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
