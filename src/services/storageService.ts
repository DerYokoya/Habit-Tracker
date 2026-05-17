interface StorageData {
  habits: Habit[];
  completions: Completions;
}

interface Habit {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface Completions {
  [habitId: string]: {
    [dateKey: string]: boolean;
  };
}

const STORAGE_KEY: string = 'habit-tracker-data';

export const loadData = (): Promise<StorageData | null> =>
  new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).chrome?.storage?.local) {
      (window as any).chrome.storage.local.get([STORAGE_KEY], (result: Record<string, any>) => {
        resolve(result[STORAGE_KEY] || null);
      });
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      resolve(saved ? JSON.parse(saved) : null);
    }
  });

export const saveData = (data: StorageData): void => {
  if (typeof window !== 'undefined' && (window as any).chrome?.storage?.local) {
    (window as any).chrome.storage.local.set({ [STORAGE_KEY]: data });
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};