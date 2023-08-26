import { App,  PluginSettingTab, Setting } from 'obsidian';
import FlintPlugin from 'main';
import { vaultRef } from 'firebase-tools';
import { ListResult, listAll } from 'firebase/storage';

export interface FlintPluginSettings {
	remoteConnectedVault: string;
}

export const DEFAULT_SETTINGS: FlintPluginSettings = {
	remoteConnectedVault: 'default'
}

export class FlintSettingsTab extends PluginSettingTab {
	plugin: FlintPlugin;

	constructor(app: App, plugin: FlintPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async #fetchVaultOptions() {
		const vaultList: ListResult = await listAll(vaultRef);

		let ALL_FIREBASE_VAULTS: Record<string, string> = {};

		for (let i = 0; i < vaultList.prefixes.length; i++) {
			const vaultName = `${vaultList.prefixes[i]}`.split('/').pop();
			if (vaultName) {
				ALL_FIREBASE_VAULTS[vaultName] = vaultName;
			}
		}
		return ALL_FIREBASE_VAULTS;
	}

	async display(): Promise<void> {
		const { containerEl } = this;
		const allVaultOptions = await this.#fetchVaultOptions();

		containerEl.empty();

		new Setting(containerEl)
			.setName('Current Connected Remote Vault')
			.setDesc('Active Firebase Vault')

			.addDropdown(options => options
				.addOptions(allVaultOptions)
				.onChange(async (name: string) => {
					this.plugin.setRemoteDesintation(name);
				}));

	}
}

import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_EXAMPLE = "example-view";

export class ExampleView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return "Example view";
	}

	async onOpen() {
		//const {containerEl} = this;
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h4", { text: "Example view" });
		container.createEl("br");
		container.createEl("div", { text: "Other sample text" });
		container.createEl("button", { text: "More sample text" });

	}

	async onClose() {
		// Nothing to clean up.
	}
}


