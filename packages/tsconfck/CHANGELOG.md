# tsconfck

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
