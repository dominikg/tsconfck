/*
 this file contains code from strip-bom and strip-json-comments by Sindre Sorhus
 https://github.com/sindresorhus/strip-json-comments/blob/v4.0.0/index.js
 https://github.com/sindresorhus/strip-bom/blob/v5.0.0/index.js
-- LICENSE --
MIT License

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * convert content of tsconfig.json to regular json
 *
 * @param {string} tsconfigJson - content of tsconfig.json
 * @returns {string} content as regular json, comments and dangling commas have been replaced with whitespace
 */
export function toJson(tsconfigJson: string): string {
	const stripped = stripDanglingComma(stripJsonComments(stripBom(tsconfigJson)));
	if (stripped.trim() === '') {
		// only whitespace left after stripping, return empty object so that JSON.parse still works
		return '{}';
	} else {
		return stripped;
	}
}

/**
 * replace dangling commas from pseudo-json string with single space
 * implementation heavily inspired by strip-json-comments
 */
function stripDanglingComma(pseudoJson: string) {
	let insideString = false;
	let offset = 0;
	let result = '';
	let danglingCommaPos = null;
	for (let i = 0; i < pseudoJson.length; i++) {
		const currentCharacter = pseudoJson[i];
		if (currentCharacter === '"') {
			const escaped = isEscaped(pseudoJson, i);
			if (!escaped) {
				insideString = !insideString;
			}
		}
		if (insideString) {
			danglingCommaPos = null;
			continue;
		}
		if (currentCharacter === ',') {
			danglingCommaPos = i;
			continue;
		}
		if (danglingCommaPos) {
			if (currentCharacter === '}' || currentCharacter === ']') {
				result += pseudoJson.slice(offset, danglingCommaPos) + ' ';
				offset = danglingCommaPos + 1;
				danglingCommaPos = null;
			} else if (!currentCharacter.match(/\s/)) {
				danglingCommaPos = null;
			}
		}
	}
	return result + pseudoJson.substring(offset);
}

// start strip-json-comments
function isEscaped(jsonString: string, quotePosition: number) {
	let index = quotePosition - 1;
	let backslashCount = 0;

	while (jsonString[index] === '\\') {
		index -= 1;
		backslashCount += 1;
	}

	return Boolean(backslashCount % 2);
}

function strip(string: string, start?: number, end?: number) {
	return string.slice(start, end).replace(/\S/g, ' ');
}

const singleComment = Symbol('singleComment');
const multiComment = Symbol('multiComment');

function stripJsonComments(jsonString: string) {
	let isInsideString = false;
	let isInsideComment: false | symbol = false;
	let offset = 0;
	let result = '';

	for (let index = 0; index < jsonString.length; index++) {
		const currentCharacter = jsonString[index];
		const nextCharacter = jsonString[index + 1];

		if (!isInsideComment && currentCharacter === '"') {
			const escaped = isEscaped(jsonString, index);
			if (!escaped) {
				isInsideString = !isInsideString;
			}
		}

		if (isInsideString) {
			continue;
		}

		if (!isInsideComment && currentCharacter + nextCharacter === '//') {
			result += jsonString.slice(offset, index);
			offset = index;
			isInsideComment = singleComment;
			index++;
		} else if (isInsideComment === singleComment && currentCharacter + nextCharacter === '\r\n') {
			index++;
			isInsideComment = false;
			result += strip(jsonString, offset, index);
			offset = index;
		} else if (isInsideComment === singleComment && currentCharacter === '\n') {
			isInsideComment = false;
			result += strip(jsonString, offset, index);
			offset = index;
		} else if (!isInsideComment && currentCharacter + nextCharacter === '/*') {
			result += jsonString.slice(offset, index);
			offset = index;
			isInsideComment = multiComment;
			index++;
		} else if (isInsideComment === multiComment && currentCharacter + nextCharacter === '*/') {
			index++;
			isInsideComment = false;
			result += strip(jsonString, offset, index + 1);
			offset = index + 1;
		}
	}

	return result + (isInsideComment ? strip(jsonString.slice(offset)) : jsonString.slice(offset));
}
// end strip-json-comments

// start strip-bom
function stripBom(string: string) {
	// Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
	// conversion translates it to FEFF (UTF-16 BOM).
	if (string.charCodeAt(0) === 0xfeff) {
		return string.slice(1);
	}
	return string;
}
// end strip-bom
