// Packages release artifacts after verifying the Git tag matches the root Obsidian manifest.
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDirectory = resolve(root, process.argv[2] ?? 'dist/release');
const run = (command, args) => execFileSync(command, args, { cwd: root, encoding: 'utf8' }).trim();
const tags = run('git', ['tag', '--points-at', 'HEAD']).split('\n').filter(Boolean);

if (tags.length !== 1) {
	throw new Error('Release build requires exactly one tag on HEAD.');
}
const version = tags[0];
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
if (version !== manifest.version) {
	throw new Error(`Git tag ${version} does not match manifest version ${manifest.version}.`);
}
run('node', ['scripts/validate-version.mjs', version]);
if (run('git', ['status', '--porcelain'])) {
	throw new Error('Release package generation requires a clean working tree at the tagged commit.');
}

const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const packageLock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
packageJson.version = version;
packageLock.version = version;
packageLock.packages[''].version = version;

await mkdir(outputDirectory, { recursive: true });
for (const [file, data] of [['package.json', packageJson], ['package-lock.json', packageLock]]) {
	await writeFile(resolve(outputDirectory, file), `${JSON.stringify(data, null, '\t')}\n`);
}
await Promise.all([
	copyFile(resolve(root, 'dist/main.js'), resolve(outputDirectory, 'main.js')),
	copyFile(resolve(root, 'manifest.json'), resolve(outputDirectory, 'manifest.json'))
]);
console.log(`Generated release package for ${version} in ${outputDirectory}.`);
