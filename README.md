# Obsidian Anniversary Tracker

This lightweight plugin finds anniversary entries in your Obsidian vault and displays them in a list.

## Features

- Add one or multiple anniversaries to any page using Markdown list items.
- Specify the type of anniversary (birth, death, wedding, work, etc.) and an optional name.
- Use an unknown year (`????`, `0000`, or `xxxx`) when it is not known.
- View all found anniversaries, sorted by month and day.

## Instructions

Add anniversary entries to the **body** of a Markdown page:

```markdown
- [anniversary] 1815-12-10
- [anniversary] death: Ada Lovelace :: 1852-11-27
- [anniversary] wedding: Parents :: 2001-06-15
- [anniversary] xxxx-02-16
```

The first entry uses the page title as its name and defaults to the `birthday` category. For other entries, the category and name before `::` are optional; when the name is omitted, the page title is used. Dates must use the `YYYY-MM-DD` format, except that the year may be `????`, `0000`, or `xxxx`.

To display the list, click the **Check anniversaries** ribbon icon or open the Command Palette (**Ctrl+P** on Windows/Linux, **Cmd+P** on macOS) and run **Check anniversaries**. The plugin currently lists all anniversaries in the vault; it does not calculate upcoming or recently passed occurrences. Anniversary definitions in YAML frontmatter and embedded `anniversaries` code blocks are not currently supported.

## Why is this plugin needed?

- Plugins such as TASKS require full date specifications (including year). Also, although you can define "recurring" tasks, tasks for future occurrences are only generated once the current occurrence has been checked off.
- Plugins such as the DATA plugin are much more heavyweight and require an unreasonable amount of coding for achieving a simple anniversary reminder list.

## Notable limitations

- Gregorian calendar only.
