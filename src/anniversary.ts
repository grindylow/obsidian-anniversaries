// Parses, validates, filters, and formats anniversary frontmatter entries.
export interface Anniversary {
	category: string;
	name: string;
	date: string;
	month: number;
	day: number;
	file: string;
}

export interface UnparsableAnniversary {
	key: string;
	value: unknown;
	file: string;
}

interface DateFilter {
	operator: 'after' | 'before' | 'on' | 'on or after' | 'on or before';
	date: Date;
}

const dateValue = /^(\d{4}|\?{4}|x{4}|y{4})-(\d{1,2})-(\d{1,2})/i;

export function isAnniversaryKey(key: string): boolean {
	return /^anniversary(?:-|$)/i.test(key);
}

export function hasNowarningsOption(source: string): boolean {
	return source.split(/\s+/).some((option) => option.toLowerCase() === 'nowarnings');
}

export function hasNotodayOption(source: string): boolean {
	return source.split(/\s+/).some((option) => option.toLowerCase() === 'notoday');
}

function getAnniversaryYear(anniversary: Anniversary): number | null {
	const yearMatch = anniversary.date.match(/^(\d{4}|\?{4}|x{4}|y{4})-/i);
	if (!yearMatch?.[1] || !/^\d{4}$/.test(yearMatch[1]) || yearMatch[1] === '0000') return null;
	return Number(yearMatch[1]);
}

export function formatAnniversary(anniversary: Anniversary, today = new Date()): string {
	const date = `${anniversary.date} ${anniversary.name} (${anniversary.category})`;
	const year = getAnniversaryYear(anniversary);
	if (year === null) return date;

	const yearsAgo = today.getFullYear() - year;
	if (yearsAgo < 0) return date;
	return `${date} (${yearsAgo} ${yearsAgo === 1 ? 'year' : 'years'} ago)`;
}

export function formatTodayEntry(today = new Date(), overridden = false): string {
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const day = String(today.getDate()).padStart(2, '0');
	return `${year}-${month}-${day} today${overridden ? ' (overridden)' : ''}`;
}

function parseIsoDate(value: string): Date | null {
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match?.[1] || !match[2] || !match[3]) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(0);
	date.setUTCFullYear(year, month - 1, day);
	date.setUTCHours(0, 0, 0, 0);
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
	return date;
}

export function getTodayOverride(source: string, fallback = new Date()): Date {
	const lines = source.split(/\r?\n/).filter((entry) => /^today\b/i.test(entry.trim()));
	if (lines.length !== 1) return fallback;
	const value = lines[0]?.trim().replace(/^today\s+/i, '');
	if (!value) return fallback;
	const parsed = parseIsoDate(value);
	if (!parsed) return fallback;
	const localDate = new Date(0);
	localDate.setFullYear(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
	localDate.setHours(0, 0, 0, 0);
	return localDate;
}

function parseQueryDate(value: string, today: Date): Date | null {
	const normalizedToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
	const relativeMatch = value.toLowerCase().match(/^(?:(in)\s+)?(\d+|one|two)\s+(day|days|week|weeks)(?:\s+ago)?$/);
	if (relativeMatch) {
		const amountText = relativeMatch[2];
		const amount = (amountText === 'one' ? 1 : amountText === 'two' ? 2 : Number(amountText)) * (/^week/.test(relativeMatch[3] ?? '') ? 7 : 1);
		if (!Number.isFinite(amount)) return null;
		const ago = /\s+ago$/i.test(value);
		const future = Boolean(relativeMatch[1]);
		if (ago && future) return null;
		normalizedToday.setUTCDate(normalizedToday.getUTCDate() + (ago ? -amount : amount));
		return normalizedToday;
	}

	const keyword = value.toLowerCase();
	if (keyword === 'today') return normalizedToday;
	if (keyword === 'yesterday' || keyword === 'tomorrow') {
		normalizedToday.setUTCDate(normalizedToday.getUTCDate() + (keyword === 'yesterday' ? -1 : 1));
		return normalizedToday;
	}
	const absoluteMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
	if (absoluteMatch?.[1] && absoluteMatch[2] && absoluteMatch[3]) {
		const date = new Date(Date.UTC(Number(absoluteMatch[1]), Number(absoluteMatch[2]) - 1, Number(absoluteMatch[3])));
		if (date.getUTCFullYear() === Number(absoluteMatch[1]) && date.getUTCMonth() === Number(absoluteMatch[2]) - 1 && date.getUTCDate() === Number(absoluteMatch[3])) return date;
	}
	return null;
}

function parseDateFilter(line: string, today: Date): DateFilter | null {
	const match = line.trim().match(/^happens\s+(on or after|on or before|after|before|on)\s+(.+)$/i);
	if (!match?.[1] || !match[2]) return null;
	const date = parseQueryDate(match[2].trim(), today);
	return date ? { operator: match[1].toLowerCase() as DateFilter['operator'], date } : null;
}

function parseDateFilters(source: string, today: Date): DateFilter[] {
	return source.split(/\r?\n/).flatMap((line) => {
		const filter = parseDateFilter(line, today);
		return filter ? [filter] : [];
	});
}

export function getCodeBlockWarnings(source: string, today = new Date()): string[] {
	const warnings: string[] = [];
	const todayLines = source.split(/\r?\n/).filter((line) => /^today\b/i.test(line.trim()));
	if (todayLines.length > 1) warnings.push('Only one today override may be specified.');
	for (const rawLine of source.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const option = line.toLowerCase();
		if (option === 'nowarnings' || option === 'notoday') continue;
		if (/^today\b/i.test(line)) {
			if (!/^today\s+\d{4}-\d{2}-\d{2}$/i.test(line) || !parseIsoDate(line.replace(/^today\s+/i, ''))) {
				warnings.push(`Invalid today override: ${line}`);
			}
			continue;
		}
		if (/^happens\b/i.test(line)) {
			if (!parseDateFilter(line, today)) warnings.push(`Invalid happens filter: ${line}`);
			continue;
		}
		warnings.push(`Unknown option: ${line}`);
	}
	return warnings;
}

function matchesDateFilters(date: Date, filters: DateFilter[]): boolean {
	const timestamp = date.getTime();
	return filters.every(({ operator, date: filterDate }) => {
		const boundary = filterDate.getTime();
		switch (operator) {
			case 'after': return timestamp > boundary;
			case 'before': return timestamp < boundary;
			case 'on': return timestamp === boundary;
			case 'on or after': return timestamp >= boundary;
			case 'on or before': return timestamp <= boundary;
		}
	});
}

function dateOfAnniversaryInRange(anniversary: Anniversary, filters: DateFilter[], today: Date): Date | null {
	const anniversaryYear = getAnniversaryYear(anniversary);
	const filterYears = filters.map((filter) => filter.date.getUTCFullYear());
	const firstYear = Math.max(anniversaryYear ?? 1, filterYears.length ? Math.min(...filterYears) - 1 : today.getFullYear() - 1);
	const lastYear = filterYears.length ? Math.max(...filterYears) + 1 : today.getFullYear() + 1;

	for (let year = firstYear; year <= lastYear; year++) {
		const occurrence = new Date(Date.UTC(year, anniversary.month - 1, anniversary.day));
		if (occurrence.getUTCMonth() !== anniversary.month - 1 || occurrence.getUTCDate() !== anniversary.day) continue;
		if (anniversaryYear !== null && year < anniversaryYear) continue;
		if (matchesDateFilters(occurrence, filters)) return occurrence;
	}
	return null;
}

export function filterAnniversaries(anniversaries: Anniversary[], source: string, today = new Date()): Anniversary[] {
	const referenceDate = getTodayOverride(source, today);
	const filters = parseDateFilters(source, referenceDate);
	if (filters.length === 0) return anniversaries;
	return anniversaries.filter((anniversary) => dateOfAnniversaryInRange(anniversary, filters, today) !== null);
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
