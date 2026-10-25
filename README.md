# Obsidian Anniversary Tracker

This lightweight plugin finds anniversary entries in your Obsidian vault and displays them in a list.

## Features

- Add an anniversary to a page using its YAML frontmatter.
- Use an unknown year (`????`, `0000`, or `xxxx`) when it is not known.
- View all found anniversaries, sorted by month and day.

## Instructions

Add an `anniversary` property to the YAML frontmatter of a Markdown page. The value must be a quoted date in `YYYY-MM-DD` format; the year may instead be `????`, `0000`, or `xxxx`.

```yaml
---
anniversary: "1815-12-10"
---
```

The page title is used as the anniversary name and the category defaults to `birthday`. For now, only the exact `anniversary` property is supported; properties such as `anniversary-death` are ignored. Anniversary entries in the body of a page are not supported.

To display the list, open the Command Palette (**Ctrl+P** on Windows/Linux, **Cmd+P** on macOS) and run **Check anniversaries**. The plugin currently lists all anniversaries in the vault; it does not calculate upcoming or recently passed occurrences.

## Why is this plugin needed?

- Plugins such as TASKS require full date specifications (including year). Also, although you can define "recurring" tasks, tasks for future occurrences are only generated once the current occurrence has been checked off.
- Plugins such as the DATA plugin are much more heavyweight and require an unreasonable amount of coding for achieving a simple anniversary reminder list.

## Notable limitations

- Gregorian calendar only.
