import { App, Editor, MarkdownView, Notice, Plugin,SuggestModal } from 'obsidian';
import {  ListResult, listAll  } from 'firebase/storage';
import { FlintDataTransfer } from 'datatools';
import { vaultRef } from 'firebase-tools';
import { FlintPluginSettings, FlintSettingsTab, ExampleView, VIEW_TYPE_EXAMPLE, DEFAULT_SETTINGS } from 'flint-settings';

export let currentVaultName: string = 'vaults';
export let remoteVaultName: string = '';

export default class FlintPlugin extends Plugin {
	settings: FlintPluginSettings;
	statusBar: HTMLElement;
	dataTools: FlintDataTransfer;

	async onload() {
		await this.loadSettings();
		currentVaultName = await this.app.vault.getName();
		remoteVaultName = this.settings.remoteConnectedVault;
		this.dataTools = new FlintDataTransfer(this);

		// This creates an icon in the left ribbon.
		const uploadRibbon = this.addRibbonIcon('upload', 'Upload Files', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('Attempting Upload');
			
			this.dataTools.forceUploadFiles(this.app.vault, this.settings);

		});
		// Perform additional things with the ribbon
		uploadRibbon.addClass('flint-upload-ribbon-class');

		const downloadRibbon = this.addRibbonIcon('download', 'Download Files', (evt: MouseEvent) => {
			//Check if target vault has been selected
			if (remoteVaultName !== '') {
				new Notice('Downloadin!');
				this.dataTools.importVault(currentVaultName, remoteVaultName);
			}
			else {
				new Notice("Please select target cloud vault!");
			}

		});
		downloadRibbon.addClass('flint-download-ribbon-class');

		this.statusBar = this.addStatusBarItem();
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		if (this.settings.remoteConnectedVault !== 'default') {
			this.statusBar.setText(`Flint Remote Set to ${this.settings.remoteConnectedVault}`);
		}
		else {
			this.statusBar.setText(`Flint Remote Not Set`);
		}


		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						//new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		this.addCommand({

			id: 'import-cloud-vault',
			name: 'Import Vault from Cloud',
			callback: () => {
				const selectionModal = new CloudVaultSelectModal(this.app, this.statusBar, this, this.settings);
				selectionModal.open();
			}

		});
		// this.registerView(
		// 	VIEW_TYPE_EXAMPLE,
		// 	(leaf) => new ExampleView(leaf)
		// );

		// this.addRibbonIcon("dice", "Activate view", () => {
		// 	this.activateView();
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new FlintSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	async setRemoteDesintation(remoteName: string) {
		remoteVaultName = remoteName;
		this.settings.remoteConnectedVault = remoteName;
		this.statusBar.setText(`Flint Remote Set to ${remoteName}`);
		new Notice(`Syncing to ${remoteName}`);
		await this.saveSettings()
	}


	// async activateView() {
	// 	this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);

	// 	await this.app.workspace.getRightLeaf(false).setViewState({
	// 		type: VIEW_TYPE_EXAMPLE,
	// 		active: true,
	// 	});

	// 	this.app.workspace.revealLeaf(
	// 		this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0]
	// 	);
	// }

	onunload() {

	}

	async loadSettings() {

		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

export interface FirebaseVault {
	title: string;
	ref?: string;
}

async function fetchFirebaseVaults(): Promise<FirebaseVault[]> {
	/** Generate/Update list of ALL_FIREBASE_VAULTS 
	 * @public  
	 */

	const vaultList: ListResult = await listAll(vaultRef);

	let ALL_FIREBASE_VAULTS: FirebaseVault[] = [];

	for (let i = 0; i < vaultList.prefixes.length; i++) {
		const vaultName = `${vaultList.prefixes[i]}`.split('/').pop();
		if (vaultName) {
			ALL_FIREBASE_VAULTS[i] = { title: vaultName, ref: `${vaultRef}` };
		}
	}
	return ALL_FIREBASE_VAULTS;

}
//contain a list of all vaults in the firebase bucket

export class CloudVaultSelectModal extends SuggestModal<FirebaseVault> {
	HTMLStatusbar: HTMLElement;
	pluginSettings: FlintPluginSettings;
	plugin: FlintPlugin;

	constructor(app: App, HTMLbar: HTMLElement, plugin: FlintPlugin, settings: FlintPluginSettings) {
		super(app);
		this.app = app;
		this.HTMLStatusbar = HTMLbar;
		this.pluginSettings = settings;
		this.plugin = plugin;

	}
	async getSuggestions(query: string): Promise<FirebaseVault[]> {
		const RETRIEVED_FIREBASE_VAULTS = await fetchFirebaseVaults();

		if (RETRIEVED_FIREBASE_VAULTS.length <= 0) {
			new Notice('NO VAULTS PRESENT');
		}
		return RETRIEVED_FIREBASE_VAULTS.filter((vault) =>
			vault.title.toLowerCase().includes(query.toLowerCase())
		);
	}

	// Renders each suggestion item.
	renderSuggestion(vault: FirebaseVault, el: HTMLElement) {
		el.createEl("div", { text: vault.title });
		el.createEl("small", { text: vault.ref });
	}

	// Perform action on the selected suggestion.
	async onChooseSuggestion(vault: FirebaseVault, evt: MouseEvent | KeyboardEvent) {
		new Notice(`Selected ${vault.title}`);


		remoteVaultName = vault.title;

		this.plugin.setRemoteDesintation(vault.title);
		//changes the displayed current connected vault

	}
}

