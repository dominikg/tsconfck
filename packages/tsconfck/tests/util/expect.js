import { expect } from 'vitest';
import { fixtures, snapName } from './fixture-paths.js';
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
	await expect(toJSON ? JSON.stringify(actual, null, '\t') : actual, message).toMatchFileSnapshot(
		snapName(inputFile, suffix)
	);
}

/**
 *
 * @param {string} errormessage
 * @param {string} inputFile
 * @param {string} suffix
 * @return {Promise<void>}
 */
export async function expectToMatchErrorSnap(errormessage, inputFile, suffix) {
	const fixtureDirRegex = new RegExp(fixtures.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
	const nodeMajor = process?.versions.node.split('.', 1)[0];
	const normalizedMessage = errormessage.replace(fixtureDirRegex, '<fixture-dir>');
	const suffixes = ['error', `node${nodeMajor}`];
	if (suffix) {
		suffixes.push(suffix);
	}
	suffixes.push('txt');
	await expectToMatchSnap(
		normalizedMessage,
		`error for ${inputFile}`,
		inputFile,
		suffixes.join('.')
	);
}
