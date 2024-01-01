import { Bench } from 'tinybench';
import * as tsconfck2 from 'tsconfck-2';
import * as tsconfck3 from 'tsconfck';
import { hrtimeNow } from 'tinybench';
import { execSync } from 'node:child_process';

import { getTsconfig } from 'get-tsconfig';
import glob from 'tiny-glob/sync.js';
import { transform } from 'esbuild';

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
// version of typescript source to download. must be an existing release version
// downloaded and extracted with curl + tar -xzf
const TS_VERSION = '5.2.2';

const args = process.argv.slice(2);
const forceInit = args.includes('--init');
const updateDocs = args.includes('--write');
const benchDir = fileURLToPath(new URL('../.bench', import.meta.url));
const srcDir = `${benchDir}/src`;

async function prepare() {
	if (forceInit && fs.existsSync(benchDir)) {
		fs.rmSync(benchDir, { recursive: true });
	}
	if (!fs.existsSync(benchDir)) {
		console.log(`preparing  ${srcDir}: download and extract typescript ${TS_VERSION} src`);
		fs.mkdirSync(benchDir);
		execSync(
			`curl https://github.com/microsoft/TypeScript/archive/refs/tags/v${TS_VERSION}.tar.gz -L -o ${benchDir}/ts.tgz`
		);
		try {
			execSync(
				`tar --transform s/TypeScript-${TS_VERSION}// -xzf ts.tgz TypeScript-${TS_VERSION}/src`,
				{ cwd: benchDir }
			);
		} catch (e) {
			if (!fs.existsSync(srcDir)) {
				throw e; // on windows git-bash tar might still error even after successfully extracting it
			}
		}

		if (!fs.existsSync(srcDir)) {
			throw new Error(
				`failed to extract ${benchDir}/ts.tgz TypeScript-${TS_VERSION}/src to ${srcDir}`
			);
		}
		if (fs.existsSync(`${benchDir}/ts.tgz`)) {
			fs.rmSync(`${benchDir}/ts.tgz`);
		}
		if (fs.existsSync(`${srcDir}/loc`)) {
			fs.rmSync(`${srcDir}/loc`, { recursive: true }); // localization data
		}
		console.log('preparation done');
	}
}

function getPackageVersions() {
	const pnpmLS = JSON.parse(execSync('pnpm ls -r --json'));
	const tsconfckData = pnpmLS.find((x) => x.name === 'tsconfck');
	const monoRepoData = pnpmLS.find((x) => x.name === 'tsconfck-monorepo');
	const tsconfck3 = tsconfckData.version;
	const tsconfck2 = monoRepoData.devDependencies['tsconfck-2'].version;
	const getTSConfig = monoRepoData.devDependencies['get-tsconfig'].version;
	return {
		tsconfck2,
		tsconfck3,
		getTSConfig
	};
}

await prepare();
const versions = getPackageVersions();
const allTSFiles = glob(`${srcDir}/**/*.ts`);

async function benchParse({ parseConfig = false, readFiles = false, transformFiles = false }) {
	const results = [];

	async function bench(name, executor) {
		const bench = new Bench({ warmupIterations: 1, iterations: 20, time: 5000, now: hrtimeNow });
		bench.add(name.padEnd(35, ' '), executor);
		await bench.run();
		results.push(bench.table()[0]);
		if (global.gc) {
			global.gc();
			await new Promise((r) => setTimeout(r, 5000));
		}
	}

	async function work(parser, parserOptions) {
		return Promise.all(
			allTSFiles.map((f) =>
				Promise.all([
					(parseConfig ? parser(f, parserOptions) : Promise.resolve({ tsconfig: {} }))
						.then((r) => r.tsconfig)
						.catch((e) => {
							console.log(`parse for ${f} failed`, e);
							return {};
						}),
					readFiles ? fs.promises.readFile(f, 'utf-8') : Promise.resolve('')
				]).then(([config, input]) => {
					if (config) {
						config.compilerOptions = { ...config.compilerOptions }; // make sure it's used
					}
					return transformFiles
						? transform(input, {
								loader: 'ts',
								tsconfigRaw: { compilerOptions: {} }
								// don't use parsed config to ensure baseline and actual do the same amount of work
						  }).catch((e) => {
								console.log(`transform for ${f} failed`, e);
						  })
						: Promise.resolve({ code: '' });
				})
			)
		);
	}

	await bench(`baseline`, async () => {
		// parser not doing anything
		await work(async () => Promise.resolve({ tsconfig: {} }));
	});

	await bench(`get-tsconfig@${versions.getTSConfig}`, async () => {
		const cache = new Map();
		await work(async (f, c) => {
			return { tsconfig: getTsconfig(f, 'tsconfig.json', c).config };
		}, cache);
	});

	await bench(`tsconfck@${versions.tsconfck3} parseNative`, async () => {
		const cache = new tsconfck3.TSConfckCache();
		await work(tsconfck3.parseNative, { cache });
	});

	await bench(`tsconfck@${versions.tsconfck3} parse`, async () => {
		const cache = new tsconfck3.TSConfckCache();
		await work(tsconfck3.parse, { cache });
	});

	await bench(`tsconfck@${versions.tsconfck2} parse with findAll`, async () => {
		const root = '.';
		const tsConfigPaths = new Set([
			...(await tsconfck2.findAll(root, {
				skip: (dir) => dir === 'node_modules' || dir === '.git'
			}))
		]);
		const cache = new Map();
		await work(tsconfck2.parse, { cache, root, tsConfigPaths });
	});

	return results;
}

async function executeBenchParse(name, params) {
	const results = await benchParse(params);
	const avgKey = 'Average Time (ns)';
	const baselineIdx = results.findIndex((r) => r['Task Name'].startsWith('baseline'));
	const baselineResult = results[baselineIdx];
	const baselineAvg = baselineResult[avgKey];
	results.splice(baselineIdx, 1);
	results.sort((a, b) => a[avgKey] - b[avgKey]);
	results.forEach((r) => {
		r['z_' + avgKey] = r[avgKey] - baselineAvg;
	});
	const fastest = results[0][avgKey];
	const z_fastest = results[0]['z_' + avgKey];
	results.forEach((r) => {
		r['Avg(total)'] = (r[avgKey] / 1_000_000).toFixed(2).padStart(6, ' ') + 'ms';
		r['Relative(total)'] = (1 + (r[avgKey] - fastest) / fastest).toFixed(2).padStart(6, ' ');
		r['Avg(*)'] = (r['z_' + avgKey] / 1_000_000).toFixed(2).padStart(6, ' ') + 'ms';
		r['Relative(*)'] = (1 + (r['z_' + avgKey] - z_fastest) / z_fastest).toFixed(2).padStart(6, ' ');
		r['Margin'] = r['Margin'].padStart(7, ' ');
		delete r[avgKey];
		delete r['z_' + avgKey];
		delete r['ops/sec'];
		delete r['Samples'];
	});
	console.log(name);
	console.table(results);

	const baselineTable = [baselineResult];
	baselineTable.forEach((r) => {
		r['Avg total'] = (r[avgKey] / 1_000_000).toFixed(2).padStart(6, ' ') + 'ms';
		r['Margin'] = r['Margin'].padStart(7, ' ');
		delete r[avgKey];
		delete r['z_' + avgKey];
		delete r['ops/sec'];
		delete r['Samples'];
	});
	console.table(baselineTable);
	return { results, baselineTable };
}

const noLoad = await executeBenchParse('no load', {
	parseConfig: true,
	readFiles: false,
	transformFiles: false
});
const ioLoad = await executeBenchParse('io load', {
	parseConfig: true,
	readFiles: true,
	transformFiles: false
});
const ioCpuLoad = await executeBenchParse('io and cpu load', {
	parseConfig: true,
	readFiles: true,
	transformFiles: true
});

const adjustMessage = `(*) total values include time spent reading and transforming files. For a more realistic comparison of these config parse performance, these values have been calculated by subtracting the average duration of the baseline run that does not parse config files.`;
console.log(adjustMessage);

function renderMDTable(data) {
	const keys = Object.keys(data[0]);
	const tr = (row) => `| ${row.join(' | ')} |\n`;
	const header = tr(keys);
	const sep = tr(keys.map((k) => '-'.repeat(k.length)))
		.split(' | ')
		.join(':| ')
		.replace(':| ', ' | ')
		.replace(' |\n', ':|\n');
	return header + sep + data.map((d) => tr(Object.values(d))).join('');
}

if (updateDocs) {
	const docFile = fileURLToPath(new URL('../docs/benchmark.md', import.meta.url));
	let docContent = fs.readFileSync(docFile, 'utf-8');
	let mdContent = '';
	for (const [name, data] of Object.entries({
		'no load': noLoad,
		'io load': ioLoad,
		'io and cpu load': ioCpuLoad
	})) {
		mdContent += `\n### ${name}\n\n`;
		mdContent += renderMDTable(data.results);
		mdContent += '\n';
		mdContent += renderMDTable(data.baselineTable);
	}

	mdContent += '\n> ' + adjustMessage + '\n\n';
	docContent = docContent.replace(
		/<!-- data -->[\s\S]*<!-- data end -->/gm,
		`<!-- data -->\n${mdContent}\n<!-- data end -->`
	);
	fs.writeFileSync(docFile, docContent);
}
