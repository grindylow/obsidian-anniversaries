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

export function parseAnniversaryFrontmatter(key: string, value: unknown, file: string, pageTitle: string): Anniversary | null {
	const keyMatch = key.match(/^anniversary(?:-([a-z0-9-]+))?$/i);
	if (!keyMatch || typeof value !== 'string') return null;

	const rawValue = value.trim();
	const dateMatch = rawValue.match(dateValue);
	if (!dateMatch) return null;
	if (dateMatch[0].length < rawValue.length && !/\s/.test(rawValue[dateMatch[0].length] ?? '')) return null;

	const date = dateMatch[0];
	let trailingText = rawValue.slice(date.length).trim();
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
