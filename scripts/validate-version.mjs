// Validates the x.y.z version format used by Obsidian plugin releases.
const version = process.argv[2] ?? process.env.npm_config_new_version ?? '';

if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
	console.error(`Invalid Obsidian plugin version: ${version}; expected x.y.z.`);
	process.exit(1);
}
