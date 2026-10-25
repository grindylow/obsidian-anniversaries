// Registers the vault-wide anniversary command and renders matching frontmatter entries.
import { Modal, Plugin } from 'obsidian';
import { parseAnniversaryFrontmatter } from './anniversary';
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
				const cache = this.app.metadataCache.getFileCache(file);
				const frontmatter = cache?.frontmatter;
				if (!frontmatter) continue;

				for (const [key, value] of Object.entries(frontmatter)) {
					const anniversary = parseAnniversaryFrontmatter(key, value, file.path, file.basename);
					if (anniversary) anniversaries.push(anniversary);
				}
			}

			anniversaries.sort((a, b) => a.month - b.month || a.day - b.day || a.name.localeCompare(b.name));
			new AnniversaryModal(this, anniversaries).open();
		};

		this.addCommand({
			id: 'check-anniversaries',
			name: 'Check anniversaries',
			callback: openAnniversaries
		});
	}
}
