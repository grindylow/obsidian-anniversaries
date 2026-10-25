// Registers anniversary commands and renders vault-wide anniversary code blocks.
import { Modal, Plugin } from 'obsidian';
import { filterAnniversaries, formatAnniversary, formatTodayEntry, hasNowarningsOption, isAnniversaryKey, parseAnniversaryFrontmatter } from './anniversary';
import type { Anniversary, UnparsableAnniversary } from './anniversary';

function renderAnniversaries(el: HTMLElement, anniversaries: Anniversary[], unparsable: UnparsableAnniversary[], hideWarnings = false) {
	if (anniversaries.length === 0) el.createEl('p', { text: 'No anniversaries found.' });

	const list = el.createEl('ul');
	const today = new Date();
	const todayMonth = today.getMonth() + 1;
	const todayDay = today.getDate();
	let todayInserted = false;
	const insertToday = () => {
		const item = list.createEl('li');
		item.setText(formatTodayEntry(today));
		todayInserted = true;
	};

	for (const anniversary of anniversaries) {
		if (!todayInserted && (anniversary.month > todayMonth || (anniversary.month === todayMonth && anniversary.day >= todayDay))) {
			insertToday();
		}
		const item = list.createEl('li');
		item.setText(formatAnniversary(anniversary, today));
	}
	if (!todayInserted) insertToday();

	if (!hideWarnings && unparsable.length > 0) {
		const warningDetails = el.createEl('details');
		const summary = warningDetails.createEl('summary');
		summary.setText(`⚠ ${unparsable.length} unparsable anniversary ${unparsable.length === 1 ? 'entry' : 'entries'}`);
		const errorList = warningDetails.createEl('ul');
		for (const entry of unparsable) {
			const item = errorList.createEl('li');
			item.createEl('code', { text: entry.key });
			item.createEl('span', { text: `: ${JSON.stringify(entry.value)} · ${entry.file}` });
		}
	}
}

class AnniversaryModal extends Modal {
	constructor(plugin: AnniversaryReminderPlugin, anniversaries: Anniversary[], unparsable: UnparsableAnniversary[]) {
		super(plugin.app);
		this.setTitle('Anniversaries');
		renderAnniversaries(this.contentEl, anniversaries, unparsable);
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
			const anniversaries = filterAnniversaries(allAnniversaries, source);
			renderAnniversaries(el, anniversaries, unparsable, hasNowarningsOption(source));
		});

		this.addCommand({
			id: 'check-anniversaries',
			name: 'Check anniversaries',
			callback: async () => {
				const { anniversaries, unparsable } = await this.collectAnniversaries();
				new AnniversaryModal(this, anniversaries, unparsable).open();
			}
		});
	}
}
