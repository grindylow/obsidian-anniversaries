// Registers anniversary commands and renders vault-wide anniversary code blocks.
import { Plugin } from 'obsidian';
import { filterAnniversaries, formatAnniversary, formatTodayEntry, getCodeBlockWarnings, getTodayOverride, hasNotodayOption, hasNowarningsOption, isAnniversaryKey, parseAnniversaryFrontmatter } from './anniversary';
import type { Anniversary, UnparsableAnniversary } from './anniversary';

function renderAnniversaries(el: HTMLElement, anniversaries: Anniversary[], unparsable: UnparsableAnniversary[], hideWarnings = false, hideToday = false, codeWarnings: string[] = [], today = new Date(), todayOverridden = false) {
	const list = el.createEl('ul');
	const todayMonth = today.getMonth() + 1;
	const todayDay = today.getDate();
	let todayInserted = hideToday;
	const insertToday = () => {
		if (hideToday) return;
		const item = list.createEl('li');
		item.setText(formatTodayEntry(today, todayOverridden));
		todayInserted = true;
	};

	if (anniversaries.length === 0) {
		list.createEl('li', { text: 'No anniversaries found that match the given filters.' });
		insertToday();
	} else {
		for (const anniversary of anniversaries) {
			if (!todayInserted && (anniversary.month > todayMonth || (anniversary.month === todayMonth && anniversary.day >= todayDay))) {
				insertToday();
			}
			const item = list.createEl('li');
			item.setText(formatAnniversary(anniversary, today));
		}
		if (!todayInserted) insertToday();
	}

	const warningCount = (hideWarnings ? 0 : unparsable.length) + codeWarnings.length;
	if (warningCount > 0) {
		const warningDetails = el.createEl('details');
		const summary = warningDetails.createEl('summary');
		summary.setText(`⚠ ${warningCount} warning${warningCount === 1 ? '' : 's'}`);
		const warningList = warningDetails.createEl('ul');
		if (!hideWarnings) {
			for (const entry of unparsable) {
				const item = warningList.createEl('li');
				const fileName = entry.file.split('/').pop() ?? entry.file;
				item.createEl('code', { text: fileName });
				item.createEl('span', { text: ': ' });
				item.createEl('code', { text: entry.key });
				item.createEl('span', { text: `: ${JSON.stringify(entry.value)}` });
			}
		}
		for (const warning of codeWarnings) warningList.createEl('li', { text: warning });
		const help = warningDetails.createEl('p');
		help.appendText('To resolve these issues, please see the ');
		help.createEl('a', { text: 'plugin GitHub repository', href: 'https://github.com/grindylow/obsidian-anniversaries' });
		help.appendText(' for help.');
	}
}

export default class AnniversaryReminderPlugin extends Plugin {
	private async collectAnniversaries() {
		const anniversaries: Anniversary[] = [];
		const unparsable: UnparsableAnniversary[] = [];
		for (const file of this.app.vault.getMarkdownFiles()) {
			const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
			if (!frontmatter) continue;

			for (const [key, value] of Object.entries(frontmatter)) {
				if (!isAnniversaryKey(key)) continue;
				const anniversary = parseAnniversaryFrontmatter(key, value, file.path, file.basename);
				if (anniversary) anniversaries.push(anniversary);
				else unparsable.push({ key, value, file: file.path });
			}
		}

		anniversaries.sort((a, b) => a.month - b.month || a.day - b.day || a.name.localeCompare(b.name));
		return { anniversaries, unparsable };
	}

	async onload() {
		this.registerMarkdownCodeBlockProcessor('anniversaries', async (source, el) => {
			const { anniversaries: allAnniversaries, unparsable } = await this.collectAnniversaries();
			const codeWarnings = getCodeBlockWarnings(source);
			const today = getTodayOverride(source);
			const todayOverridden = source.split(/\r?\n/).filter((line) => /^today\b/i.test(line.trim())).length === 1 && !codeWarnings.some((warning) => warning.startsWith('Invalid today override:'));
			const anniversaries = filterAnniversaries(allAnniversaries, source, today);
			renderAnniversaries(el, anniversaries, unparsable, hasNowarningsOption(source), hasNotodayOption(source), codeWarnings, today, todayOverridden);
		});

	}
}
