import api, { getCookie } from "./api";

// Progress functions using Django UserStorage
// Note: token handling is now cookie-based via api.js helpers.
// This utility now only deals with server-side data persistence.

// Revised Progress functions using Django UserStorage
export const saveProgress = async (data) => {
  try {
    // Fetch existing data first to merge (since server overwrites with request body)
    const currentDataRes = await api.get('/user-storage/');
    const merged = { ...currentDataRes.data, progress: data };
    await api.post('/user-storage/', merged);
  } catch (e) {
    console.error("Failed to save progress to Django", e);
  }
};

export const loadProgress = async () => {
  try {
    const res = await api.get('/user-storage/');
    if (res.data && res.data.progress) {
      return res.data.progress;
    }
    return { tasks: [], streak: { streak: 0, lastDate: null } };
  } catch (e) {
    return null;
  }
};

export const saveData = async (feature, data) => {
  const token = typeof window !== 'undefined' ? getCookie('token') : null;
  if (!token) return;

  try {
    // Use PATCH to partially update the storage (server handles merging)
    await api.patch('/user-storage/', { [feature]: data });
  } catch (e) {
    if (e.response?.status !== 401) {
      console.error(`Failed to save ${feature} to Django`, e);
    }
  }
};

export const loadData = async (feature, defaultData = {}) => {
  const token = typeof window !== 'undefined' ? getCookie('token') : null;
  if (!token) return defaultData;

  try {
    const res = await api.get('/user-storage/');
    if (res.data && res.data[feature]) {
      return res.data[feature];
    }
    return defaultData;
  } catch (e) {
    return defaultData;
  }
};

export const saveUserDoc = async (subpath, data) => {
  // subpath is used as a nested key
  const key = subpath.join('_');
  await saveData(key, data);
};

export const getUserDoc = async (subpath) => {
  const key = subpath.join('_');
  return await loadData(key, null);
};
