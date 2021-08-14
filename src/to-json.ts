import stripBom from 'strip-bom';
import stripJsonComments from 'strip-json-comments';

/**
 * convert content of tsconfig.json to regular json
 *
 * @param {string} tsconfigJson - content of tsconfig.json
 * @returns {string} content as regular json, comments and dangling commas have been replaced with whitespace
 */
export function toJson(tsconfigJson: string): string {
	return stripDanglingComma(stripJsonComments(stripBom(tsconfigJson)));
}

/**
 * replace dangling commas from pseudo-json string with single space
 * implementation heavily inspired by strip-json-comments
 */
function stripDanglingComma(pseudoJson: string) {
	function isEscaped(jsonString: string, quotePosition: number) {
		let index = quotePosition - 1;
		let backslashCount = 0;
		while (jsonString[index] === '\\') {
			index -= 1;
			backslashCount += 1;
		}
		return backslashCount % 2 === 1;
	}

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
