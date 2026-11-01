// Packages release artifacts after verifying the Git tag matches the root Obsidian manifest.
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const outputDirectory = resolve(root, process.argv[2] ?? 'dist/release');
const outputRelativePath = relative(root, outputDirectory);
if (outputRelativePath.startsWith('..') || isAbsolute(outputRelativePath)) {
	throw new Error('Release output directory must be inside the project directory.');
}
const run = (command, args) => execFileSync(command, args, { cwd: root, encoding: 'utf8' }).trim();
const tags = run('git', ['tag', '--points-at', 'HEAD']).split('\n').filter(Boolean);

if (tags.length !== 1) {
	throw new Error('Release build requires exactly one tag on HEAD.');
}
run('node', ['scripts/validate-version.mjs', tags[0]]);
const version = tags[0];
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
if (version !== manifest.version) {
	throw new Error(`Git tag ${version} does not match manifest version ${manifest.version}.`);
}
run('node', ['scripts/validate-version.mjs', version]);
if (run('git', ['status', '--porcelain'])) {
	throw new Error('Release package generation requires a clean working tree at the tagged commit.');
}

// Recreate the package directory so stale build artifacts cannot leak into a release.
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await Promise.all([
	copyFile(resolve(root, 'dist/main.js'), resolve(outputDirectory, 'main.js')),
	copyFile(resolve(root, 'manifest.json'), resolve(outputDirectory, 'manifest.json'))
]);
