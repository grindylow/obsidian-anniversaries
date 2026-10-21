export interface Anniversary {
	category: string;
	name: string;
	date: string;
	month: number;
	day: number;
	file: string;
}

const anniversaryLine = /^\s*(?:[-*+]|\d+\.)\s+\[anniversary\]\s+(?:(.*?)\s+::\s*)?(\S+)\s*$/i;
const categoryPrefix = /^([a-z][a-z0-9-]*):(?:\s+(.*))?$/i;
const dateValue = /^(\d{4}|\?{4}|x{4})-(\d{2})-(\d{2})$/i;

export function parseAnniversaryLine(line: string, file: string, pageTitle: string): Anniversary | null {
	const match = line.match(anniversaryLine);
	if (!match) return null;

	const details = match[1]?.trim() ?? '';
	const rawDate = match[2];
	if (!rawDate) return null;

	const categoryMatch = details.match(categoryPrefix);
	const category = categoryMatch?.[1]?.toLowerCase() ?? 'birthday';
	const name = (categoryMatch ? categoryMatch[2]?.trim() : details) || pageTitle;
	const dateMatch = rawDate.match(dateValue);
	if (!dateMatch || !name) return null;

	const yearPart = dateMatch[1];
	const monthPart = dateMatch[2];
	const dayPart = dateMatch[3];
	if (!yearPart || !monthPart || !dayPart) return null;

	const month = Number(monthPart);
	const day = Number(dayPart);
	const validationYear = yearPart === '0000' || !/^\d{4}$/.test(yearPart) ? 2000 : Number(yearPart);
	const parsedDate = new Date(Date.UTC(validationYear, month - 1, day));
	if (parsedDate.getUTCFullYear() !== validationYear || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day) return null;

	return { category, name, date: rawDate, month, day, file };
}
