import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDKx8cDypL4SXrK2PDoBbPA8Fe5fzPEuok",
    authDomain: "neetprep-be464.firebaseapp.com",
    projectId: "neetprep-be464",
    storageBucket: "neetprep-be464.firebasestorage.app",
    messagingSenderId: "227717421099",
    appId: "1:227717421099:web:651f3d2bc435768b49f26e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
