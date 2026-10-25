# Obsidian Anniversary Tracker

This lightweight plugin finds anniversary entries in your Obsidian vault and displays them in a list.

## Features

- Add one or more anniversaries to a page using its YAML frontmatter.
- Use an unknown year (`????`, `0000`, or `xxxx`) when it is not known.
- View all found anniversaries, sorted by month and day.

## Instructions

Add an `anniversary` property to the YAML frontmatter of a Markdown page. The value must be a quoted date in `YYYY-M-D` format (month and day may each use one or two digits); the year may instead be `????`, `0000`, or `xxxx`. Add further entries using `anniversary-<category>` keys, where `<category>` is a lowercase category name made of letters, numbers, or hyphens.

```yaml
---
anniversary: "1815-12-10"
anniversary-death: "1852-11-27"
anniversary-wedding: "1835-07-08"
---
```

The page title is used as the anniversary name. The exact `anniversary` property defaults to the `birthday` category; the suffix of an `anniversary-<category>` key supplies the category. Any text after a valid date is treated as a category label and overrides the key suffix. If the trailing text is enclosed in parentheses, the parentheses are removed (for example, `"0000-10-12 (Wedding)"` displays the category as `Wedding`). Anniversary entries in the body of a page are not supported.

To display the list, open the Command Palette (**Ctrl+P** on Windows/Linux, **Cmd+P** on macOS) and run **Check anniversaries**. The plugin currently lists all anniversaries in the vault; it does not calculate upcoming or recently passed occurrences.

## Why is this plugin needed?

- Plugins such as TASKS require full date specifications (including year). Also, although you can define "recurring" tasks, tasks for future occurrences are only generated once the current occurrence has been checked off.
- Plugins such as the DATA plugin are much more heavyweight and require an unreasonable amount of coding for achieving a simple anniversary reminder list.

## Notable limitations

- Gregorian calendar only.
