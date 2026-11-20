import { openDB, type IDBPDatabase } from 'idb';
import type {
  JerseyDesignState,
  SerializedJerseyProject,
  UploadedAsset,
} from '../types/design';
import { brandConfig } from '../config/brandConfig';

const DB_NAME = 'kitforge-3d-db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const ACTIVE_KEY = 'active-project';

interface StoredRecord {
  design: JerseyDesignState;
  assets: UploadedAsset[];
  updatedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveActiveProjectToDB(
  design: JerseyDesignState,
  assets: UploadedAsset[],
): Promise<void> {
  const db = await getDb();
  const payload: StoredRecord = {
    design,
    assets,
    updatedAt: Date.now(),
  };
  await db.put(STORE_NAME, payload, ACTIVE_KEY);
}

export async function loadActiveProjectFromDB(): Promise<StoredRecord | null> {
  try {
    const db = await getDb();
    const record = (await db.get(STORE_NAME, ACTIVE_KEY)) as
      | StoredRecord
      | undefined;
    return record ?? null;
  } catch {
    return null;
  }
}

export function exportProjectJsonFile(
  design: JerseyDesignState,
  assets: UploadedAsset[],
): void {
  const payload: SerializedJerseyProject = {
    version: 1,
    exportedAt: new Date().toISOString(),
    brand: brandConfig.appName,
    design,
    assets,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const safeName = (design.projectName || 'jersey-design')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '_');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.jersey.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function parseProjectJsonFile(
  file: File,
): Promise<SerializedJerseyProject> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<SerializedJerseyProject>;
  if (!parsed || !parsed.design || !parsed.design.panels) {
    throw new Error('Invalid .jersey.json file structure');
  }
  return {
    version: 1,
    exportedAt: parsed.exportedAt ?? new Date().toISOString(),
    brand: parsed.brand ?? brandConfig.appName,
    design: parsed.design,
    assets: Array.isArray(parsed.assets) ? parsed.assets : [],
  };
}
