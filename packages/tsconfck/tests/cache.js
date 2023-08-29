import { beforeEach, describe, it, expect } from 'vitest';
import { TSConfckCache } from '../src/cache.js';

describe('cache', () => {
	/** @type TSConfckCache */
	let cache;
	beforeEach(() => {
		cache = new TSConfckCache();
	});
	describe('clear', () => {
		it('should remove all data', async () => {
			const result = Promise.resolve(/**@type TSConfckParseResult */ ({}));
			expect(cache.hasParseResult('file')).toBe(false);
			cache.setParseResult('file', result);
			cache.setTSConfigPath('bar', Promise.resolve('bar'));
			expect(cache.hasParseResult('file')).toBe(true);
			expect(cache.hasTSConfigPath('bar')).toBe(true);
			await cache.clear();
			expect(cache.hasParseResult('file')).toBe(false);
			expect(cache.hasTSConfigPath('bar')).toBe(false);
		});

		it.fails(
			'to settle with pending parse result',
			async () => {
				const resultPromise = new Promise(() => {});
				expect(cache.hasParseResult('file')).toBe(false);
				cache.setParseResult('file', resultPromise);
				expect(cache.hasParseResult('file')).toBe(true);
				await cache.clear();
			},
			50
		);
		it.fails(
			'to settle with pending find result',
			async () => {
				const resultPromise = new Promise(() => {});
				expect(cache.hasTSConfigPath('file')).toBe(false);
				cache.setTSConfigPath('file', resultPromise);
				expect(cache.hasTSConfigPath('file')).toBe(true);
				await cache.clear();
			},
			50
		);
	});
});
