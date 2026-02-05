import { db, auth } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const getKey = (uid) => `neet_progress_${uid}`;
const getPendingKey = (uid) => `neet_pending_sync_${uid}`;
const isOnline = () => typeof navigator !== "undefined" ? navigator.onLine : true;
const getLocal = (uid) => {
  try {
    const v = localStorage.getItem(getKey(uid));
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
const setLocal = (uid, data) => {
  try {
    localStorage.setItem(getKey(uid), JSON.stringify(data));
  } catch {}
};
const setPending = (uid, data) => {
  try {
    localStorage.setItem(getPendingKey(uid), JSON.stringify(data));
  } catch {}
};
const getPending = (uid) => {
  try {
    const v = localStorage.getItem(getPendingKey(uid));
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
const clearPending = (uid) => {
  try {
    localStorage.removeItem(getPendingKey(uid));
  } catch {}
};
const flushPendingIfOnline = async () => {
  const user = auth.currentUser;
  if (!user) return;
  if (!isOnline()) return;
  const data = getPending(user.uid);
  if (!data) return;
  const userDocRef = doc(db, "users", user.uid, "dashboard", "progress");
  try {
    await setDoc(userDocRef, data, { merge: true });
    clearPending(user.uid);
    setLocal(user.uid, data);
  } catch {}
};
if (typeof window !== "undefined" && !window.__neet_sync_setup) {
  window.__neet_sync_setup = true;
  window.addEventListener("online", () => {
    flushPendingIfOnline();
  });
}
export const saveProgress = async (data) => {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No authenticated user found while saving progress");
    return;
  }
  setLocal(user.uid, data);
  if (!isOnline()) {
    setPending(user.uid, data);
    return;
  }
  const userDocRef = doc(db, "users", user.uid, "dashboard", "progress");
  try {
    await setDoc(userDocRef, data, { merge: true });
  } catch {
    setPending(user.uid, data);
  }
};

export const loadProgress = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No authenticated user found while loading progress");
    return null;
  }
  const localData = getLocal(user.uid);
  try {
    const userDocRef = doc(db, "users", user.uid, "dashboard", "progress");
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const serverData = docSnap.data();
      setLocal(user.uid, serverData);
      return serverData;
    }
  } catch (error) {
    if (error.code === "unavailable" || (error.message && error.message.includes("offline"))) {
      return localData;
    }
    console.error("Error loading progress:", error);
  }
  return localData;
};
