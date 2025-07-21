const storagePrefix = '__dootask_ai__';

export const storage = {
  getItem: (key: string) => {
    return localStorage.getItem(storagePrefix + key);
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(storagePrefix + key, value);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(storagePrefix + key);
  },
};
