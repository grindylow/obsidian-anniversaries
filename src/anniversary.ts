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

export interface DateFilter {
	operator: 'after' | 'before' | 'on' | 'on or after' | 'on or before';
	date: Date;
}

export interface AnniversaryCodeBlockOptions {
	filters: DateFilter[];
	hideWarnings: boolean;
	hideToday: boolean;
	today: Date;
	todayOverridden: boolean;
	warnings: string[];
}

const dateValue = /^(\d{4}|\?{4}|x{4}|y{4})-(\d{1,2})-(\d{1,2})/i;

export function isAnniversaryKey(key: string): boolean {
	return /^anniversary(?:-|$)/i.test(key);
}

function getAnniversaryYear(anniversary: Anniversary): number | null {
	const yearMatch = anniversary.date.match(/^(\d{4}|\?{4}|x{4}|y{4})-/i);
	if (!yearMatch?.[1] || !/^\d{4}$/.test(yearMatch[1]) || yearMatch[1] === '0000') return null;
	return Number(yearMatch[1]);
}

export function formatAnniversary(anniversary: Anniversary, today = new Date()): string {
	const date = `${anniversary.date} ${anniversary.name}${anniversary.category ? ` (${anniversary.category})` : ''}`;
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

function createUTCDate(year: number, month: number, day: number): Date | null {
	const date = new Date(0);
	date.setUTCFullYear(year, month - 1, day);
	date.setUTCHours(0, 0, 0, 0);
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function parseIsoDate(value: string): Date | null {
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match?.[1] || !match[2] || !match[3]) return null;
	return createUTCDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

function localDate(date: Date): Date {
	const local = new Date(0);
	local.setFullYear(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	local.setHours(0, 0, 0, 0);
	return local;
}

function parseQueryDate(value: string, today: Date): Date | null {
	const normalizedToday = createUTCDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
	if (!normalizedToday) return null;
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
		return createUTCDate(Number(absoluteMatch[1]), Number(absoluteMatch[2]), Number(absoluteMatch[3]));
	}
	return null;
}

function parseDateFilter(line: string, today: Date): DateFilter | null {
	const match = line.trim().match(/^happens\s+(on or after|on or before|after|before|on)\s+(.+)$/i);
	if (!match?.[1] || !match[2]) return null;
	const date = parseQueryDate(match[2].trim(), today);
	return date ? { operator: match[1].toLowerCase() as DateFilter['operator'], date } : null;
}

export function parseCodeBlockOptions(source: string, fallbackToday = new Date()): AnniversaryCodeBlockOptions {
	const lines = source.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
	const words = source.toLowerCase().split(/\s+/);
	const warnings: string[] = [];
	const todayLines = lines.filter((line) => /^today\b/i.test(line));
	if (todayLines.length > 1) warnings.push('Only one today override may be specified.');

	const overrideValue = todayLines.length === 1 ? todayLines[0]?.replace(/^today\s+/i, '') : undefined;
	const override = overrideValue ? parseIsoDate(overrideValue) : null;
	if (todayLines.length === 1 && !override) warnings.push(`Invalid today override: ${todayLines[0]}`);
	if (todayLines.length > 1) {
		for (const line of todayLines) {
			if (!parseIsoDate(line.replace(/^today\s+/i, ''))) warnings.push(`Invalid today override: ${line}`);
		}
	}
	const today = override ? localDate(override) : fallbackToday;
	const filters: DateFilter[] = [];

	for (const line of lines) {
		const option = line.toLowerCase();
		if (option === 'nowarnings' || option === 'notoday' || /^today\b/i.test(line)) continue;
		if (/^happens\b/i.test(line)) {
			const filter = parseDateFilter(line, today);
			if (filter) filters.push(filter);
			else warnings.push(`Invalid happens filter: ${line}`);
			continue;
		}
		warnings.push(`Unknown option: ${line}`);
	}

	return {
		filters,
		hideWarnings: words.includes('nowarnings'),
		hideToday: words.includes('notoday'),
		today,
		todayOverridden: Boolean(override),
		warnings
	};
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
		const occurrence = createUTCDate(year, anniversary.month, anniversary.day);
		if (!occurrence) continue;
		if (anniversaryYear !== null && year < anniversaryYear) continue;
		if (matchesDateFilters(occurrence, filters)) return occurrence;
	}
	return null;
}

export function filterAnniversaries(anniversaries: Anniversary[], options: AnniversaryCodeBlockOptions): Anniversary[] {
	if (options.filters.length === 0) return anniversaries;
	return anniversaries.filter((anniversary) => dateOfAnniversaryInRange(anniversary, options.filters, options.today) !== null);
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
	if (!createUTCDate(validationYear, month, day)) return null;

	const category = trailingText || keyMatch[1]?.toLowerCase() || '';
	return { category, name: pageTitle, date, month, day, file };
}
