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

# Install

```shell
npm install --save-dev tsconfck # or pnpm, yarn
```

# Usage

## without typescript installed

```js
import { parse } from 'tsconfck';
const {
	filename, // full path to found tsconfig
	tsconfig, // tsconfig object including merged values from extended configs
	extended, // separate unmerged results of all tsconfig files that contributed to tsconfig
	solution, // solution result if tsconfig is part of a solution
	referenced // referenced tsconfig results if tsconfig is a solution
} = await parse('foo/bar.ts');
```

## with typescript

```js
import { parseNative } from 'tsconfck';
const {
	filename, // full path to found tsconfig
	tsconfig, // tsconfig object including merged values from extended configs, normalized
	result, // output of ts.parseJsonConfigFileContent
	solution, // solution result if tsconfig is part of a solution
	referenced // referenced tsconfig results if tsconfig is a solution
} = await parseNative('foo/bar.ts');
```

## API

see [API-DOCS](docs/api.md)

## Advanced

### caching

You can use a map to cache results and avoid reparsing if you process multiple ts files that share few tsconfig files

```js
import { parse } from 'tsconfck';
// 1. create cache instance
const cache = new Map();
// 2. pass cache instance in options
const fooResult = await parse('src/foo.ts', { cache });
// 3. profit (if they share the same tsconfig.json, it is not parsed again)
const barResult = await parse('src/bar.ts', { cache });
```

> You are responsible for clearing the cache if tsconfig files change on disk during its lifetime.
>
> Always clear the whole cache if anything changes as objects in the cache can ref each other

> Returned results are direct cache objects.
>
> If you want to modify them, deep-clone first.

### cli

A simple cli wrapper is included, you can use it like this

#### find

```shell
# prints /path/to/tsconfig.json on stdout
tsconfck find src/index.ts
```

#### parse

```shell
# print content of ParseResult.tsconfig on stdout
tsconfck parse src/index.ts

# print to file
tsconfck parse src/index.ts > output.json
```

#### parse-result

```shell
# print content of ParseResult on stdout
tsconfck parse-result src/index.ts

# print to file
tsconfck parse-result src/index.ts > output.json
```

#### help

```shell
# print usage
tsconfck -h # or --help, -?, help
```

# Links

- [changelog](CHANGELOG.md)

# Develop

This repo uses

- [pnpm](https://pnpm.io)
- [conventional-changelog/commitlint](https://github.com/conventional-changelog/commitlint#what-is-commitlint)

In addition to default commit-msg prefixes you can use 'wip: ' for commit messages in branches.
PRs are going to be squash-merged

```shell
# install dependencies
pnpm install
# run tests
pnpm test
#run tests in watch mode (doesn't require dev in parallel)
pnpm test:watch
```
