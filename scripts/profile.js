// simpler version of bench.js that can be used with node profilers and cpupro
import { parse, parseNative, TSConfckCache } from 'tsconfck';
import { execSync } from 'node:child_process';
import glob from 'tiny-glob/sync.js';
import { transform } from 'esbuild';

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
// version of typescript source to download. must be an existing release version
// downloaded and extracted with curl + tar -xzf
const TS_VERSION = '5.2.2';

const args = process.argv.slice(2);
const forceInit = args.includes('--init');
const ioLoad = args.includes('--io-load');
const cpuLoad = args.includes('--cpu-load');
const useNative = args.includes('--use-native');
const noCache = args.includes('--no-cache');

const profileDir = fileURLToPath(new URL('../.bench', import.meta.url));
const srcDir = `${profileDir}/src`;

async function prepare() {
	if (forceInit && fs.existsSync(profileDir)) {
		fs.rmSync(profileDir, { recursive: true });
	}
	if (!fs.existsSync(profileDir)) {
		console.log(`preparing  ${srcDir}: download and extract typescript ${TS_VERSION} src`);
		fs.mkdirSync(profileDir);
		execSync(
			`curl https://github.com/microsoft/TypeScript/archive/refs/tags/v${TS_VERSION}.tar.gz -L -o ${profileDir}/ts.tgz`
		);
		try {
			execSync(
				`tar --transform s/TypeScript-${TS_VERSION}// -xzf ts.tgz TypeScript-${TS_VERSION}/src`,
				{ cwd: profileDir }
			);
		} catch (e) {
			if (!fs.existsSync(srcDir)) {
				throw e; // on windows git-bash tar might still error even after successfully extracting it
			}
		}

		if (!fs.existsSync(srcDir)) {
			throw new Error(
				`failed to extract ${profileDir}/ts.tgz TypeScript-${TS_VERSION}/src to ${srcDir}`
			);
		}
		if (fs.existsSync(`${profileDir}/ts.tgz`)) {
			fs.rmSync(`${profileDir}/ts.tgz`);
		}
		if (fs.existsSync(`${srcDir}/loc`)) {
			fs.rmSync(`${srcDir}/loc`, { recursive: true }); // localization data
		}
		console.log('preparation done');
		throw new Error('restart process so that init does not skew results');
	}
}

await prepare();
const allTSFiles = glob(`${srcDir}/**/*.ts`);
for (let i = 0; i < 10; i++) {
	const cache = new TSConfckCache();
	await Promise.all(
		allTSFiles.map((f) =>
			Promise.all([
				(useNative ? parseNative : parse)(f, noCache ? {} : { cache })
					.then((r) => r.tsconfig)
					.catch((e) => {
						console.log(`parse for ${f} failed`, e);
						return {};
					}),
				ioLoad || cpuLoad ? fs.promises.readFile(f, 'utf-8') : Promise.resolve('')
			]).then(([config, input]) => {
				if (config) {
					config.compilerOptions = { ...config.compilerOptions }; // make sure it's used
				}
				return cpuLoad
					? transform(input, {
							loader: 'ts',
							tsconfigRaw: { compilerOptions: {} }
						}).catch((e) => {
							console.log(`transform for ${f} failed`, e);
						})
					: Promise.resolve({ code: '' });
			})
		)
	);
}

console.log('done');
