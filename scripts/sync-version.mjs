// Generates release package metadata from the semantic version tag on the current commit.
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDirectory = resolve(root, process.argv[2] ?? 'dist');
const run = (command, args) => execFileSync(command, args, { cwd: root, encoding: 'utf8' }).trim();
const tags = run('git', ['tag', '--points-at', 'HEAD'])
	.split('\n')
	.filter((tag) => /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag));

if (tags.length !== 1) {
	throw new Error('Release version must come from exactly one semantic version tag on HEAD (for example, v0.3.0).');
}
if (run('git', ['status', '--porcelain'])) {
	throw new Error('Release package generation requires a clean working tree at the tagged commit.');
}

const version = tags[0].replace(/^v/, '');
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const packageLock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.template.json'), 'utf8'));

packageJson.version = version;
packageLock.version = version;
packageLock.packages[''].version = version;
manifest.version = version;

await mkdir(outputDirectory, { recursive: true });
for (const [file, data] of [['package.json', packageJson], ['package-lock.json', packageLock], ['manifest.json', manifest]]) {
	await writeFile(resolve(outputDirectory, file), `${JSON.stringify(data, null, '\t')}\n`);
}
await copyFile(resolve(root, 'main.js'), resolve(outputDirectory, 'main.js'));
console.log(`Generated release package for ${version} in ${outputDirectory}.`);
