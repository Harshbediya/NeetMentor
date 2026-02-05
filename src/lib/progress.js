import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const getLocal = (uid, key) => {
  try {
    const v = localStorage.getItem(`${key}_${uid}`);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
const setLocal = (uid, key, data) => {
  try {
    localStorage.setItem(`${key}_${uid}`, JSON.stringify(data));
  } catch { }
};
const setPending = (uid, key, data) => {
  try {
    localStorage.setItem(`pending_${key}_${uid}`, JSON.stringify(data));
  } catch { }
};
const getPending = (uid, key) => {
  try {
    const v = localStorage.getItem(`pending_${key}_${uid}`);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
const clearPending = (uid, key) => {
  try {
    localStorage.removeItem(`pending_${key}_${uid}`);
  } catch { }
};

// Original Progress functions (Refactored to use generic helpers)
const PROGRESS_KEY = "progress";
export const saveProgress = async (data) => {
  const user = auth.currentUser;
  if (!user) return;
  const uid = user.uid;
  localStorage.setItem(`progress_${uid}`, JSON.stringify(data));
  const userDocRef = doc(db, "users", uid, "progress", "main");
  try {
    await setDoc(userDocRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    localStorage.setItem(`pending_progress_${uid}`, JSON.stringify(data));
  }
};

export const loadProgress = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  const uid = user.uid;

  const localData = localStorage.getItem(`progress_${uid}`);
  const parsedLocal = localData ? JSON.parse(localData) : null;

  try {
    const userDocRef = doc(db, "users", uid, "progress", "main");
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const serverData = docSnap.data();
      localStorage.setItem(`progress_${uid}`, JSON.stringify(serverData));
      return serverData;
    } else {
      // Initialization for New User
      const defaultData = {
        physics: 0,
        chemistry: 0,
        biology: 0,
        tasks: [],
        streak: { streak: 0, lastDate: null },
        createdAt: serverTimestamp()
      };
      await setDoc(userDocRef, defaultData);
      localStorage.setItem(`progress_${uid}`, JSON.stringify(defaultData));
      return defaultData;
    }
  } catch (error) {
    return parsedLocal;
  }
};

// Generic isolated sync functions for main doc pattern
export const saveData = async (feature, data) => {
  const user = auth.currentUser;
  if (!user) return;
  const uid = user.uid;
  localStorage.setItem(`${feature}_${uid}`, JSON.stringify(data));

  const userDocRef = doc(db, "users", uid, feature, "main");
  try {
    await setDoc(userDocRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    localStorage.setItem(`pending_${feature}_${uid}`, JSON.stringify(data));
  }
};

export const loadData = async (feature, defaultData = {}) => {
  const user = auth.currentUser;
  if (!user) return null;
  const uid = user.uid;
  const localData = localStorage.getItem(`${feature}_${uid}`);
  const parsedLocal = localData ? JSON.parse(localData) : null;

  try {
    const userDocRef = doc(db, "users", uid, feature, "main");
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const serverData = docSnap.data();
      localStorage.setItem(`${feature}_${uid}`, JSON.stringify(serverData));
      return serverData;
    } else {
      // Initialize if empty
      const initial = { ...defaultData, createdAt: serverTimestamp() };
      await setDoc(userDocRef, initial);
      localStorage.setItem(`${feature}_${uid}`, JSON.stringify(initial));
      return initial;
    }
  } catch (e) {
    return parsedLocal;
  }
};

export const saveUserDoc = async (subpath, data) => {
  const user = auth.currentUser;
  if (!user) return;
  const userDocRef = doc(db, "users", user.uid, ...subpath);
  await setDoc(userDocRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const getUserDoc = async (subpath) => {
  const user = auth.currentUser;
  if (!user) return null;
  const userDocRef = doc(db, "users", user.uid, ...subpath);
  const docSnap = await getDoc(userDocRef);
  return docSnap.exists() ? docSnap.data() : null;
};
