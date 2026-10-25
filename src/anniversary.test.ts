// Tests parsing and validation of anniversary frontmatter values.
import { describe, expect, it } from 'vitest';
import { formatAnniversary, formatTodayEntry, hasNowarningsOption, isAnniversaryKey, parseAnniversaryFrontmatter } from './anniversary';

describe('formatTodayEntry', () => {
	it('includes the current local date', () => {
		expect(formatTodayEntry(new Date(2026, 9, 25))).toBe('2026-10-25 today');
	});
});

describe('formatAnniversary', () => {
	it('adds the number of years since a known-year anniversary', () => {
		expect(formatAnniversary({
			category: 'birthday', name: 'Ada Lovelace', date: '1815-12-10', month: 12, day: 10, file: 'Ada.md'
		}, new Date(2026, 9, 25))).toBe('1815-12-10 Ada Lovelace (birthday) (211 years ago)');
	});

	it('does not add years ago for unknown years', () => {
		expect(formatAnniversary({
			category: 'birthday', name: 'Ada Lovelace', date: 'xxxx-12-10', month: 12, day: 10, file: 'Ada.md'
		}, new Date(2026, 9, 25))).toBe('xxxx-12-10 Ada Lovelace (birthday)');
	});
});

describe('hasNowarningsOption', () => {
	it.each(['nowarnings', 'nowarnings sort=date', 'NOWARNINGS'])('recognizes %s', (source) => {
		expect(hasNowarningsOption(source)).toBe(true);
	});

	it.each(['', 'warnings', 'no-warnings'])('does not recognize %s', (source) => {
		expect(hasNowarningsOption(source)).toBe(false);
	});
});

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
		['anniversary', 'xxxx-02-28', 'birthday', 'xxxx-02-28'],
		['anniversary', '????-02-28', 'birthday', '????-02-28'],
		['anniversary', '0000-02-29', 'birthday', '0000-02-29'],
		['anniversary', '2024-02-29', 'birthday', '2024-02-29'],
		['anniversary', '1815-12-10', 'birthday', '1815-12-10'],
		['anniversary', '1815-2-3', 'birthday', '1815-02-03'],
		['anniversary', '1815-02-3', 'birthday', '1815-02-03'],
		['anniversary', '1815-2-03', 'birthday', '1815-02-03'],
		['anniversary-death', '1852-11-27', 'death', '1852-11-27'],
		['ANNIVERSARY-WEDDING', '2001-06-15', 'wedding', '2001-06-15'],
		['anniversary---', '2020-12-12', '--', '2020-12-12'],
		['anniversary-c', '0000-10-12 (Wedding)', 'Wedding', '0000-10-12'],
		['anniversary-c', '0000-10-12 Wedding', 'Wedding', '0000-10-12'],
		['anniversary-c', '0000-10-12 · Wedding anniversary', '· Wedding anniversary', '0000-10-12'],
		['anniversary', '2001-06-15 (Work)', 'Work', '2001-06-15']
	])('parses %s: %s', (key, value, category, expectedDate) => {
		expect(parseAnniversaryFrontmatter(key, value, 'People/Ada Lovelace.md', 'Ada Lovelace')).toMatchObject({
			category,
			name: 'Ada Lovelace',
			date: expectedDate ?? value.match(/^(\d{4}|\?{4}|x{4})-\d{1,2}-\d{1,2}/i)?.[0],
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
