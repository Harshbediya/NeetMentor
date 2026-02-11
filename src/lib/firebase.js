import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDKx8cDypL4SXrK2PDoBbPA8Fe5fzPEuok",
    authDomain: "neetprep-be464.firebaseapp.com",
    projectId: "neetprep-be464",
    storageBucket: "neetprep-be464.firebasestorage.app",
    messagingSenderId: "227717421099",
    appId: "1:227717421099:web:651f3d2bc435768b49f26e",
};

// Initialize Firebase (check if already initialized for SSR safety)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

let firestoreDb;
try {
    if (typeof window !== "undefined") {
        firestoreDb = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            }),
        });
    } else {
        firestoreDb = getFirestore(app);
    }
} catch (e) {
    // Fallback if already initialized or error
    firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
