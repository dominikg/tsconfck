import path from 'path';
import fs from 'fs';
import { resolve2posix } from '../../src/util.js';
import { versions } from 'process';

const nodeVersion = versions.node.split('.', 1)[0];

function findExpectedFile(filename: string) {
	const lastDot = filename.lastIndexOf('.');
	const fileWithNode = `${filename.slice(0, lastDot)}.node${nodeVersion}.${filename.slice(
		lastDot + 1
	)}`;
	return fs.existsSync(fileWithNode) ? fileWithNode : filename;
}

export function loadExpectedJSON(
	inputFile: string,
	expectedFile = 'expected.native.json'
): Promise<any> {
	return loadExpected(inputFile, expectedFile, 'json');
}

export function loadExpectedTXT(inputFile: string, expectedFile = 'expected.txt'): string {
	return loadExpected(inputFile, expectedFile, 'txt');
}

function loadExpected(inputFile: string, expectedName: string, mode: 'txt' | 'json'): string | any {
	const dir = path.resolve(path.dirname(inputFile));
	const expectedFilename = findExpectedFile(path.join(dir, expectedName));

	try {
		const content = fs.readFileSync(expectedFilename, 'utf-8');
		if (mode === 'txt') {
			return content.replace(/<dir>/g, dir);
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
