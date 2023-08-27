import { beforeEach, describe, it, expect } from 'vitest';
import { TSConfckCache } from '../src/cache.js';

describe('cache', () => {
	/** @type TSConfckCache */
	let cache;
	beforeEach(() => {
		cache = new TSConfckCache();
	});
	describe('setTSConfigPath', () => {
		it('should add entries for every directory', () => {
			expect(cache.hasTSConfigPath('bar')).toBe(false);
			expect(cache.hasTSConfigPath('baz')).toBe(false);
			cache.setTSConfigPath('foo', ['bar', 'baz']);
			expect(cache.hasTSConfigPath('bar')).toBe(true);
			expect(cache.hasTSConfigPath('baz')).toBe(true);
		});
	});
	describe('clear', () => {
		it('should remove all data', () => {
			const result = /**@type TSConfckParseResult */ ({});
			expect(cache.hasParseResult('file')).toBe(false);
			cache.setParseResult('file', result);
			cache.setTSConfigPath('foo', ['bar']);
			expect(cache.hasParseResult('file')).toBe(true);
			expect(cache.hasTSConfigPath('bar')).toBe(true);
			cache.clear();
			expect(cache.hasParseResult('file')).toBe(false);
			expect(cache.hasTSConfigPath('bar')).toBe(false);
		});
	});
});
