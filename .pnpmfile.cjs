const { esbuild } = require('./package.json').devDependencies;

function readPackage(pkg) {
	for (const section of [
		'dependencies',
		'devDependencies',
		'peerDependencies',
		'optionalDependencies'
	]) {
		// enforce use of workspace esbuild
		// to ensure a single version is used
		if (pkg[section]['esbuild']) {
			pkg[section]['esbuild'] = esbuild;
		}
	}
	return pkg;
}

module.exports = {
	hooks: {
		readPackage
	}
};
