// Parses and validates anniversary dates stored in page frontmatter.
export interface Anniversary {
	category: string;
	name: string;
	date: string;
	month: number;
	day: number;
	file: string;
}

const dateValue = /^(\d{4}|\?{4}|x{4})-(\d{1,2})-(\d{1,2})/i;

export interface UnparsableAnniversary {
	key: string;
	value: unknown;
	file: string;
}

export function isAnniversaryKey(key: string): boolean {
	return /^anniversary(?:-|$)/i.test(key);
}

export function hasNowarningsOption(source: string): boolean {
	return source.split(/\s+/).some((option) => option.toLowerCase() === 'nowarnings');
}

export function formatAnniversary(anniversary: Anniversary, today = new Date()): string {
	const date = `${anniversary.date} ${anniversary.name} (${anniversary.category})`;
	const yearMatch = anniversary.date.match(/^(\d{4})-/);
	if (!yearMatch?.[1]) return date;

	const yearsAgo = today.getFullYear() - Number(yearMatch[1]);
	if (yearsAgo < 0) return date;
	return `${date} (${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} ago)`;
}

export function formatTodayEntry(today = new Date()): string {
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const day = String(today.getDate()).padStart(2, '0');
	return `${year}-${month}-${day} today`;
}

export function parseAnniversaryFrontmatter(key: string, value: unknown, file: string, pageTitle: string): Anniversary | null {
	const keyMatch = key.match(/^anniversary(?:-([a-z0-9-]+))?$/i);
	if (!keyMatch || typeof value !== 'string') return null;

	const rawValue = value.trim();
	const dateMatch = rawValue.match(dateValue);
	if (!dateMatch) return null;
	if (dateMatch[0].length < rawValue.length && !/\s/.test(rawValue[dateMatch[0].length] ?? '')) return null;

	const date = `${dateMatch[1]}-${String(Number(dateMatch[2])).padStart(2, '0')}-${String(Number(dateMatch[3])).padStart(2, '0')}`;
	let trailingText = rawValue.slice(dateMatch[0].length).trim();
	if (trailingText.startsWith('(') && trailingText.endsWith(')')) {
		trailingText = trailingText.slice(1, -1).trim();
	}

	const yearPart = dateMatch[1];
	const monthPart = dateMatch[2];
	const dayPart = dateMatch[3];
	if (!yearPart || !monthPart || !dayPart) return null;

	const month = Number(monthPart);
	const day = Number(dayPart);
	const validationYear = yearPart === '0000' || !/^\d{4}$/.test(yearPart) ? 2000 : Number(yearPart);
	const parsedDate = new Date(Date.UTC(validationYear, month - 1, day));
	if (parsedDate.getUTCFullYear() !== validationYear || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day) return null;

	const category = trailingText || keyMatch[1]?.toLowerCase() || 'birthday';
	return { category, name: pageTitle, date, month, day, file };
}
