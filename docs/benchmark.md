# benchmark

## about

tsconfck is fully async to ensure best performance in high pressure situations like vite dev-server startup where many files are read and cpu heavy work is going on in parallel.

This [benchmark](../scripts/bench.js) transpiles [microsoft/TypeScript](https://github.com/microsoft/TypeScript) /src with [esbuild.transform](https://esbuild.github.io/api/#transform) after asyncrounusly reading the files and parsing the config in one huge Promise.all.
Each task is run in sequence (1 warmup 20 samples) followed by gc and a 5 second wait to ensure they don't interact with each others timings.

Due to the highly async nature of the tasks, it is hard to measure the exact timings for config parsing alone.
To better approxmimate the impact, a baseline task is used that executes everything but parsing the config and the resulting time is substracted from the other tasks times.

The `Relative` columns show how much time the task took relative to the fastest one.

Note: get-tsconfig is included because it also has a cache but is synchronous. In a different benchmark setting with less pressure and more synchronous work, the results would likely look different.

To run it yourself, clone this repo and run `pnpm i && pnpm bench`. Note you need `curl` and `tar` installed and it'll download a ~29MB tgz file on first run.

## modes

- `no load` runs only config parse
- `io load` runs config parse and file read (with fs.promises)
- `io and cpu load` runs config parse, file read and esbuild.transform

## data

<!-- data -->

### no load

| Task Name                           | Margin | Avg(total) | Relative(total) |  Avg(\*) | Relative(\*) |
| ----------------------------------- | -----: | ---------: | --------------: | -------: | -----------: |
| tsconfck@3.0.0-next.9 parse         | ±0.55% |     4.48ms |            1.00 |   4.12ms |         1.00 |
| get-tsconfig@4.7.2                  | ±1.04% |    28.78ms |            6.43 |  28.42ms |         6.90 |
| tsconfck@3.0.0-next.9 parseNative   | ±8.63% |   136.17ms |           30.40 | 135.81ms |        32.98 |
| tsconfck@2.1.2 parse with findAll   | ±2.84% |   415.02ms |           92.65 | 414.66ms |       100.70 |
| tsconfck@2.1.2 parse                | ±2.61% |   432.65ms |           96.59 | 432.29ms |       104.98 |
| tsconfck@3.0.0-next.9 without cache | ±2.62% |   657.76ms |          146.84 | 657.40ms |       159.65 |

| Task Name | Margin | Avg total |
| --------- | -----: | --------: |
| baseline  | ±0.63% |    0.36ms |

### io load

| Task Name                           | Margin | Avg(total) | Relative(total) |  Avg(\*) | Relative(\*) |
| ----------------------------------- | -----: | ---------: | --------------: | -------: | -----------: |
| tsconfck@3.0.0-next.9 parse         | ±2.91% |    36.83ms |            1.00 |   6.83ms |         1.00 |
| get-tsconfig@4.7.2                  | ±2.96% |    66.57ms |            1.81 |  36.57ms |         5.35 |
| tsconfck@3.0.0-next.9 parseNative   | ±2.50% |   166.67ms |            4.52 | 136.67ms |        20.00 |
| tsconfck@2.1.2 parse with findAll   | ±2.67% |   454.37ms |           12.34 | 424.37ms |        62.11 |
| tsconfck@2.1.2 parse                | ±3.32% |   466.26ms |           12.66 | 436.26ms |        63.85 |
| tsconfck@3.0.0-next.9 without cache | ±2.51% |   699.39ms |           18.99 | 669.39ms |        97.97 |

| Task Name | Margin | Avg total |
| --------- | -----: | --------: |
| baseline  | ±2.75% |   30.00ms |

### io and cpu load

| Task Name                           | Margin | Avg(total) | Relative(total) |  Avg(\*) | Relative(\*) |
| ----------------------------------- | -----: | ---------: | --------------: | -------: | -----------: |
| tsconfck@3.0.0-next.9 parse         | ±1.36% |   273.98ms |            1.00 |   4.60ms |         1.00 |
| get-tsconfig@4.7.2                  | ±0.98% |   302.51ms |            1.10 |  33.13ms |         7.21 |
| tsconfck@3.0.0-next.9 parseNative   | ±1.65% |   408.75ms |            1.49 | 139.37ms |        30.32 |
| tsconfck@2.1.2 parse with findAll   | ±1.69% |   705.30ms |            2.57 | 435.91ms |        94.85 |
| tsconfck@2.1.2 parse                | ±1.80% |   714.11ms |            2.61 | 444.72ms |        96.76 |
| tsconfck@3.0.0-next.9 without cache | ±1.50% |   922.85ms |            3.37 | 653.46ms |       142.18 |

| Task Name | Margin | Avg total |
| --------- | -----: | --------: |
| baseline  | ±2.53% |  269.39ms |

> (\*) total values include time spent reading and transforming files. For a more realistic comparison of these config parse performance, these values have been calculated by subtracting the average duration of the baseline run that does not parse config files.

<!-- data end -->

> This data has been recorded on Linux 6.1, node20, 8c/16t ryzen cpu, pcie-3 nvme SSD. (duration ~4.5 min)

## Observations

### tsconfck@3 is a lot faster than tsconfck@2

This is great news and most likely attributed to the rework of the cache and using callbacks instead of adding more promises to the mix.
The impact on vite however remains to be seen as it isn't clear if it had much of a negative influence before

### tsconfck@3 is within margin of baseline under load

One could say it's background noise. Not completely true but for sure it doesn't get in the way.

### parseNative with caching is surprisingly competitive

TypeScripts own parse does a lot extra work with all files matched by the configs and it is synchronous too.
But with caching ensuring work is only ever done once, it's almost ok.
