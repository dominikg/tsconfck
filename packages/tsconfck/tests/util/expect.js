import { expect } from 'vitest';
import { fixtures, snapName } from './fixture-paths.js';

const fixtureDirRegex = new RegExp(
	fixtures.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/(\/|\\\\)/g, '[/\\\\]'),
	'g'
);
function normalizeSnapshot(str) {
	return str
		.replace(fixtureDirRegex, '<fixture-dir>')
		.replace(/<fixture-dir>(\\[^\\ ]+)+/g, (m) => m.replace(/\\/g, '/'));
}
// TODO refactor after vitest is able to print regular json for toMatchFileSnapshot calls
/**
 *
 * @param {any} actual data to snapshot
 * @param {string} message message to pass to expect
 * @param inputFile file that is used as input for the test, used to build the snapshot output dir
 * @param suffix suffix to append to the file to avoid snapshot collisions, use foo.bar.baz notation for multiple values, must end with extension that matches data
 * @return {Promise<void>}
 */
export async function expectToMatchSnap(actual, message, inputFile, suffix) {
	const toJSON = typeof actual !== 'string';
	if (!suffix) {
		throw new Error('suffix required');
	}
	if (toJSON) {
		if (!suffix.endsWith('.json')) {
			suffix = suffix + '.json';
		}
	} else {
		if (!['.js', '.ts', '.json', '.txt'].some((ext) => suffix.endsWith(ext))) {
			suffix = suffix + '.txt';
		}
	}
	const normalizedValue = normalizeSnapshot(toJSON ? JSON.stringify(actual, null, '\t') : actual);

	await expect(normalizedValue, message).toMatchFileSnapshot(snapName(inputFile, suffix), message);
}

/**
 *
 * @param {string} errormessage
 * @param {string} inputFile
 * @param {string} suffix
 * @return {Promise<void>}
 */
export async function expectToMatchErrorSnap(errormessage, inputFile, suffix) {
	const nodeMajor = process?.versions.node.split('.', 1)[0];
	const suffixes = ['error', `node${nodeMajor}`];
	if (suffix) {
		suffixes.push(suffix);
	}
	suffixes.push('txt');
	await expectToMatchSnap(errormessage, `error for ${inputFile}`, inputFile, suffixes.join('.'));
}
