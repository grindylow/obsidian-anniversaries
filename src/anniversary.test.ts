// Tests parsing and validation of anniversary frontmatter values.
import { describe, expect, it } from 'vitest';
import { filterAnniversaries, formatAnniversary, formatTodayEntry, hasNowarningsOption, isAnniversaryKey, parseAnniversaryFrontmatter } from './anniversary';

describe('filterAnniversaries', () => {
	const items = [
		{ category: 'birthday', name: 'Earlier', date: '2000-10-09', month: 10, day: 9, file: 'Earlier.md' },
		{ category: 'birthday', name: 'Recent', date: '2000-10-12', month: 10, day: 12, file: 'Recent.md' },
		{ category: 'birthday', name: 'Today', date: '2000-10-25', month: 10, day: 25, file: 'Today.md' },
		{ category: 'wedding', name: 'Tomorrow', date: '2020-10-26', month: 10, day: 26, file: 'Tomorrow.md' },
		{ category: 'birthday', name: 'Two Weeks', date: 'xxxx-11-07', month: 11, day: 7, file: 'Two Weeks.md' },
		{ category: 'birthday', name: 'Later', date: '2000-11-08', month: 11, day: 8, file: 'Later.md' }
	];
	const today = new Date(2026, 9, 25);

	it('keeps all entries when no date filters are specified', () => {
		expect(filterAnniversaries(items, 'nowarnings', today)).toEqual(items);
	});

	it('filters upcoming anniversaries with Tasks-style exclusive bounds', () => {
		expect(filterAnniversaries(items, `happens after yesterday
happens before in two weeks`, today).map((item) => item.name)).toEqual(['Today', 'Tomorrow', 'Two Weeks']);
	});

	it('filters anniversaries from two weeks ago through today', () => {
		expect(filterAnniversaries(items, `happens after 2 weeks ago
happens before tomorrow`, today).map((item) => item.name)).toEqual(['Recent', 'Today']);
	});

	it('supports single dates and rejects invalid filter expressions', () => {
		expect(filterAnniversaries(items, 'happens on today', today).map((item) => item.name)).toEqual(['Today']);
		expect(filterAnniversaries(items, 'happens after someday', today)).toEqual(items);
	});

	it('matches dates in a requested range across year boundaries', () => {
		const winterItems = [
			{ category: 'birthday', name: 'New Year', date: '2000-01-01', month: 1, day: 1, file: 'New Year.md' },
			{ category: 'birthday', name: 'Christmas', date: '2000-12-20', month: 12, day: 20, file: 'Christmas.md' }
		];
		expect(filterAnniversaries(winterItems, `happens after 2 weeks ago
happens before tomorrow`, new Date(2026, 0, 3)).map((item) => item.name)).toEqual(['New Year']);
	});
});

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
