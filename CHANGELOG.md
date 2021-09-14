# [1.0.0-9](https://github.com/dominikg/tsconfck/compare/tsconfck@1.0.0-8...tsconfck@1.0.0-9) (2021-09-14)


### Features

* rename filename to tsconfigFile to avoid confusion with filename argument ([#8](https://github.com/dominikg/tsconfck/issues/8)) ([9752114](https://github.com/dominikg/tsconfck/commit/9752114deb8439968a80d86f2f0d35ca8c4478fd))


### BREAKING CHANGES

* rename `filename` of TSConfckParseResult and TSConfckParseNativeResult to `tsconfigFile`



# [1.0.0-8](https://github.com/dominikg/tsconfck/compare/tsconfck@1.0.0-7...tsconfck@1.0.0-8) (2021-09-12)


### Features

* add option 'ignoreSourceFiles' for parseNative ([#7](https://github.com/dominikg/tsconfck/issues/7)) ([33d966c](https://github.com/dominikg/tsconfck/commit/33d966c478bd778494d42a5b5e69c9861a15301e))



# [1.0.0-7](https://github.com/dominikg/tsconfck/compare/tsconfck@1.0.0-6...tsconfck@1.0.0-7) (2021-09-09)


### Features

* add parse option resolveWithEmptyIfConfigNotFound ([8b02ca8](https://github.com/dominikg/tsconfck/commit/8b02ca8d6e9e26b1391935d10262890d6da4e1cd))


### BREAKING CHANGES

* prefix types with TSConfck to avoid confusion



# [1.0.0-6](https://github.com/dominikg/tsconfck/compare/tsconfck@1.0.0-5...tsconfck@1.0.0-6) (2021-09-08)


### Bug Fixes

* extend compilerOptions when it is only set in extended tsconfig ([e51959a](https://github.com/dominikg/tsconfck/commit/e51959a1bc026a4e439f6dca8c740b7e6b71dcc9))
* remove engines restriction for yarn and npm ([2079ccc](https://github.com/dominikg/tsconfck/commit/2079ccc5a2e895dd19819c82a818ba7167878f2a))



# [1.0.0-5](https://github.com/dominikg/tsconfck/compare/tsconfck@1.0.0-4...tsconfck@1.0.0-5) (2021-09-07)


### Features

* add option to cache ParseResult ([#6](https://github.com/dominikg/tsconfck/issues/6)) ([ecef987](https://github.com/dominikg/tsconfck/commit/ecef987b3f2196fd896aeb9f193a981490902660))



# [1.0.0-4](https://github.com/dominikg/tsconfck/compare/tsconfck@1.0.0-3...tsconfck@1.0.0-4) (2021-09-07)


### Bug Fixes

* improve test coverage and error handling; fixed issues with baseUrl, paths and extends ([#5](https://github.com/dominikg/tsconfck/issues/5)) ([55a0d39](https://github.com/dominikg/tsconfck/commit/55a0d391f17680bcdeb78da9acefef8517514cb8))


### Features

* support for solution-style tsconfig ([#3](https://github.com/dominikg/tsconfck/issues/3)) ([0d54b84](https://github.com/dominikg/tsconfck/commit/0d54b84c7e2754c4ce6344b737e7630964897190))



# [1.0.0-3](https://github.com/dominikg/tsconfck/compare/tsconfck@1.0.0-2...tsconfck@1.0.0-3) (2021-08-28)


### Features

* cli ([5fa828f](https://github.com/dominikg/tsconfck/commit/5fa828f7994e2feb04589c2728189b183aac26ed))



# [1.0.0-2](https://github.com/dominikg/tsconfck/compare/tsconfck@1.0.0-1...tsconfck@1.0.0-2) (2021-08-28)


### Bug Fixes

* inline strip-bom and strip-json-comments to get cjs build working ([f64d4c7](https://github.com/dominikg/tsconfck/commit/f64d4c7cdbcb619b46bc9a70bf8ab4f671959f76))
* prevent dynamic import to require transform in build ([4dfa25c](https://github.com/dominikg/tsconfck/commit/4dfa25c4abf6ba80535f48255a6bfe88b10a775b))



# 1.0.0-1 (2021-08-26)


### Bug Fixes

* return empty object when tsconfig.json is empty ([5a4abaf](https://github.com/dominikg/tsconfck/commit/5a4abaf1d690786b3c7e3946f4e66637b36fa9f0))



# 1.0.0-0 (2021-08-26)



### Bug Fixes

* add tsconfig to ParseNativeResult with merged compilerOptions. Include a simple testcase ([0b7efdb](https://github.com/dominikg/tsconfck/commit/0b7efdbcd1d2f1003d8f529e4777767ae1c692c6))
* convert found filename to native path separator in parseNative ([21ebd8e](https://github.com/dominikg/tsconfck/commit/21ebd8eb22f5dfb8751cef4b7e1df5138b296009))
* convert found filename to native path separator in parseNative ([671eca8](https://github.com/dominikg/tsconfck/commit/671eca8b4cbb4f2f6f5f91dad79d38bbe3201c3b))
* convert output of ts parser to be parsable again, improve error handling, more tests ([e9b28a2](https://github.com/dominikg/tsconfck/commit/e9b28a2bbc27db7ae48cf44b6d7d0f9e7e2f27bc))
* convert windows path separators correctly for native ts functions ([504158b](https://github.com/dominikg/tsconfck/commit/504158ba8efbe00758b0d07b022894352b2ff4bd))
* don't call posix2native in findNative ([8d2b125](https://github.com/dominikg/tsconfck/commit/8d2b125eb5b2ebf9c9cc8dbc203d0d7c77cda296))
* don't use find if parse is called with a tsconfig.json; refactor tests for isomorphic result ([ff34eb5](https://github.com/dominikg/tsconfck/commit/ff34eb5697a84b4a52b01774cf39accb0544b92b))
* use native find function in parseNative ([041dd8e](https://github.com/dominikg/tsconfck/commit/041dd8eabf2d99188628ab046a8b28c13fd31453))
* use node12 compatible rmdir ([a464db0](https://github.com/dominikg/tsconfck/commit/a464db0d95481fde6bf685e29a6757fefb597f21))
* use node12 compatible way to import fs/promises ([433092d](https://github.com/dominikg/tsconfck/commit/433092d019a57d495f6711be4e8852bedf6ab742))


### Features

* advanced parse with extends ([bf0db8e](https://github.com/dominikg/tsconfck/commit/bf0db8e80ef15b7bcd80c9ad584eda80fdce2a01))
* implement findTSConfig ([6d57501](https://github.com/dominikg/tsconfck/commit/6d575015b43d6408b7e04427a33b1dbec183781e))
* implement native parse with optional peer dependency on typescript ([5ade70b](https://github.com/dominikg/tsconfck/commit/5ade70bdbafddb0666496537cf135d7fadd7a6d8))
* implement simple parse ([2715b45](https://github.com/dominikg/tsconfck/commit/2715b45e64331a9390f29041d39e5dc23deee129))
* implement toJson ([96d3bfc](https://github.com/dominikg/tsconfck/commit/96d3bfc90c837a970e6ab08d3896ffe1978aaa34))
* separate findNative function ([4000586](https://github.com/dominikg/tsconfck/commit/40005863e9c68db3284c62bca6dd5155ec439cf6))





