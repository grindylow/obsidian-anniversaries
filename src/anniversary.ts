// Parses and validates anniversary dates stored in page frontmatter.
export interface Anniversary {
	category: string;
	name: string;
	date: string;
	month: number;
	day: number;
	file: string;
}

const dateValue = /^(\d{4}|\?{4}|x{4})-(\d{2})-(\d{2})$/i;

export function parseAnniversaryFrontmatter(value: unknown, file: string, pageTitle: string): Anniversary | null {
	if (typeof value !== 'string') return null;

	const date = value.trim();
	const dateMatch = date.match(dateValue);
	if (!dateMatch) return null;

	const yearPart = dateMatch[1];
	const monthPart = dateMatch[2];
	const dayPart = dateMatch[3];
	if (!yearPart || !monthPart || !dayPart) return null;

	const month = Number(monthPart);
	const day = Number(dayPart);
	const validationYear = yearPart === '0000' || !/^\d{4}$/.test(yearPart) ? 2000 : Number(yearPart);
	const parsedDate = new Date(Date.UTC(validationYear, month - 1, day));
	if (parsedDate.getUTCFullYear() !== validationYear || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day) return null;

	return { category: 'birthday', name: pageTitle, date, month, day, file };
}
