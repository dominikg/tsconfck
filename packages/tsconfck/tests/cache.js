import { beforeEach, describe, it, expect } from 'vitest';
import { TSConfckCache } from '../src/cache.js';

describe('cache', () => {
	/** @type TSConfckCache */
	let cache;
	beforeEach(() => {
		cache = new TSConfckCache();
	});
	describe('clear', () => {
		it('should remove all data', () => {
			const result = /**@type TSConfckParseResult */ ({});
			expect(cache.hasParseResult('file')).toBe(false);
			cache.setParseResult('file', result);
			cache.setTSConfigPath('bar', Promise.resolve('bar'));
			expect(cache.hasParseResult('file')).toBe(true);
			expect(cache.hasTSConfigPath('bar')).toBe(true);
			cache.clear();
			expect(cache.hasParseResult('file')).toBe(false);
			expect(cache.hasTSConfigPath('bar')).toBe(false);
		});
	});
});
