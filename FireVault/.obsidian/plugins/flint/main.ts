import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, SuggestModal, TFolder, Vault } from 'obsidian';

import { StorageReference, getDownloadURL, getStorage, ref, uploadBytesResumable, ListResult, listAll } from 'firebase/storage';
// Remember to rename these classes and interfaces!
// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

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
let remoteVaultName: string = '';

interface FlintPluginSettings {
	remoteConnectedVault: string;
}

const DEFAULT_SETTINGS: FlintPluginSettings = {
	remoteConnectedVault: 'default'
}

async function uploadFile(files: TFile[], index: number): Promise<void> {

	//Sequential calls for param information
	//Check if destination has been set
	if (remoteVaultName !== ''){
		const pathString: string = await `${remoteVaultName}/${files[index].path}`;
		const pathRef: StorageReference = await ref(vaultRef, pathString);
		const data: ArrayBuffer = await this.app.vault.adapter.readBinary(files[index].path);
	
		//feed params into upload func from firebase
		await uploadBytesResumable(pathRef, data).then((snapshot) => {
			console.log(`file ${index} uploaded successfully`);
		  });					
	}
	else{
		new Notice("Choose a target vault destination!");
	}

}

async function importVault(localVault:string, remoteVault: string): Promise<void> {
	/**
	 * @param localVault is the target local vault where files will be written to
	 */
	new Notice(`Remote Vault: ${remoteVault}`);
	const remoteVaultRef: StorageReference = ref(vaultRef, `${remoteVault}`);
	const remoteVaultFileList: ListResult = await listAll(remoteVaultRef);

	//pass in all files and prefixes (folders) into download function.
	downloadToLocal(localVault, remoteVaultFileList);
}

async function downloadToLocal(localVaultName: string, remoteDirFileList: ListResult): Promise<void> {

	const vault: Vault = this.app.vault;

	if(remoteDirFileList.prefixes.length > 0){

		for (let x = 0; x < remoteDirFileList.prefixes.length; x++){
			let remoteFolderPath = remoteDirFileList.prefixes[x].fullPath.split('/');
			remoteFolderPath = remoteFolderPath.slice(2);

			const localFolderPath: string = remoteFolderPath.join('/');

		if(vault.getAbstractFileByPath(localFolderPath)){
			//Item exists already
			const fileOrFolder = vault.getAbstractFileByPath(localFolderPath);

			if(fileOrFolder instanceof TFolder){
				console.log(`${fileOrFolder.name} Exists`);
				//rename folder
				//modify the folder
				const localfolder = fileOrFolder;
				vault.rename(localfolder, localFolderPath);
				//this...does nothing...bozo
				}
		}
		else{
			try{
				await vault.createFolder(localFolderPath);
			}
			catch(error){
				console.log(error);
			}
		}		

			const localFolders = await listAll(remoteDirFileList.prefixes[x]);
			console.log('Looping');

			downloadToLocal(localVaultName, localFolders);
			//nasty recursion
		}
	}	

	for (let i = 0; i < remoteDirFileList.items.length; i++) {

		let remoteFilePath = remoteDirFileList.items[i].fullPath.split('/');
		remoteFilePath = remoteFilePath.slice(2);


		const localFilePath: string = remoteFilePath.join('/');
		const file: ArrayBuffer = await fetchFile( `${remoteDirFileList.items[i]}` );


		if(vault.getAbstractFileByPath(localFilePath)){
			//Item exists already
			const fileOrFolder = vault.getAbstractFileByPath(localFilePath);
			//nest modification functions
			

			if (fileOrFolder instanceof TFile){
				console.log(`${fileOrFolder.name} Exists`);
				const localfile = fileOrFolder;
				vault.modifyBinary(localfile, file);


				// await vault.process(localfile, (data) => {
				// 	//use API https://github.com/google/diff-match-patch/wiki/API to find diffs and eventually show the user before modifying the text completely
					
				// 	const newData = file;

				// 	return data.replace('','');

				// })
				
			}
		}
		else{
			//file doesnt exist yet. 
			try {
				console.log(`Writting File Path from: ${remoteDirFileList.items[i]} to local path ${localFilePath}`);
				await vault.createBinary(localFilePath, file);
	
			} catch (error) {

				console.log(error);
			}
		}



		
	}

}

async function fetchFile(filePathString: string): Promise<ArrayBuffer>{

	const filePathRef: StorageReference = ref(storage, filePathString);
	const fileURL: string = await getDownloadURL(filePathRef);
	console.log(`${fileURL}`);

	const returnedFile = await new Promise<ArrayBuffer>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.responseType = 'arraybuffer';
		xhr.onload = (event) => {
			const returnedFile: ArrayBuffer = xhr.response;
			resolve(returnedFile);
		}; 
	
		xhr.open('GET', fileURL);
		xhr.send();
	})


	return await returnedFile;
	//place file in the same place as the firebase location in vault
}


export default class FlintPlugin extends Plugin {
	settings: FlintPluginSettings;
	statusBar: HTMLElement;

	async onload() {
		await this.loadSettings();
		currentVaultName = await this.app.vault.getName();
		remoteVaultName = this.settings.remoteConnectedVault;
		
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
		});
		// Perform additional things with the ribbon
		uploadRibbon.addClass('flint-upload-ribbon-class');

		const downloadRibbon =  this.addRibbonIcon('download', 'Download Files', (evt: MouseEvent) => {
			//Check if target vault has been selected
			if (remoteVaultName !== ''){
				new Notice('Downloadin!');
				importVault(currentVaultName, remoteVaultName);
			}
			else{
				new Notice("Please select target cloud vault!");
			}

		});
		downloadRibbon.addClass('flint-download-ribbon-class');

		this.statusBar = this.addStatusBarItem();
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		if (this.settings.remoteConnectedVault !== 'default'){
			this.statusBar.setText(`Flint Remote Set to ${this.settings.remoteConnectedVault}`);
			}
		else{
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

			id:'import-cloud-vault',
			name:'Import Vault from Cloud',
			callback: () => {
				const selectionModal = new CloudVaultSelectModal(this.app, this.statusBar, this, this.settings);
				selectionModal.open();							
			}

		});
		
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

	async setRemoteDesintation(remoteName:string){
		this.settings.remoteConnectedVault = remoteName;
		this.statusBar.setText(`Flint Remote Set to ${remoteName}`);
		new Notice(`Syncing to ${remoteName}`);
		await this.saveSettings()
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


 
interface FirebaseVault {
	title: string;
	ref?: string;
  }
  

async function fetchFirebaseVaults(): Promise<FirebaseVault[]> {
	/** Generate/Update list of ALL_FIREBASE_VAULTS 
	 * @public  
	 * 
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
	HTMLStatusbar: HTMLElement;
	pluginSettings: FlintPluginSettings;
	plugin: FlintPlugin;

	constructor(app: App, HTMLbar: HTMLElement, plugin: FlintPlugin,settings: FlintPluginSettings){
		super(app);
		this.app = app;
		this.HTMLStatusbar = HTMLbar;
		this.pluginSettings = settings;
		this.plugin = plugin;
		
	}
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
	async onChooseSuggestion(vault: FirebaseVault, evt: MouseEvent | KeyboardEvent) {
		new Notice(`Selected ${vault.title}`);


		remoteVaultName = vault.title;
		
		this.plugin.setRemoteDesintation(vault.title);
		//changes the displayed current connected vault
				
	}
}

class FlintSettingsTab extends PluginSettingTab {
	plugin: FlintPlugin;

	constructor(app: App, plugin: FlintPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async #fetchVaultOptions() {
		const vaultList: ListResult = await listAll(vaultRef);

		let ALL_FIREBASE_VAULTS: Record<string, string> = {};
	
		for (let i=0; i < vaultList.prefixes.length; i++){
			const vaultName = `${vaultList.prefixes[i]}`.split('/').pop();
			if (vaultName){
				ALL_FIREBASE_VAULTS[vaultName] = vaultName;
			}
		}
		return ALL_FIREBASE_VAULTS;		
	}

	

	async display(): Promise<void> {
		const {containerEl} = this;
		const allVaultOptions = await this.#fetchVaultOptions();

		containerEl.empty();
				
		new Setting(containerEl)
			.setName('Current Connected Remote Vault')
			.setDesc('Active Firebase Vault')

			.addDropdown(options => options
				.addOptions(allVaultOptions)
				.onChange(async (name:string) => {
					this.plugin.setRemoteDesintation(name);			
				}));	
		
	}
}
