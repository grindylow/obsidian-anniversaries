// Tests parsing and validation of anniversary frontmatter values.
import { describe, expect, it } from 'vitest';
import { isAnniversaryKey, parseAnniversaryFrontmatter } from './anniversary';

describe('isAnniversaryKey', () => {
	it.each(['anniversary', 'anniversary-death', 'Anniversary-notes'])('recognizes %s', (key) => {
		expect(isAnniversaryKey(key)).toBe(true);
	});

	it.each(['anniversary_', 'my-anniversary', 'anniversaries', 'notes'])('ignores %s', (key) => {
		expect(isAnniversaryKey(key)).toBe(false);
	});
});

describe('parseAnniversaryFrontmatter', () => {
	it.each([
		['anniversary', 'xxxx-02-28', 'birthday'],
		['anniversary', '????-02-28', 'birthday'],
		['anniversary', '0000-02-29', 'birthday'],
		['anniversary', '2024-02-29', 'birthday'],
		['anniversary', '1815-12-10', 'birthday'],
		['anniversary', '1815-2-3', 'birthday'],
		['anniversary', '1815-02-3', 'birthday'],
		['anniversary', '1815-2-03', 'birthday'],
		['anniversary-death', '1852-11-27', 'death'],
		['ANNIVERSARY-WEDDING', '2001-06-15', 'wedding'],
		['anniversary-c', '0000-10-12 (Wedding)', 'Wedding'],
		['anniversary-c', '0000-10-12 Wedding', 'Wedding'],
		['anniversary-c', '0000-10-12 · Wedding anniversary', '· Wedding anniversary'],
		['anniversary', '2001-06-15 (Work)', 'Work']
	])('parses %s: %s', (key, value, category) => {
		expect(parseAnniversaryFrontmatter(key, value, 'People/Ada Lovelace.md', 'Ada Lovelace')).toMatchObject({
			category,
			name: 'Ada Lovelace',
			date: value.match(/^(\d{4}|\?{4}|x{4})-\d{1,2}-\d{1,2}/i)?.[0],
			file: 'People/Ada Lovelace.md'
		});
	});

	it.each([
		['anniversary', '2023-02-29'],
		['anniversary', '2001-13-01'],
		['anniversary', '2001-04-31'],
		['anniversary', '2001-13-1'],
		['anniversary', 'not-a-date 2001-02-03'],
		['anniversary', '2001-02-03Wedding'],
		['anniversary', ''],
		['anniversary', null],
		['anniversary', ['1815-12-10']],
		['anniversary-notes', 'personal notes'],
		['anniversary_', '1815-12-10'],
		['my-anniversary', '1815-12-10']
	])('rejects invalid frontmatter entry: %s: %s', (key, value) => {
		expect(parseAnniversaryFrontmatter(key, value, 'People/Ada Lovelace.md', 'Ada Lovelace')).toBeNull();
	});
});
