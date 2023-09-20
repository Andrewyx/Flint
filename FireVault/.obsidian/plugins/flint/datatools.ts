import { Notice, TFile, TFolder, Vault } from 'obsidian';
import { StorageReference, getDownloadURL, ref, uploadBytesResumable, ListResult, listAll, deleteObject } from 'firebase/storage';
import FlintPlugin from 'main';

import { remoteVaultName } from 'main';
import { storage, vaultRef } from 'firebase-tools';
import { FlintPluginSettings } from 'flint-settings';
// Remember to rename these classes and interfaces!
// Import the functions you need from the SDKs you need

export class FlintDataTransfer  {
	plugin: FlintPlugin;

	constructor(plugin: FlintPlugin){
		this.plugin = plugin;
	}
	//#region Upload/Download Files

	async deleteFile(remoteVaultFileList: ListResult) {
		//deletes all files in this dir and in children dirs

		for (let i = 0; i < remoteVaultFileList.items.length; i++){
			const deleteRef: StorageReference = ref(storage, remoteVaultFileList.items[i].fullPath);
			deleteObject(deleteRef);
		}

		if(remoteVaultFileList.prefixes.length > 0) {
			for(let x = 0; x < remoteVaultFileList.prefixes.length; x++){
				const localFolders = await listAll(remoteVaultFileList.prefixes[x]);
				this.deleteFile(localFolders);
			}
		}	
	}

	async clearRemoteVault(settings: FlintPluginSettings ) {
		const remoteVaultName: string = settings.remoteConnectedVault;

		if (remoteVaultName){
			const remoteVaultRef: StorageReference = ref(vaultRef, `${remoteVaultName}`);
			const remoteVaultFileList: ListResult = await listAll(remoteVaultRef);
			await this.deleteFile(remoteVaultFileList)
		}
	}

	async forceUploadFiles(vault: Vault, settings: FlintPluginSettings) {
		this.clearRemoteVault(settings).then(
			(value) => {
				const files = vault.getMarkdownFiles();
				for (let i = 0; i < files.length; i++) {
					try {
						this.uploadFile(files, i);
					} catch (error) {
						console.log(`Error: ${error}`);
					}
				}	
			}
		);
				

	}

	async uploadFile(files: TFile[], index: number): Promise<void> {


		//Sequential calls for param information
		//Check if destination has been set
		if (remoteVaultName !== '') {
			const pathString: string = await `${remoteVaultName}/${files[index].path}`;
			const pathRef: StorageReference = await ref(vaultRef, pathString);
			const data: ArrayBuffer = await this.plugin.app.vault.adapter.readBinary(files[index].path);

			//feed params into upload func from firebase
			//const remoteVaultRef: StorageReference = ref(vaultRef, `${remoteVaultName}`);
			//const remoteVaultFileList: ListResult = await listAll(remoteVaultRef);
			//const allRemoteFilesNames = await getAllRemoteFiles(remoteVaultFileList, []);
			// const allLocalFiles: TFile[] = await this.app.vault.getMarkdownFiles();
			// let allLocalFileNames:string[] = [];


			// for(let y = 0; y < allLocalFiles.length; y++ ){
			// 	allLocalFileNames.push(allLocalFiles[y].name);
			// }
			

			//just give up and trash all paths bruh

			//const difference = allRemoteFilesNames.filter((element) => !allLocalFileNames.includes(element));
			//this is terribly slow and I think exponential time comp, change to a hashmap at some point please
			//replace ALL of this with JS Objects instead 

			await uploadBytesResumable(pathRef, data).then((snapshot) => {
				console.log(`file ${index} uploaded successfully`);
			});
		}
		else {
			new Notice("Choose a target vault destination!");
		}

	}

	async importVault(localVault: string, remoteVault: string): Promise<void> {
		/**
		 * @param localVault is the target local vault where files will be written to
		 */
		new Notice(`Remote Vault: ${remoteVault}`);
		const remoteVaultRef: StorageReference = ref(vaultRef, `${remoteVault}`);
		const remoteVaultFileList: ListResult = await listAll(remoteVaultRef);

		//pass in all files and prefixes (folders) into download function.
		
		this.downloadToLocal(localVault, remoteVaultFileList);

	}

	async downloadToLocal(localVaultName: string, remoteDirFileList: ListResult): Promise<void> {
		console.log(remoteDirFileList);
		const vault: Vault = this.plugin.app.vault;

		if (remoteDirFileList.prefixes.length > 0) {

			for (let x = 0; x < remoteDirFileList.prefixes.length; x++) {
				let remoteFolderPath = remoteDirFileList.prefixes[x].fullPath.split('/');
				remoteFolderPath = remoteFolderPath.slice(2);

				const localFolderPath: string = remoteFolderPath.join('/');

				if (vault.getAbstractFileByPath(localFolderPath)) {
					//Item exists already
					const fileOrFolder = vault.getAbstractFileByPath(localFolderPath);

					if (fileOrFolder instanceof TFolder) {
						// console.log(`${fileOrFolder.name} Exists`);
						//rename folder
						//modify the folder
						const localfolder = fileOrFolder;
						vault.rename(localfolder, localFolderPath);
						//this...does nothing...bozo
					}
				}
				else {
					try {
						await vault.createFolder(localFolderPath);
					}
					catch (error) {
						console.log(error);
					}
				}

				const localFolders = await listAll(remoteDirFileList.prefixes[x]);
				//console.log('Looping');

				this.downloadToLocal(localVaultName, localFolders);
				//nasty recursion
			}
		}

		for (let i = 0; i < remoteDirFileList.items.length; i++) {

			let remoteFilePath = remoteDirFileList.items[i].fullPath.split('/');
			remoteFilePath = remoteFilePath.slice(2);


			const localFilePath: string = remoteFilePath.join('/');
			const file: ArrayBuffer = await this.fetchFile(`${remoteDirFileList.items[i]}`);


			if (vault.getAbstractFileByPath(localFilePath)) {
				//Item exists already
				const fileOrFolder = vault.getAbstractFileByPath(localFilePath);
				//nest modification functions


				if (fileOrFolder instanceof TFile) {
					//console.log(`${fileOrFolder.name} Exists`);
					const localfile = fileOrFolder;
					vault.modifyBinary(localfile, file);

					// await vault.process(localfile, (data) => {
					// 	//use API https://github.com/google/diff-match-patch/wiki/API to find diffs and eventually show the user before modifying the text completely
					// 	const newData = file;
					// 	return data.replace('','');
					// })

				}
			}
			else {
				//file doesnt exist yet. 
				try {
					//console.log(`Writting File Path from: ${remoteDirFileList.items[i]} to local path ${localFilePath}`);
					await vault.createBinary(localFilePath, file);

				} catch (error) {

					console.log(error);
				}
			}
		}

	}

	async fetchFile(filePathString: string): Promise<ArrayBuffer> {

		const filePathRef: StorageReference = ref(storage, filePathString);
		const fileURL: string = await getDownloadURL(filePathRef);
		//console.log(`${fileURL}`);

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


	//#endregion
}

// interface FlintRemoteFile{
// 	name: string,
// 	path: string
// }
// interface FlintRemoteFileMap {
// 	[name: string]: FlintRemoteFile;
// }


// async function getAllRemoteFiles(fileList: ListResult, dirFileNames: FlintRemoteFileMap): Promise<FlintRemoteFile[]> {

// 	for (let i = 0; i < fileList.items.length; i++) {
// 		const name = fileList.items[i].name;
// 		const path = fileList.items[i].fullPath;
// 		const fileObj :FlintRemoteFile = {name, path}; 
// 		dirFileNames[fileList.items[i].fullPath] = fileObj;

// 	}	
// 	if (fileList.prefixes.length > 0){
// 		for (let x = 0; x < fileList.prefixes.length; x++){
// 			const localFolders = await listAll(fileList.prefixes[x]);
// 			const fileInFolder = await getAllRemoteFiles(localFolders, dirFileNames);
// 			dirFileNames = dirFileNames.concat(fileInFolder);
// 		}
// 	}

// 	return dirFileNames;
// 	//return map of all file objs
// }