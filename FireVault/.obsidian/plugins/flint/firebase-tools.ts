import { StorageReference, getStorage, ref } from 'firebase/storage';
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, getAuth, onAuthStateChanged, signInWithRedirect} from 'firebase/auth';


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


const provider = new GoogleAuthProvider();

const auth = getAuth(app);


// signInWithPopup(auth, provider)
//   .then((result) => {
//     // This gives you a Google Access Token. You can use it to access the Google API.
//     const credential = GoogleAuthProvider.credentialFromResult(result);

// 	if(credential?.accessToken){
// 		const token = credential.accessToken;
// 	}
	
//     // The signed-in user info.
//     const user = result.user;
//     // IdP data available using getAdditionalUserInfo(result)
//     // ...
//   }).catch((error) => {
//     // Handle Errors here.
//     const errorCode = error.code;
//     const errorMessage = error.message;
//     // The email of the user's account used.
//     const email = error.customData.email;
//     // The AuthCredential type that was used.
//     const credential = GoogleAuthProvider.credentialFromError(error);
//     // ...
//   });