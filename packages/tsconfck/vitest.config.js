import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: false,
		include: ['tests/*.js'],
		exclude: ['**/fixtures/**', '**/util/**', '**/node_modules/**', '**/temp/**'],
		testTimeout: 20000,
		reporters: 'dot',
		maxThreads: process.env.CI ? 1 : undefined,
		minThreads: process.env.CI ? 1 : undefined
	},
	coverage: 'v8',
	esbuild: {
		target: 'node18'
	}
});
