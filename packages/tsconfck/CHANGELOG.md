# tsconfck

## 3.0.0

### Major Changes

- breaking(node): minimum supported node version is node18 ([#107](https://github.com/dominikg/tsconfck/pull/107))

- breaking(exports): remove cjs export ([#107](https://github.com/dominikg/tsconfck/pull/107))

- breaking(exports): remove package.json export ([#107](https://github.com/dominikg/tsconfck/pull/107))

- breaking(peerDependencies): minimum supported typescript version for parseNative and findNative is 5.0 ([#107](https://github.com/dominikg/tsconfck/pull/107))

- breaking(parse): include js extensions with allowJs: true ([#132](https://github.com/dominikg/tsconfck/pull/132))

- breaking(parse): resolve with empty result for missing tsconfig file, remove option resolveWithEmptyIfConfigNotFound ([#115](https://github.com/dominikg/tsconfck/pull/115))

- breaking(cache): Replace simple Map cache with a dedicated TSConfckCache ([#132](https://github.com/dominikg/tsconfck/pull/132))

- breaking(find): remove tsconfigPaths option, use cache + ignoreNodeModules instead. ([#112](https://github.com/dominikg/tsconfck/pull/112))

- breaking(find): add ignoreNodeModules option as a replacement for using tsconfigPaths to ignore node_modules ([#128](https://github.com/dominikg/tsconfck/pull/128))

- breaking(errors): throw ENOENT from parse if input .json filename does not exist. throw custom error if exists but is no file ([#121](https://github.com/dominikg/tsconfck/pull/121))

### Minor Changes

- feat(exports): export unbundled esm js ([#107](https://github.com/dominikg/tsconfck/pull/107))

- feat(exports): export types as module declaration, including a .d.ts.map ([#107](https://github.com/dominikg/tsconfck/pull/107))

- perf(find): switch to fs.stat callback for async improve cache usage ([#115](https://github.com/dominikg/tsconfck/pull/115))

- feat(find): add configName option to support jsconfig.json ([#132](https://github.com/dominikg/tsconfck/pull/132))

- feat(findNative): add find options (cache, root) ([#112](https://github.com/dominikg/tsconfck/pull/112))

### Patch Changes

- fix(parseNative): return empty result for not found to align with parse ([#121](https://github.com/dominikg/tsconfck/pull/121))

- fix(types): use import condition for types to avoid masquerading as cjs ([#130](https://github.com/dominikg/tsconfck/pull/130))


## 3.0.0-next.9

### Major Changes

- breaking: include js extensions with allowJs: true ([#132](https://github.com/dominikg/tsconfck/pull/132))

- breaking: enable caching paths for multiple configNames in one TSConfckCache, changed cache.getTSConfigPath(dir) to cache.getConfigPath(dir,configName) ([#132](https://github.com/dominikg/tsconfck/pull/132))

### Minor Changes

- feat: add configName option to support jsconfig.json ([#132](https://github.com/dominikg/tsconfck/pull/132))

### Patch Changes

- fix(types): use import condition for types to avoid masquerading as cjs ([#130](https://github.com/dominikg/tsconfck/pull/130))

## 3.0.0-next.8

### Major Changes

- breaking(find): replace scanNodeModules with ignoreNodeModules ([#128](https://github.com/dominikg/tsconfck/pull/128))

### Patch Changes

- fix(errors): cache errors instead of evicting cache value on error ([#125](https://github.com/dominikg/tsconfck/pull/125))

## 3.0.0-next.7

### Major Changes

- breaking(find): ignore tsconfig files inside node_modules ([#123](https://github.com/dominikg/tsconfck/pull/123))

## 3.0.0-next.6

### Major Changes

- breaking(errors): throw ENOENT from parse if input .json filename does not exist. throw custom error if exists but is no file ([#121](https://github.com/dominikg/tsconfck/pull/121))

### Patch Changes

- fix(parseNative): return empty result for not found to align with parse ([#121](https://github.com/dominikg/tsconfck/pull/121))

## 3.0.0-next.5

### Patch Changes

- fix(find): only call then on promise in cache" ([#117](https://github.com/dominikg/tsconfck/pull/117))

## 3.0.0-next.4

### Major Changes

- breaking(parse): resolve with empty result for missing tsconfig file, remove option resolveWithEmptyIfConfigNotFound ([#115](https://github.com/dominikg/tsconfck/pull/115))

- breaking(types): remove Awaitable type and add result type generic to cache ([#115](https://github.com/dominikg/tsconfck/pull/115))

### Minor Changes

- perf(find): switch to fs.stat callback for async and increase cache usage ([#115](https://github.com/dominikg/tsconfck/pull/115))

## 3.0.0-next.3

### Major Changes

- breaking(cache): remove tsconfigPaths option from find, add cache option that lazily caches found tsconfig paths. ([#112](https://github.com/dominikg/tsconfck/pull/112))

### Minor Changes

- feat(findNative): add find options (cache, root) ([#112](https://github.com/dominikg/tsconfck/pull/112))

## 3.0.0-next.2

### Patch Changes

- fix(types): use [] for optional parameter jsdoc to ensure dts-buddy emits them as optional ([#110](https://github.com/dominikg/tsconfck/pull/110))

## 3.0.0-next.1

### Major Changes

- breaking(exports): remove package.json export ([#107](https://github.com/dominikg/tsconfck/pull/107))

- breaking(find): rename option tsConfigPaths to tsconfigPaths to ensure consistent use of tsconfig spelling ([#109](https://github.com/dominikg/tsconfck/pull/109))

- breaking(node): minimum supported node version is node18 ([#107](https://github.com/dominikg/tsconfck/pull/107))

- breaking(peerDependencies): minimum supported typescript version for parseNative and findNative is 5.0 ([#107](https://github.com/dominikg/tsconfck/pull/107))

- breaking(exports): remove cjs export ([#107](https://github.com/dominikg/tsconfck/pull/107))

### Minor Changes

- feat(exports): export unbundled esm js ([#107](https://github.com/dominikg/tsconfck/pull/107))

- feat(exports): export types as module declaration, including a .d.ts.map ([#107](https://github.com/dominikg/tsconfck/pull/107))

## 2.1.2

### Patch Changes

- fix(find-all): ignore inaccessible directory error on windows ([#96](https://github.com/dominikg/tsconfck/issues/96))

---

see [changelog archive](./CHANGELOG_archive.md) for older versions
