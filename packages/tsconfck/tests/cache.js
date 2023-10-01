import { describe, it, expect } from 'vitest';
import { TSConfckCache } from '../src/cache.js';

describe('cache', () => {
	describe('clear', () => {
		it('should remove all data', async () => {
			const cache = new TSConfckCache();
			const result = Promise.resolve(/**@type TSConfckParseResult */ ({}));
			expect(cache.hasParseResult('file')).toBe(false);
			cache.setParseResult('file', result);
			cache.setConfigPath('bar', Promise.resolve('bar'));
			expect(cache.hasParseResult('file')).toBe(true);
			expect(cache.hasConfigPath('bar')).toBe(true);
			await cache.clear();
			expect(cache.hasParseResult('file')).toBe(false);
			expect(cache.hasConfigPath('bar')).toBe(false);
		});
	});
});
