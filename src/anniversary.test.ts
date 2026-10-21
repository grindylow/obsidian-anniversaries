import { describe, expect, it } from 'vitest';
import { parseAnniversaryLine } from './anniversary';

describe('parseAnniversaryLine', () => {
	it.each([
		['- [anniversary] xxxx-02-28', 'birthday', 'Ada Lovelace'],
		['* [anniversary] 1815-12-10', 'birthday', 'Ada Lovelace'],
		['+ [anniversary] ????-02-28', 'birthday', 'Ada Lovelace'],
		['1. [anniversary] 0000-02-29', 'birthday', 'Ada Lovelace'],
		['- [anniversary] 2024-02-29', 'birthday', 'Ada Lovelace'],
		['- [anniversary] Birthday :: 1990-04-12', 'birthday', 'Birthday'],
		['- [anniversary] death: :: 1852-11-27', 'death', 'Ada Lovelace'],
		['- [anniversary] death: Ada Lovelace :: 1852-11-27', 'death', 'Ada Lovelace'],
		['- [anniversary] wedding: :: 2001-06-15', 'wedding', 'Ada Lovelace'],
		['- [anniversary] wedding: Parents :: 2001-06-15', 'wedding', 'Parents'],
		['- [anniversary] adoption: Family :: 2010-03-02', 'adoption', 'Family'],
		['- [ANNIVERSARY] wedding: Parents :: 2001-06-15', 'wedding', 'Parents']
	])('parses %s', (line, category, name) => {
		const anniversary = parseAnniversaryLine(line, 'People/Ada Lovelace.md', 'Ada Lovelace');

		expect(anniversary).toMatchObject({ category, name, file: 'People/Ada Lovelace.md' });
	});

	it.each([
		'- [anniversary] 2023-02-29',
		'- [anniversary] 2001-13-01',
		'- [anniversary] 2001-04-31',
		'- [anniversary] 2001-2-03',
		'- [anniversary] 2001-02-03 extra'
	])('rejects invalid or incomplete line: %s', (line) => {
		expect(parseAnniversaryLine(line, 'People/Ada Lovelace.md', 'Ada Lovelace')).toBeNull();
	});

	it('preserves the supplied date and extracts month/day', () => {
		expect(parseAnniversaryLine('- [anniversary] ????-02-28', 'Ada Lovelace.md', 'Ada Lovelace')).toMatchObject({
			date: '????-02-28',
			month: 2,
			day: 28
		});
	});
});
