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

## without typescript installed

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

## with typescript

```js
import { parseNative } from 'tsconfck';
const {
	tsconfigFile, // full path to found tsconfig
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

### reduce fs.stat overhead

You can specify a root directory and provide a set of known tsconfig locations to improve performance in large projects

```js
import { parse, findAll } from 'tsconfck';
const root = '.';
const tsConfigPaths = new Set([
	...(await findAll(root, { skip: (dir) => dir === 'node_modules' || dir === '.git' }))
]);
const cache = new Map();
const parseOptions = { cache, root, tsConfigPaths };
// these calls use minimal fs
const fooResult = await parse('src/foo.ts', parseOptions);
const barResult = await parse('src/bar.ts', parseOptions);
```

> Using the root option can lead to errors if there is no tsconfig inside root.

> You are responsible for updating tsConfigPaths if tsconfig files are added/removed on disk during its lifetime.

### error handling

find and parse reject for all errors they encounter.

For parse, you can choose to resolve with an empty result instead if no tsconfig file was found

```js
import { parse } from 'tsconfck';
const result = await parse('some/path/without/tsconfig/foo.ts', {
	resolveWithEmptyIfConfigNotFound: true
});
// result = { tsconfigFile: 'no_tsconfig_file_found',tsconfig: {} }
```

### TSConfig type (optional, requires typescript as devDependency)

```ts
import type { TSConfig } from 'pkg-types';
```

Check out https://github.com/unjs/pkg-types

### cli

A simple cli wrapper is included, you can use it like this

#### find

```shell
# prints /path/to/tsconfig.json on stdout
tsconfck find src/index.ts
```

#### find-all

```shell
# prints all tsconfig.json in dir on stdout
tsconfck find-all src/
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

# License

[MIT](./LICENSE)
