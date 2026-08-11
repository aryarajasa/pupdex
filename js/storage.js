// Storage Manager for PupDex (IndexedDB + LocalStorage fallback)
class PupDexStorage {
  constructor() {
    this.dbName = 'PupDexDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('dogs')) {
          const dogStore = db.createObjectStore('dogs', { keyPath: 'id' });
          dogStore.createIndex('timestamp', 'timestamp', { unique: false });
          dogStore.createIndex('rarity', 'rarity', { unique: false });
          dogStore.createIndex('comboKey', 'comboKey', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(true);
      };

      request.onerror = (event) => {
        console.error('IndexedDB init error:', event.target.error);
        resolve(false);
      };
    });
  }

  async saveDog(dogData) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(['dogs'], 'readwrite');
        const store = transaction.objectStore('dogs');
        const request = store.add(dogData);

        request.onsuccess = () => resolve(dogData);
        request.onerror = (e) => reject(e.target.error);
      } catch (err) {
        console.error('Save dog failed:', err);
        // LocalStorage fallback for lightweight emergency save
        const existing = this.getDogsLocalStorage();
        existing.unshift(dogData);
        localStorage.setItem('PupDex_dogs_fallback', JSON.stringify(existing));
        resolve(dogData);
      }
    });
  }

  async getAllDogs() {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['dogs'], 'readonly');
        const store = transaction.objectStore('dogs');
        const index = store.index('timestamp');
        const request = index.getAll();

        request.onsuccess = () => {
          let dogs = request.result || [];
          // Sort newest first
          dogs.sort((a, b) => b.timestamp - a.timestamp);
          resolve(dogs);
        };
        request.onerror = () => {
          resolve(this.getDogsLocalStorage());
        };
      } catch (err) {
        resolve(this.getDogsLocalStorage());
      }
    });
  }

  async deleteDog(id) {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['dogs'], 'readwrite');
        const store = transaction.objectStore('dogs');
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }

  getDogsLocalStorage() {
    try {
      return JSON.parse(localStorage.getItem('PupDex_dogs_fallback')) || [];
    } catch (e) {
      return [];
    }
  }

  // Stats, Trainer Profile, and Badges in LocalStorage
  getProfile() {
    const defaultProfile = {
      username: 'Good Boi Trainer',
      xp: 0,
      level: 1,
      streak: 0,
      lastCatchDate: null,
      badgesUnlocked: [],
      matrixUnlocked: [] // Combos unlocked like 'potato-friendly', etc.
    };
    try {
      const data = localStorage.getItem('PupDex_profile');
      return data ? { ...defaultProfile, ...JSON.parse(data) } : defaultProfile;
    } catch (e) {
      return defaultProfile;
    }
  }

  saveProfile(profile) {
    try {
      localStorage.setItem('PupDex_profile', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  }

  async exportDataJSON() {
    const dogs = await this.getAllDogs();
    const profile = this.getProfile();
    const payload = {
      version: 1,
      exportDate: new Date().toISOString(),
      profile,
      dogs
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PupDex-Backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importDataJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) {
        this.saveProfile(data.profile);
      }
      if (Array.isArray(data.dogs)) {
        for (const dog of data.dogs) {
          await this.saveDog(dog);
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to import JSON:', e);
      return false;
    }
  }
}

window.PupDexStorage = new PupDexStorage();
