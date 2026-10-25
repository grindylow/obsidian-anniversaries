// Registers anniversary commands and renders vault-wide anniversary code blocks.
import { Plugin } from 'obsidian';
import { filterAnniversaries, formatAnniversary, formatTodayEntry, isAnniversaryKey, parseAnniversaryFrontmatter, parseCodeBlockOptions } from './anniversary';
import type { Anniversary, UnparsableAnniversary } from './anniversary';

function renderAnniversaries(el: HTMLElement, anniversaries: Anniversary[], unparsable: UnparsableAnniversary[], options: ReturnType<typeof parseCodeBlockOptions>) {
	const list = el.createEl('ul');
	const todayMonth = options.today.getMonth() + 1;
	const todayDay = options.today.getDate();
	let todayInserted = options.hideToday;
	const insertToday = () => {
		if (options.hideToday) return;
		const item = list.createEl('li');
		item.setText(formatTodayEntry(options.today, options.todayOverridden));
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
			item.setText(formatAnniversary(anniversary, options.today));
		}
		if (!todayInserted) insertToday();
	}

	const warningCount = (options.hideWarnings ? 0 : unparsable.length) + options.warnings.length;
	if (warningCount > 0) {
		const warningDetails = el.createEl('details');
		const summary = warningDetails.createEl('summary');
		summary.setText(`⚠ ${warningCount} warning${warningCount === 1 ? '' : 's'}`);
		const warningList = warningDetails.createEl('ul');
		if (!options.hideWarnings) {
			for (const entry of unparsable) {
				const item = warningList.createEl('li');
				const fileName = entry.file.split('/').pop() ?? entry.file;
				item.createEl('code', { text: fileName });
				item.createEl('span', { text: ': ' });
				item.createEl('code', { text: entry.key });
				item.createEl('span', { text: `: ${JSON.stringify(entry.value)}` });
			}
		}
		for (const warning of options.warnings) warningList.createEl('li', { text: warning });
		const help = warningDetails.createEl('p');
		help.appendText('To resolve these issues, please see the ');
		help.createEl('a', { text: 'plugin GitHub repository', href: 'https://github.com/grindylow/obsidian-anniversaries' });
		help.appendText(' for help.');
	}
}

export default class AnniversaryReminderPlugin extends Plugin {
	private collectAnniversaries() {
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

	onload() {
		this.registerMarkdownCodeBlockProcessor('anniversaries', (source, el) => {
			const { anniversaries: allAnniversaries, unparsable } = this.collectAnniversaries();
			const options = parseCodeBlockOptions(source);
			const anniversaries = filterAnniversaries(allAnniversaries, options);
			renderAnniversaries(el, anniversaries, unparsable, options);
		});
	}
}
