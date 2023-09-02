import { describe, it, expect } from 'vitest';
import { TSConfckCache } from '../src/cache.js';

describe('cache', () => {
	describe('clear', () => {
		it('should remove all data', async () => {
			const cache = new TSConfckCache();
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
	});
});
