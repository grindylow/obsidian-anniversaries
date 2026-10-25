// Tests parsing and validation of anniversary frontmatter values.
import { describe, expect, it } from 'vitest';
import { filterAnniversaries, formatAnniversary, formatTodayEntry, isAnniversaryKey, parseAnniversaryFrontmatter, parseCodeBlockOptions } from './anniversary';

describe('parseCodeBlockOptions', () => {
	it('parses supported options, filters, comments, and today overrides', () => {
		const options = parseCodeBlockOptions(`# only recent entries
nowarnings
notoday
today 2000-10-25
happens after 2 weeks ago
# upper bound
happens before tomorrow`, new Date(2026, 9, 25));
		expect(options).toMatchObject({ hideWarnings: true, hideToday: true, todayOverridden: true, warnings: [] });
		expect(options.today).toEqual(new Date(2000, 9, 25));
		expect(options.filters).toHaveLength(2);
	});

	it('warns on unknown options and malformed happens filters', () => {
		expect(parseCodeBlockOptions(`nowranings
happens after someday`).warnings).toEqual([
			'Unknown option: nowranings',
			'Invalid happens filter: happens after someday'
		]);
	});

	it('warns when a today override is malformed or repeated', () => {
		expect(parseCodeBlockOptions(`today someday`).warnings).toContain('Invalid today override: today someday');
		expect(parseCodeBlockOptions(`today 2000-10-25
today 2001-10-25`).warnings).toEqual(['Only one today override may be specified.']);
	});
});

describe('parseAnniversaryFrontmatter', () => {
	it('accepts valid anniversary years below 0100 and absolute filter dates', () => {
		const dateSource = 'happens on 0001-01-01';
		const entry = parseAnniversaryFrontmatter('anniversary', '0001-01-01', 'Early.md', 'Early');
		expect(entry).not.toBeNull();
		expect(filterAnniversaries([entry!], parseCodeBlockOptions(dateSource, new Date(2026, 0, 1)))).toHaveLength(1);
	});
});

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
	const filter = (source: string, referenceDate = today) => filterAnniversaries(items, parseCodeBlockOptions(source, referenceDate));

	it('keeps all entries when no date filters are specified', () => {
		expect(filter('nowarnings')).toEqual(items);
	});

	it('filters upcoming anniversaries with Tasks-style exclusive bounds', () => {
		expect(filter(`happens after yesterday
happens before in two weeks`).map((item) => item.name)).toEqual(['Today', 'Tomorrow', 'Two Weeks']);
	});

	it('filters anniversaries from two weeks ago through today', () => {
		expect(filter(`happens after 2 weeks ago
happens before tomorrow`).map((item) => item.name)).toEqual(['Recent', 'Today']);
	});

	it('supports single dates and ignores invalid filter expressions', () => {
		expect(filter('happens on today').map((item) => item.name)).toEqual(['Today']);
		expect(filter('happens after someday')).toEqual(items);
	});

	it('ignores comment lines when filtering anniversaries', () => {
		expect(filter(`# include only today
happens on today`).map((item) => item.name)).toEqual(['Today']);
	});

	it('evaluates relative filters from the overridden date', () => {
		const override = 'today 2026-11-01';
		expect(filter(`${override}
happens on today`).map((item) => item.name)).toEqual([]);
		expect(filter(`${override}
happens on or after in 5 days
happens before in 7 days`).map((item) => item.name)).toEqual(['Two Weeks']);
		expect(formatAnniversary(items[2]!, parseCodeBlockOptions(override, today).today)).toContain('(26 years ago)');
	});

	it('matches dates in a requested range across year boundaries', () => {
		const winterItems = [
			{ category: 'birthday', name: 'New Year', date: '2000-01-01', month: 1, day: 1, file: 'New Year.md' },
			{ category: 'birthday', name: 'Christmas', date: '2000-12-20', month: 12, day: 20, file: 'Christmas.md' }
		];
		expect(filterAnniversaries(winterItems, parseCodeBlockOptions(`happens after 2 weeks ago
happens before tomorrow`, new Date(2026, 0, 3))).map((item) => item.name)).toEqual(['New Year']);
	});
});

describe('formatTodayEntry', () => {
	it('includes the current local date and indicates when it is overridden', () => {
		expect(formatTodayEntry(new Date(2026, 9, 25))).toBe('2026-10-25 today');
		expect(formatTodayEntry(new Date(2026, 9, 25), true)).toBe('2026-10-25 today (overridden)');
	});
});

describe('formatAnniversary', () => {
	it('adds the number of years since a known-year anniversary', () => {
		expect(formatAnniversary({
			category: '', name: 'Ada Lovelace', date: '1815-12-10', month: 12, day: 10, file: 'Ada.md'
		}, new Date(2026, 9, 25))).toBe('1815-12-10 Ada Lovelace (211 years ago)');
	});

	it('does not add years ago for unknown years', () => {
		expect(formatAnniversary({
			category: '', name: 'Ada Lovelace', date: 'xxxx-12-10', month: 12, day: 10, file: 'Ada.md'
		}, new Date(2026, 9, 25))).toBe('xxxx-12-10 Ada Lovelace');
		expect(formatAnniversary({
			category: '', name: 'Ada Lovelace', date: 'yyyy-12-10', month: 12, day: 10, file: 'Ada.md'
		}, new Date(2026, 9, 25))).toBe('yyyy-12-10 Ada Lovelace');
	});
});

describe('parseCodeBlockOptions warning visibility', () => {
	it('hides unparsable-entry warnings but leaves syntax warnings visible', () => {
		const options = parseCodeBlockOptions('nowarnings\nnowranings');
		expect(options.hideWarnings).toBe(true);
		expect(options.warnings).toEqual(['Unknown option: nowranings']);
	});

	it('detects notoday even when it appears in a comment, preserving existing behavior', () => {
		expect(parseCodeBlockOptions('# notoday').hideToday).toBe(true);
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
		['anniversary', 'xxxx-02-28', '', 'xxxx-02-28'],
		['anniversary', 'yyyy-02-28', '', 'yyyy-02-28'],
		['anniversary', '????-02-28', '', '????-02-28'],
		['anniversary', '0000-02-29', '', '0000-02-29'],
		['anniversary', '2024-02-29', '', '2024-02-29'],
		['anniversary', '1815-12-10', '', '1815-12-10'],
		['anniversary', '1815-2-3', '', '1815-02-03'],
		['anniversary', '1815-02-3', '', '1815-02-03'],
		['anniversary', '1815-2-03', '', '1815-02-03'],
		['anniversary-birthday', '1815-12-10', 'birthday', '1815-12-10'],
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
