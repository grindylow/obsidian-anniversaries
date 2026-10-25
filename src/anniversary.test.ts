// Tests parsing and validation of anniversary frontmatter values.
import { describe, expect, it } from 'vitest';
import { parseAnniversaryFrontmatter } from './anniversary';

describe('parseAnniversaryFrontmatter', () => {
	it.each([
		'xxxx-02-28',
		'????-02-28',
		'0000-02-29',
		'2024-02-29',
		'1815-12-10'
	])('parses %s', (value) => {
		expect(parseAnniversaryFrontmatter(value, 'People/Ada Lovelace.md', 'Ada Lovelace')).toMatchObject({
			category: 'birthday',
			name: 'Ada Lovelace',
			date: value,
			file: 'People/Ada Lovelace.md'
		});
	});

	it.each([
		'2023-02-29',
		'2001-13-01',
		'2001-04-31',
		'2001-2-03',
		'2001-02-03 extra',
		'',
		null,
		['1815-12-10']
	])('rejects invalid frontmatter value: %s', (value) => {
		expect(parseAnniversaryFrontmatter(value, 'People/Ada Lovelace.md', 'Ada Lovelace')).toBeNull();
	});
});
