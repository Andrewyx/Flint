import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, SuggestModal, FileSystemAdapter, normalizePath} from 'obsidian';


import { StorageReference, getDownloadURL, getStorage, ref, uploadBytesResumable, ListResult, listAll } from 'firebase/storage';
// Remember to rename these classes and interfaces!
// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { rename } from 'fs';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdAYtOpSAG1MQWqY6zHWbBSvqOCBqkEDs",
  authDomain: "flint-4c10d.firebaseapp.com",
  projectId: "flint-4c10d",
  storageBucket: "flint-4c10d.appspot.com",
  messagingSenderId: "847454040500",
  appId: "1:847454040500:web:81298369de91f143d1c2e1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage();
const storageRef = ref(storage);

//Use this reference
const vaultRef: StorageReference = ref(storageRef, 'vaults');

let currentVaultName: string = 'vaults'; 

interface MyPluginSettings {
	mySetting: string;
}

interface Book {
	title: string;
	author: string;
  }


const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}




async function uploadFile(files: TFile[], index: number) {

	//Sequential calls for param information
	const pathString: string = await `${currentVaultName}/${files[index].path}`;
	const pathRef: StorageReference = await ref(vaultRef, pathString);
	const data: ArrayBuffer = await this.app.vault.adapter.readBinary(files[index].path);

	//feed params into upload func from firebase
	await uploadBytesResumable(pathRef, data).then((snapshot) => {
		console.log(`file ${index} uploaded successfully`);
	  });			

}

async function importVault(targetVault:string) {
	/**
	 * @param targetVault is the target local vault where files will be written to
	 */

	const targetVaultRef: StorageReference = ref(vaultRef, `${targetVault}`);
	const vaultFileList: ListResult = await listAll(targetVaultRef);

	//pass in all files and prefixes (folders) into download function.
	downloadToLocal(vaultFileList);
}

async function downloadToLocal(currentDirFileList: ListResult) {

	for (let i = 0; i < currentDirFileList.items.length; i++) {
		console.log('attempting download');

		let remoteFilePath = currentDirFileList.items[i].fullPath.split('/');
		remoteFilePath = remoteFilePath.slice(3);
		remoteFilePath.unshift(`${this.app.vault.getName()}`);
		const localFilePath: string = remoteFilePath.join('/');

		console.log(`Writting from File Path @: ${currentDirFileList.items[i]} 
			to file path ${localFilePath}`);
			
		const file = await fetchFile( `${currentDirFileList.items[i]}` );

		try {
			await this.app.vault.createBinary(localFilePath, file);
			await console.log('success!');
		} catch (error) {
			remoteFilePath.pop();
			const localFolderPath: string = remoteFilePath.join('/');
			await this.app.vault.createFolder(localFolderPath);
			await this.app.vault.createBinary(localFilePath, file);
			await console.log('success!');
		}
		
	}
	if(currentDirFileList.prefixes.length > 0){

		for (let x = 0; x < currentDirFileList.prefixes.length; x++){
			const localFolders = await listAll(currentDirFileList.prefixes[x]);
			downloadToLocal(localFolders);
			//nasty recursion
		}
	}
}

async function fetchFile(filePathString: string){

	const filePathRef: StorageReference = ref(storage, filePathString);
	const fileURL: string = await getDownloadURL(filePathRef);
	console.log(`${fileURL}`);

	const returnedFile = await new Promise<ArrayBuffer>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.responseType = 'arraybuffer';
		xhr.onload = (event) => {
			const returnedFile: ArrayBuffer = xhr.response;
			console.log('gottem on the remote');
			resolve(returnedFile);
		}; 
	
		xhr.open('GET', fileURL);
		xhr.send();
	})


	return await returnedFile;
	//place file in the same place as the firebase location in vault
}


export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		currentVaultName = await this.app.vault.getName();
		
		// This creates an icon in the left ribbon.
		const uploadRibbon = this.addRibbonIcon('upload', 'Upload Files', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('Attempting Upload');

			const files = this.app.vault.getMarkdownFiles()
			
			for (let i = 0; i < files.length; i++) {

			  try {
				uploadFile(files, i);
			  } catch (error) {
				console.log(`Error: ${error}`);
			  }
			}			
			new Notice('Success!');
		});
		// Perform additional things with the ribbon
		uploadRibbon.addClass('flint-upload-ribbon-class');

		const downloadRibbon =  this.addRibbonIcon('download', 'Download Files', (evt: MouseEvent) => {
			new Notice('Downloadin!');
			
			importVault(currentVaultName);
			//param does nothing now, TODO: MAKE ADJUSTABLE
		
			new Notice('Downloaded~');
		});
		downloadRibbon.addClass('flint-download-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Flint Active');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
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
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		this.addCommand({

			id:'import-cloud-vault',
			name:'Import Vault from Cloud',
			callback: () => {
				const testModal = new CloudVaultSelectModal(this.app);
				testModal.open();	
			}

		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

//Modals and hotkey tabs!
//TODO: 
class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

//object structure will 
interface FirebaseVault {
	title: string;
	ref?: string;
  }
  

async function fetchFirebaseVaults(): Promise<FirebaseVault[]> {
	/** Generate/Update list of ALL_FIREBASE_VAULTS
	 * @param 
	 */
	
	const vaultList: ListResult = await listAll(vaultRef);

	let ALL_FIREBASE_VAULTS: FirebaseVault[] = [];


	for (let i=0; i < vaultList.prefixes.length; i++){
		const vaultName = `${vaultList.prefixes[i]}`.split('/').pop();
		if (vaultName){
			ALL_FIREBASE_VAULTS[i] = { title: vaultName, ref: `${vaultRef}`};
		}
	}
	return ALL_FIREBASE_VAULTS;

} 
//contain a list of all vaults in the firebase bucket

export class CloudVaultSelectModal extends SuggestModal<FirebaseVault> {
		

	async getSuggestions(query: string): Promise<FirebaseVault[]> {
		const RETRIEVED_FIREBASE_VAULTS = await fetchFirebaseVaults();

		if(RETRIEVED_FIREBASE_VAULTS.length <= 0){
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
	onChooseSuggestion(vault: FirebaseVault, evt: MouseEvent | KeyboardEvent) {
		new Notice(`Selected ${vault.title}`);

		//TODO: Rework this entire section so that:
		/* 1) Local vault names do not matter
		   2) Remote vault names can be changed with modals
		   3) Display currently synced vault with status bar
		*/
		let adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			const oldPath = adapter.getBasePath();
			const newPath = oldPath.split('/');
			newPath.pop();
			newPath.push(`${vault.title}`);

			rename(oldPath, newPath.join('/'), () => {
				console.log(`Successfull Renamed Vault to ${newPath.join('/')}`);
			});
		}
		
	}
}


//TODO: User input to select which vaults are to be uploaded under this section

/* 
Nah nah, give a list of all available firebase vaults with a modal and have the user select the one they would like to import from
Then, rename the vault name to the selected cloud vault and pull
*/

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
