// Validates the x.y.z version format required for Obsidian plugin releases.
const version = process.argv[2] ?? '';

if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
	console.error(`Invalid Obsidian plugin version: ${version}; expected x.y.z.`);
	process.exit(1);
}
