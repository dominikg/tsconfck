import path from 'path';
import fs from 'fs';
import { find } from './find.js';
import { toJson } from '../to-json.js';
import {
	resolveReferencedTSConfigFiles,
	resolveSolutionTSConfig,
	resolveTSConfigSync
} from '../util.js';
import { extendTSConfig, resolveExtends, normalizeTSConfig } from '../parse.js';
import { TSConfckParseError, TSConfckParseOptions, TSConfckParseResult } from '../types.js';
/**
 * parse the closest tsconfig.json file
 *
 * @param {string} filename - path to a tsconfig.json or a .ts source file (absolute or relative to cwd)
 * @param {TSConfckParseOptions} options - options
 * @returns {TSConfckParseResult}
 * @throws {TSConfckParseError}
 */
export function parse(filename: string, options?: TSConfckParseOptions): TSConfckParseResult {
	const cache = options?.cache;
	if (cache?.has(filename)) {
		return cache.get(filename)!;
	}
	let tsconfigFile;
	if (options?.resolveWithEmptyIfConfigNotFound) {
		try {
			tsconfigFile = resolveTSConfigSync(filename) || find(filename);
		} catch (e) {
			const notFoundResult = {
				tsconfigFile: 'no_tsconfig_file_found',
				tsconfig: {}
			};
			cache?.set(filename, notFoundResult);
			return notFoundResult;
		}
	} else {
		tsconfigFile = resolveTSConfigSync(filename) || find(filename);
	}
	let result;
	if (cache?.has(tsconfigFile)) {
		result = cache.get(tsconfigFile)!;
	} else {
		result = parseFile(tsconfigFile, cache);
		parseExtends(result, cache);
		parseReferences(result, cache);
		cache?.set(tsconfigFile, result);
	}
	result = resolveSolutionTSConfig(filename, result);
	cache?.set(filename, result);
	return result;
}

function parseFile(
	tsconfigFile: string,
	cache?: Map<string, TSConfckParseResult>
): TSConfckParseResult {
	if (cache?.has(tsconfigFile)) {
		return cache.get(tsconfigFile)!;
	}
	try {
		const tsconfigJson = fs.readFileSync(tsconfigFile, 'utf-8');
		const json = toJson(tsconfigJson);
		const result = {
			tsconfigFile,
			tsconfig: normalizeTSConfig(JSON.parse(json), path.dirname(tsconfigFile))
		};
		cache?.set(tsconfigFile, result);
		return result;
	} catch (e) {
		throw new TSConfckParseError(
			`parsing ${tsconfigFile} failed: ${e}`,
			'PARSE_FILE',
			tsconfigFile,
			e
		);
	}
}

function parseReferences(result: TSConfckParseResult, cache?: Map<string, TSConfckParseResult>) {
	if (!result.tsconfig.references) {
		return;
	}
	const referencedFiles = resolveReferencedTSConfigFiles(result);
	const referenced = referencedFiles.map((file) => parseFile(file, cache));
	referenced.map((ref) => parseExtends(ref, cache));
	result.referenced = referenced;
}

function parseExtends(result: TSConfckParseResult, cache?: Map<string, TSConfckParseResult>) {
	if (!result.tsconfig.extends) {
		return;
	}
	// use result as first element in extended
	// but dereference tsconfig so that mergeExtended can modify the original without affecting extended[0]
	const extended = [
		{ tsconfigFile: result.tsconfigFile, tsconfig: JSON.parse(JSON.stringify(result.tsconfig)) }
	];

	while (extended[extended.length - 1].tsconfig.extends) {
		const extending = extended[extended.length - 1];
		const extendedTSConfigFile = resolveExtends(extending.tsconfig.extends, extending.tsconfigFile);
		if (extended.some((x) => x.tsconfigFile === extendedTSConfigFile)) {
			const circle = extended
				.concat({ tsconfigFile: extendedTSConfigFile, tsconfig: null })
				.map((e) => e.tsconfigFile)
				.join(' -> ');
			throw new TSConfckParseError(
				`Circular dependency in "extends": ${circle}`,
				'EXTENDS_CIRCULAR',
				result.tsconfigFile
			);
		}
		extended.push(parseFile(extendedTSConfigFile, cache));
	}
	result.extended = extended;
	// skip first as it is the original config
	for (const ext of result.extended!.slice(1)) {
		extendTSConfig(result, ext);
	}
}
