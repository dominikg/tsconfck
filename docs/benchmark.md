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

| Task Name                         | Margin | Avg(total) | Relative(total) |  Avg(\*) | Relative(\*) |
| --------------------------------- | -----: | ---------: | --------------: | -------: | -----------: |
| tsconfck@3.0.1 parse              | ±0.75% |     3.90ms |            1.00 |   3.56ms |         1.00 |
| tsconfck@3.0.1 parseNative        | ±8.31% |    24.32ms |            6.24 |  23.99ms |         6.73 |
| get-tsconfig@4.7.2                | ±1.37% |    25.00ms |            6.41 |  24.66ms |         6.92 |
| tsconfck@2.1.2 parse with findAll | ±1.71% |   367.03ms |           94.10 | 366.70ms |       102.92 |

| Task Name | Margin | Avg total |
| --------- | -----: | --------: |
| baseline  | ±0.51% |    0.34ms |

### io load

| Task Name                         | Margin | Avg(total) | Relative(total) |  Avg(\*) | Relative(\*) |
| --------------------------------- | -----: | ---------: | --------------: | -------: | -----------: |
| tsconfck@3.0.1 parse              | ±2.57% |    33.46ms |            1.00 |   9.28ms |         1.00 |
| tsconfck@3.0.1 parseNative        | ±2.63% |    52.67ms |            1.57 |  28.48ms |         3.07 |
| get-tsconfig@4.7.2                | ±2.54% |    57.69ms |            1.72 |  33.51ms |         3.61 |
| tsconfck@2.1.2 parse with findAll | ±1.62% |   399.88ms |           11.95 | 375.70ms |        40.48 |

| Task Name | Margin | Avg total |
| --------- | -----: | --------: |
| baseline  | ±1.99% |   24.18ms |

### io and cpu load

| Task Name                         | Margin | Avg(total) | Relative(total) |  Avg(\*) | Relative(\*) |
| --------------------------------- | -----: | ---------: | --------------: | -------: | -----------: |
| tsconfck@3.0.1 parse              | ±1.38% |   273.87ms |            1.00 |   6.37ms |         1.00 |
| get-tsconfig@4.7.2                | ±3.57% |   307.58ms |            1.12 |  40.08ms |         6.29 |
| tsconfck@3.0.1 parseNative        | ±4.12% |   308.89ms |            1.13 |  41.39ms |         6.50 |
| tsconfck@2.1.2 parse with findAll | ±1.24% |   656.31ms |            2.40 | 388.81ms |        61.03 |

| Task Name | Margin | Avg total |
| --------- | -----: | --------: |
| baseline  | ±2.23% |  267.50ms |

> (\*) total values include time spent reading and transforming files. For a more realistic comparison of these config parse performance, these values have been calculated by subtracting the average duration of the baseline run that does not parse config files.

<!-- data end -->

> This data has been recorded on Linux 6.1, node20, 8c/16t ryzen cpu, pcie-3 nvme SSD. (duration ~4.5 min)

## Observations

### tsconfck@3 is a lot faster than tsconfck@2

This is great news and most likely attributed to the rework of the cache and using callbacks instead of adding more promises to the mix.
The impact on vite however remains to be seen as it isn't clear if it had much of a negative influence before

### tsconfck@3 is hardly outside of margin of baseline under load

It's mostly background noise. Not completely true but for sure it doesn't get in the way.

### parseNative with caching is surprisingly competitive

TypeScripts own parse does a lot extra work with all files matched by the configs and it is synchronous too.
But with caching ensuring work is only ever done once, it's almost ok.
