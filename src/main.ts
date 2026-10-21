import { Modal, Plugin } from 'obsidian';
import { parseAnniversaryLine } from './anniversary';
import type { Anniversary } from './anniversary';

class AnniversaryModal extends Modal {
	constructor(plugin: AnniversaryReminderPlugin, anniversaries: Anniversary[]) {
		super(plugin.app);
		this.setTitle('Anniversaries');
		const list = this.contentEl.createEl('ul');
		if (anniversaries.length === 0) {
			this.contentEl.createEl('p', { text: 'No anniversaries found.' });
			return;
		}

		for (const anniversary of anniversaries) {
			const item = list.createEl('li');
			item.createEl('strong', { text: anniversary.name });
			item.createEl('span', { text: ` — ${anniversary.category} · ${anniversary.date} · ${anniversary.file}` });
		}
	}
}

export default class AnniversaryReminderPlugin extends Plugin {
	async onload() {
		const openAnniversaries = async () => {
			const anniversaries: Anniversary[] = [];
			for (const file of this.app.vault.getMarkdownFiles()) {
				const content = await this.app.vault.cachedRead(file);
				for (const line of content.split(/\r?\n/)) {
					const anniversary = parseAnniversaryLine(line, file.path, file.basename);
					if (anniversary) anniversaries.push(anniversary);
				}
			}

			anniversaries.sort((a, b) => a.month - b.month || a.day - b.day || a.name.localeCompare(b.name));
			new AnniversaryModal(this, anniversaries).open();
		};

		this.addRibbonIcon('calendar-heart', 'Check anniversaries', openAnniversaries);
		this.addCommand({
			id: 'check-anniversaries',
			name: 'Check anniversaries',
			callback: openAnniversaries
		});
	}
}
