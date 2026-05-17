const STORAGE_KEY = 'habit-tracker-data';

export const loadData = () =>
  new Promise((resolve) => {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || null);
      });
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      resolve(saved ? JSON.parse(saved) : null);
    }
  });

export const saveData = (data) => {
  if (window.chrome && chrome.storage) {
    chrome.storage.local.set({ [STORAGE_KEY]: data });
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};
