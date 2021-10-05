import path from 'node:path';
import { promises as fs } from 'node:fs';
import { resolve2posix } from '../../src/util.js';

export async function loadExpectedJSON(
	inputFile: string,
	expectedFile = 'expected.native,json'
): Promise<any> {
	return loadExpected(inputFile, expectedFile, 'json');
}

export async function loadExpectedTXT(
	inputFile: string,
	expectedFile = 'expected.txt'
): Promise<string> {
	return loadExpected(inputFile, expectedFile, 'txt');
}

async function loadExpected(
	inputFile: string,
	expectedName: string,
	mode: 'txt' | 'json'
): Promise<string | any> {
	const dir = path.resolve(path.dirname(inputFile));
	const expectedFilename = path.join(dir, expectedName);

	try {
		const content = await fs.readFile(expectedFilename, 'utf-8');
		if (mode === 'txt') {
			return content;
		} else if (mode === 'json') {
			return JSON.parse(content, (k, v) => {
				if (v && typeof v === 'string' && v.startsWith('<to-abs>')) {
					return resolve2posix(dir, v.substring(8));
				}
				return v;
			});
		} else {
			throw new Error('invalid mode: ' + mode);
		}
	} catch (e) {
		const msg = `unexpected exception parsing ${expectedFilename}: ${e}`;
		console.error(msg, e);
		throw new Error(`unexpected exception parsing ${expectedFilename}: ${e}`);
	}
}
