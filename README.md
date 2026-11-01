# Obsidian Anniversary Tracker

This lightweight plugin finds anniversary entries in your Obsidian vault and displays them in a list.

## Features

- Add one or more anniversaries to a page using its YAML frontmatter.
- Use an unknown year (`????`, `0000`, `xxxx`, or `yyyy`) when it is not known.
- View all found anniversaries, sorted by month and day.
- TASKS-like syntax for limiting list of anniversaries to those that will take place in a specified timeframe (for example "happens before in 2 weeks")

## How to use

Add an `anniversary` property to the YAML frontmatter of a Markdown page. The value must be a quoted date in `YYYY-M-D` format (month and day may each use one or two digits); the year may instead be `????`, `0000`, `xxxx`, or `yyyy`. Add further entries using `anniversary-<category>` keys, where `<category>` is a non-empty name made of letters, numbers, or hyphens.

```yaml
---
anniversary: "1815-12-10"
anniversary-death: "1852-11-27"
anniversary-wedding: "1835-07-08"
---
```

The page title is used as the anniversary name. The exact `anniversary` property has no category by default; the suffix of an `anniversary-<category>` key supplies the category. Any text after a valid date is treated as a category label and overrides the key suffix. If the trailing text is enclosed in parentheses, the parentheses are removed (for example, `"0000-10-12 (Wedding)"` displays the category as `Wedding`).

To display the list in a note, add an `anniversaries` code block:

````markdown
```anniversaries
```
````

By default, the list will include a `today` marker with the current date - use the `notoday` option to suppress this entry.

Anniversaries with known year will include an `(X years ago)` suffix.

Any unparsable entries appear as warnings; add `nowarnings` to suppress them.

Date filters use Tasks-style `happens` lines. For anniversaries from today through the next two weeks:

````markdown
```anniversaries
happens after yesterday
happens before in two weeks
```
````

For anniversaries from two weeks ago through today:

````markdown
```anniversaries
happens after 2 weeks ago
happens before tomorrow
```
````

The bounds are exclusive, so `after yesterday` and `before tomorrow` include today; an anniversary exactly on the `2 weeks ago` boundary is excluded. Unknown code-block options and malformed filters are listed as collapsed warnings. `happens` filters may also use `on`, `on or after`, and `on or before` with relative dates (`today`, `tomorrow`, `2 weeks ago`, `in 3 days`) or a date such as `2026-10-25`.

Override the reference date by adding `today YYYY-MM-DD` to the code block. Relative filters, the dated today marker, and `(X years ago)` labels all use this date. The marker is suffixed with `(overridden)` to make the override visible. For example:

````markdown
```anniversaries
today 2000-10-25
happens after yesterday
happens before in two weeks
```
````

## Why is this plugin needed?

- Plugins such as TASKS require full date specifications (including year). Also, although you can define "recurring" tasks, tasks for future occurrences are only generated once the current occurrence has been checked off.
- Plugins such as the DATA plugin are much more heavyweight and require an unreasonable amount of coding for achieving a simple anniversary reminder list.

## Notable limitations

- Gregorian calendar only.
- Anniversary entries in the body of a page are not supported. This is an informed design decision. We do not want to scan the entire vault, and the Obsidian frontmatter is the ideal place for such data.

## Developer information

This section covers building and releasing the plugin; it is intended for contributors, not plugin users.

### Build and test

Run `npm test`, `npm run build`, and `npm run lint` to test, build, and lint the plugin. Linting uses ESLint with Obsidian's recommended rules. Build output is written under the ignored `dist/` directory and excluded from Git. For local Obsidian testing, copy `dist/main.js` and the root `manifest.json` into your test vault's plugin folder.

### Versioning and releases

The root `manifest.json` is the source of truth for the plugin release version. `versions.json` maps each released plugin version to its minimum compatible Obsidian version. Use `npm version patch --no-git-tag-version`, `npm version minor --no-git-tag-version`, or `npm version major --no-git-tag-version` to bump the package version without creating npm's default `v`-prefixed tag. The version hook synchronizes `manifest.json`, adds its `minAppVersion` to `versions.json`, and stages the metadata files. Review and commit the version bump before releasing; the release workflow creates the exact unprefixed tag.

For a local release build, create a clean commit whose manifest version matches a Git tag (for example, `0.6.1`, without a `v` prefix), then run `npm run release:prepare`. This generates a clean `dist/release/` containing only the required Obsidian plugin assets: `main.js` and `manifest.json` (plus optional `styles.css` if the plugin uses one). The installable zip contains those same plugin assets. The script refuses to package if the commit is not clean or the tag and manifest versions differ.

To automate a release, run **Actions → Release → Run workflow** on the branch to release, enter the exact manifest version, and choose whether it should be a draft or prerelease. The workflow verifies the version, runs tests and lint, builds the package, then creates and pushes the tag and publishes a GitHub release with the required plugin assets and installable zip attached. Releases from branches other than `main` must be both draft and prerelease.
