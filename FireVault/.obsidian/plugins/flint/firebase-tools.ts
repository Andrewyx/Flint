import { StorageReference, getStorage, ref } from 'firebase/storage';
import { initializeApp } from "firebase/app";

//Insert your firebaseConfig Key!
export const firebaseConfig = {
	apiKey: "AIzaSyDdAYtOpSAG1MQWqY6zHWbBSvqOCBqkEDs",
	authDomain: "flint-4c10d.firebaseapp.com",
	projectId: "flint-4c10d",
	storageBucket: "flint-4c10d.appspot.com",
	messagingSenderId: "847454040500",
	appId: "1:847454040500:web:81298369de91f143d1c2e1"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const storage = getStorage();
export const storageRef = ref(storage);

export const vaultRef: StorageReference = ref(storageRef, 'vaults');