export const DB_NAME = 'LookbookCacheDB';
export const DB_VERSION = 4; // Incremented version for new store
export const STORE_NAME = 'images';
export const SETTINGS_STORE_NAME = 'settings';
export const RATE_LIMIT_STORE_NAME = 'rate_limits';
export const HISTORY_STORE_NAME = 'image_history';

export async function hashString(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(RATE_LIMIT_STORE_NAME)) {
        db.createObjectStore(RATE_LIMIT_STORE_NAME, { keyPath: 'model' });
      }
      if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
        db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'slotId' });
      }
    };
  });
}

export interface ImageHistoryEntry {
  id: string;
  url: string;
  model: string;
  prompt: string;
  timestamp: number;
}

export async function getImageHistory(slotId: string): Promise<ImageHistoryEntry[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE_NAME, 'readonly');
      const store = transaction.objectStore(HISTORY_STORE_NAME);
      const request = store.get(slotId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.history || []);
        } else {
          resolve([]);
        }
      };
    });
  } catch (error) {
    console.error("Failed to get image history:", error);
    return [];
  }
}

export async function addImageToHistory(slotId: string, entry: ImageHistoryEntry): Promise<void> {
  try {
    const db = await initDB();
    const history = await getImageHistory(slotId);
    
    // Check if entry with this ID already exists to avoid duplicates
    const existingIndex = history.findIndex(h => h.id === entry.id);
    if (existingIndex >= 0) {
      history[existingIndex] = entry; // Update existing
    } else {
      history.unshift(entry); // Add to beginning
    }
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE_NAME);
      const request = store.put({ slotId, history });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to add image to history:", error);
  }
}

export async function deleteImageFromHistory(slotId: string, entryId: string): Promise<void> {
  try {
    const db = await initDB();
    const history = await getImageHistory(slotId);
    const newHistory = history.filter(h => h.id !== entryId);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE_NAME);
      const request = store.put({ slotId, history: newHistory });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to delete image from history:", error);
  }
}

export async function markModelRateLimited(model: string): Promise<void> {
  try {
    const db = await initDB();
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes from now
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(RATE_LIMIT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(RATE_LIMIT_STORE_NAME);
      const request = store.put({ model, expiresAt });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to mark model as rate limited:", error);
  }
}

export async function isModelRateLimited(model: string): Promise<boolean> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(RATE_LIMIT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(RATE_LIMIT_STORE_NAME);
      const request = store.get(model);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          const { expiresAt } = request.result;
          if (Date.now() < expiresAt) {
            resolve(true);
          } else {
            // Expired, clean it up
            const deleteTx = db.transaction(RATE_LIMIT_STORE_NAME, 'readwrite');
            deleteTx.objectStore(RATE_LIMIT_STORE_NAME).delete(model);
            resolve(false);
          }
        } else {
          resolve(false);
        }
      };
    });
  } catch (error) {
    console.error("Failed to check model rate limit:", error);
    return false;
  }
}

export async function getCachedSetting<T>(id: string): Promise<T | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE_NAME, 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error("Failed to get cached setting:", error);
    return null;
  }
}

export async function setCachedSetting<T>(id: string, data: T): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE_NAME);
      const request = store.put({ id, data });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to cache setting:", error);
  }
}

export async function getCachedImage(id: string): Promise<{ url: string, model: string } | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error("Failed to get cached image:", error);
    return null;
  }
}

export async function setCachedImage(id: string, data: { url: string, model: string }): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id, data });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to cache image:", error);
  }
}
