# tsconfck

[![npm version](https://img.shields.io/npm/v/tsconfck)](https://www.npmjs.com/package/tsconfck)
[![CI](https://github.com/dominikg/tsconfck/actions/workflows/test.yml/badge.svg)](https://github.com/dominikg/tsconfck/actions/workflows/test.yml)

A utility to find and parse tsconfig files without depending on typescript

# Why

Because no simple official api exists and tsconfig.json isn't actual json.

# Features

- [x] find closest tsconfig.json
- [x] convert tsconfig.json to actual json and parse it
- [x] resolve "extends"
- [x] resolve "references" of solution-style tsconfig
- [x] optional findNative and parseNative to use official typescript api
- [x] zero dependencies (typescript optional)
- [x] extensive testsuite

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

PRs are going to be squash-merged

```shell
# install dependencies
pnpm install

# run tests
pnpm test

#run tests in watch mode
pnpm test:watch
```

# License

[MIT](./packages/tsconfck/LICENSE)
