import { fileURLToPath } from 'node:url';
import path from 'path';
import glob from 'tiny-glob';
const cwd = process.cwd();
const root = fileURLToPath(new URL('../..', import.meta.url));
export const fixtures = fileURLToPath(new URL('../fixtures', import.meta.url));
export const absRoot = (relative) => path.resolve(root, relative);
export const absFixture = (fixture) => path.resolve(fixtures, fixture);
export const relFixture = (fixture) => path.relative(cwd, absFixture(fixture));
export const relFromFixtures = (fixture) => path.relative(fixtures, path.resolve(fixture));
export const globFixtures = async (pattern) =>
	(await glob(`${fixtures}/${pattern}`)).map((file) => path.resolve(file)).sort();
/**
 *
 * @param {string} file
 * @param {string} suffix
 * @return {string}
 */
export const snapName = (file, suffix) => {
	const relPath = relFromFixtures(file);
	const base = path.basename(relPath);
	const dir = path.dirname(relPath);
	const fileParts = base.split('.');
	const suffixParts = suffix?.split('.') ?? [];
	const joined = [...fileParts, ...suffixParts].filter((s) => !!s);
	return `snapshots/${dir}/${joined.join('.')}`;
};
