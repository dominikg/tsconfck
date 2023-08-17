import { fileURLToPath } from 'node:url';
import path from 'path';
import glob from 'tiny-glob';
import { native2posix } from '../../src/util.js';
const cwd = process.cwd();
const root = fileURLToPath(new URL('../..', import.meta.url));
export const fixtures = fileURLToPath(new URL('../fixtures', import.meta.url));
export const absRoot = (relative) => native2posix(path.resolve(root, relative));
export const absFixture = (fixture) => native2posix(path.resolve(fixtures, fixture));
export const relFixture = (fixture) => native2posix(path.relative(cwd, absFixture(fixture)));
export const relFromFixtures = (fixture) =>
	native2posix(path.relative(fixtures, path.resolve(fixture)));
export const globFixtures = async (pattern) =>
	(await glob(`${fixtures}/${pattern}`)).map((file) => native2posix(path.resolve(file))).sort();
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

const fixtureDirRegex = new RegExp(
	fixtures.replace(/\\/g, '/').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
	'g'
);
export function replaceFixtureDir(str) {
	return str.replace(fixtureDirRegex, '<fixture-dir>');
}
