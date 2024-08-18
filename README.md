# tsconfck

[![npm version](https://img.shields.io/npm/v/tsconfck)](https://www.npmjs.com/package/tsconfck)
[![CI](https://github.com/dominikg/tsconfck/actions/workflows/test.yml/badge.svg)](https://github.com/dominikg/tsconfck/actions/workflows/test.yml)

A utility to find and parse tsconfig files without depending on typescript

# Why

Because no simple official api exists and tsconfig isn't actual json.

# Features

- [x] find closest tsconfig (tsconfig.json or jsconfig.json)
- [x] convert tsconfig to actual json and parse it
- [x] resolve "extends"
- [x] resolve "references" of solution-style tsconfig
- [x] resolve ["${configDir}" variable](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#the-configdir-template-variable-for-configuration-files)
- [x] optional caching for improved performance
- [x] optional findNative and parseNative to use official typescript api
- [x] zero dependencies (typescript optional)
- [x] extensive testsuite
- [x] completely async and optimized (it's [fast](https://github.com/dominikg/tsconfck/blob/main/docs/benchmark.md))
- [x] tiny [4.7KB gzip](https://pkg-size.dev/tsconfck@%5E3.0.0-next.0)
- [x] unbundled esm js, no sourcemaps needed
- [x] [types](./packages/tsconfck/types/index.d.ts) generated with [dts-buddy](https://github.com/Rich-Harris/dts-buddy)

# Users

Used by [vite](https://github.com/vitejs/vite)\*, [vite-tsconfig-paths](https://github.com/aleclarson/vite-tsconfig-paths), [astro](https://github.com/withastro/astro) and [many more](https://github.com/dominikg/tsconfck/network/dependents)

> (\*) vite bundles tsconfck so it is listed as a devDependency

# Install

```shell
npm install --save-dev tsconfck # or pnpm, yarn
```

# Usage

```js
import { parse } from 'tsconfck';
const {
	tsconfigFile, // full path to found tsconfig
	tsconfig, // tsconfig object including merged values from extended configs
	extended, // separate unmerged results of all tsconfig files that contributed to tsconfig
	solution, // solution result if tsconfig is part of a solution
	referenced // referenced tsconfig results if tsconfig is a solution
} = await parse('foo/bar.ts');
```

# Links

[package readme](./packages/tsconfck/README.md)
[api](./docs/api.md)
[changelog](./packages/tsconfck/CHANGELOG.md)

# Develop

This repo uses

- [pnpm](https://pnpm.io)
- [changesets](https://github.com/changesets/changesets)

In every PR you have to add a changeset by running `pnpm changeset` and following the prompts

PRs are going to be squash-merged

```shell
# install dependencies
pnpm install
# run tests
pnpm test
```

# License

[MIT](./packages/tsconfck/LICENSE)
