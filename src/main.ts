// Registers the vault-wide anniversary command and renders matching frontmatter entries.
import { Modal, Plugin } from 'obsidian';
import { isAnniversaryKey, parseAnniversaryFrontmatter } from './anniversary';
import type { Anniversary, UnparsableAnniversary } from './anniversary';

class AnniversaryModal extends Modal {
	constructor(plugin: AnniversaryReminderPlugin, anniversaries: Anniversary[], unparsable: UnparsableAnniversary[]) {
		super(plugin.app);
		this.setTitle('Anniversaries');
		if (anniversaries.length === 0) {
			this.contentEl.createEl('p', { text: 'No anniversaries found.' });
		} else {
			const list = this.contentEl.createEl('ul');
			for (const anniversary of anniversaries) {
				const item = list.createEl('li');
				item.createEl('strong', { text: anniversary.name });
				item.createEl('span', { text: ` — ${anniversary.category} · ${anniversary.date} · ${anniversary.file}` });
			}
		}

		if (unparsable.length > 0) {
			this.contentEl.createEl('h3', { text: 'Unparsable anniversary entries' });
			const errorList = this.contentEl.createEl('ul');
			for (const entry of unparsable) {
				const item = errorList.createEl('li');
				item.createEl('code', { text: entry.key });
				item.createEl('span', { text: `: ${JSON.stringify(entry.value)} · ${entry.file}` });
			}
		}
	}
}

export default class AnniversaryReminderPlugin extends Plugin {
	async onload() {
		const openAnniversaries = async () => {
			const anniversaries: Anniversary[] = [];
			const unparsable: UnparsableAnniversary[] = [];
			for (const file of this.app.vault.getMarkdownFiles()) {
				const cache = this.app.metadataCache.getFileCache(file);
				const frontmatter = cache?.frontmatter;
				if (!frontmatter) continue;

				for (const [key, value] of Object.entries(frontmatter)) {
					if (!isAnniversaryKey(key)) continue;
					const anniversary = parseAnniversaryFrontmatter(key, value, file.path, file.basename);
					if (anniversary) anniversaries.push(anniversary);
					else unparsable.push({ key, value, file: file.path });
				}
			}

			anniversaries.sort((a, b) => a.month - b.month || a.day - b.day || a.name.localeCompare(b.name));
			new AnniversaryModal(this, anniversaries, unparsable).open();
		};

		this.addCommand({
			id: 'check-anniversaries',
			name: 'Check anniversaries',
			callback: openAnniversaries
		});
	}
}
