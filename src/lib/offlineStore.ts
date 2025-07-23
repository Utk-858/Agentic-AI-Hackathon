import { openDB } from 'idb';

const DB_NAME = 'chalkboard-scanner-db';
const STORE_NAME = 'scans';

export interface OfflineScan {
  id: number;
  text: string;
  createdAt: number;
}

export async function saveScan(text: string): Promise<void> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });

  const scan: OfflineScan = {
    id: Date.now(),
    text,
    createdAt: Date.now(),
  };

  await db.add(STORE_NAME, scan);
}

export async function getAllScans(): Promise<OfflineScan[]> {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });

  return await db.getAll(STORE_NAME);
}

export async function deleteScan(id: number) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });

  await db.delete(STORE_NAME, id);
}

export async function clearScans() {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });

  await db.clear(STORE_NAME);
}
