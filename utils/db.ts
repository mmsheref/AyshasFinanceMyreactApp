
import { DailyRecord, CustomExpenseStructure, GasLog } from '../types';

const DB_NAME = 'AyshasPnlDB';
const DB_VERSION = 3; // Incremented for Gas Logs
const RECORDS_STORE = 'records';
const STRUCTURE_STORE = 'customStructure';
const SETTINGS_STORE = 'settings';
const GAS_LOGS_STORE = 'gasLogs';

let db: IDBDatabase;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(RECORDS_STORE)) {
        dbInstance.createObjectStore(RECORDS_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(STRUCTURE_STORE)) {
        dbInstance.createObjectStore(STRUCTURE_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(SETTINGS_STORE)) {
        dbInstance.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(GAS_LOGS_STORE)) {
        dbInstance.createObjectStore(GAS_LOGS_STORE, { keyPath: 'id' });
      }
      // Migration from v3 -> v2: Remove the amortizedExpenses store if it exists
      if (dbInstance.objectStoreNames.contains('amortizedExpenses')) {
        dbInstance.deleteObjectStore('amortizedExpenses');
      }
    };
  });
};

// --- Records CRUD ---

export const getAllRecords = async (): Promise<DailyRecord[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(RECORDS_STORE, 'readonly');
        const store = transaction.objectStore(RECORDS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result as DailyRecord[]);
        };
        request.onerror = () => {
            console.error('Error fetching all records:', request.error);
            reject(request.error);
        };
    });
};

export const saveRecord = async (record: DailyRecord): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(RECORDS_STORE, 'readwrite');
        const store = transaction.objectStore(RECORDS_STORE);
        const request = store.put(record);

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            console.error('Error saving record:', request.error);
            reject(request.error);
        };
    });
};

export const deleteRecord = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(RECORDS_STORE, 'readwrite');
        const store = transaction.objectStore(RECORDS_STORE);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            console.error('Error deleting record:', request.error);
            reject(request.error);
        };
    });
};

export const bulkAddRecords = async (records: DailyRecord[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(RECORDS_STORE, 'readwrite');
        const store = transaction.objectStore(RECORDS_STORE);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
            console.error('Error during bulk add:', transaction.error);
            reject(transaction.error);
        };

        records.forEach(record => {
            store.put(record);
        });
    });
};

export const clearRecords = async (): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(RECORDS_STORE, 'readwrite');
        const store = transaction.objectStore(RECORDS_STORE);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Error clearing records:', request.error);
            reject(request.error);
        };
    });
};


// --- Structure CRUD ---

const STRUCTURE_KEY = 'main';

export const getCustomStructure = async (): Promise<CustomExpenseStructure | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STRUCTURE_STORE, 'readonly');
        const store = transaction.objectStore(STRUCTURE_STORE);
        const request = store.get(STRUCTURE_KEY);

        request.onsuccess = () => {
            resolve(request.result ? request.result.data : null);
        };
        request.onerror = () => {
            console.error('Error getting structure:', request.error);
            reject(request.error);
        };
    });
};

export const saveCustomStructure = async (structure: CustomExpenseStructure): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STRUCTURE_STORE, 'readwrite');
        const store = transaction.objectStore(STRUCTURE_STORE);
        const request = store.put({ id: STRUCTURE_KEY, data: structure });

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            console.error('Error saving structure:', request.error);
            reject(request.error);
        };
    });
};

// --- Gas Logs CRUD ---

export const getGasLogs = async (): Promise<GasLog[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(GAS_LOGS_STORE, 'readonly');
        const store = transaction.objectStore(GAS_LOGS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result as GasLog[]);
        };
        request.onerror = () => {
            console.error('Error fetching gas logs:', request.error);
            reject(request.error);
        };
    });
};

export const saveGasLog = async (log: GasLog): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(GAS_LOGS_STORE, 'readwrite');
        const store = transaction.objectStore(GAS_LOGS_STORE);
        const request = store.put(log);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteGasLog = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(GAS_LOGS_STORE, 'readwrite');
        const store = transaction.objectStore(GAS_LOGS_STORE);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const bulkAddGasLogs = async (logs: GasLog[]): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(GAS_LOGS_STORE, 'readwrite');
        const store = transaction.objectStore(GAS_LOGS_STORE);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        logs.forEach(log => {
            store.put(log);
        });
    });
};

export const clearGasLogs = async (): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(GAS_LOGS_STORE, 'readwrite');
        const store = transaction.objectStore(GAS_LOGS_STORE);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};


// --- Settings CRUD ---
export const getSetting = async (id: string): Promise<any | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SETTINGS_STORE, 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result ? request.result.value : null);
        };
        request.onerror = () => {
            console.error(`Error getting setting "${id}":`, request.error);
            reject(request.error);
        };
    });
};

export const saveSetting = async (id: string, value: any): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.put({ id, value });

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            console.error(`Error saving setting "${id}":`, request.error);
            reject(request.error);
        };
    });
};
