// Bundles the Obsidian plugin into an ignored dist/ directory for local and release builds.
import esbuild from 'esbuild';
import process from 'process';
import { builtinModules } from 'node:module';
import { mkdirSync } from 'node:fs';

const production = process.argv[2] === 'production';
mkdirSync('dist', { recursive: true });

const context = await esbuild.context({
	entryPoints: ['src/main.ts'],
	bundle: true,
	external: [
		'obsidian',
		'electron',
		'@codemirror/autocomplete',
		'@codemirror/collab',
		'@codemirror/commands',
		'@codemirror/language',
		'@codemirror/lint',
		'@codemirror/search',
		'@codemirror/state',
		'@codemirror/view',
		'@lezer/common',
		'@lezer/highlight',
		'@lezer/lr',
		...builtinModules
	],
	format: 'cjs',
	target: 'es2021',
	logLevel: 'info',
	sourcemap: production ? false : 'inline',
	treeShaking: true,
	outfile: 'dist/main.js',
	minify: production
});

if (production) {
	await context.rebuild();
	await context.dispose();
} else {
	await context.watch();
}
