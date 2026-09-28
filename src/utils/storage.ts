import { AudioTrack } from '../types';

const DB_NAME = 'voxify_local_storage_db';
const DB_VERSION = 1;
const STORE_NAME = 'mp3_tracks';

/**
 * Open or upgrade the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('voice', 'voice', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an AudioTrack with its MP3 Blob to IndexedDB
 */
export async function saveTrackToStorage(track: AudioTrack): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // IndexedDB can directly store Blobs
    const record = {
      ...track,
      // Remove temporary object URL before serializing
      audioUrl: '',
    };

    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve all saved tracks from IndexedDB, generating fresh object URLs for playback
 */
export async function getAllTracksFromStorage(): Promise<AudioTrack[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const records = req.result as (AudioTrack & { audioBlob: Blob })[];
      // Sort newest first
      records.sort((a, b) => b.createdAt - a.createdAt);

      const tracks: AudioTrack[] = records.map((item) => ({
        ...item,
        audioUrl: URL.createObjectURL(item.audioBlob),
      }));

      resolve(tracks);
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a track from storage
 */
export async function deleteTrackFromStorage(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all tracks from storage
 */
export async function clearAllTracksFromStorage(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Update track title or details in storage
 */
export async function updateTrackInStorage(id: string, updates: Partial<AudioTrack>): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) return reject(new Error('Track not found'));

      const updatedRecord = { ...record, ...updates, audioUrl: '' };
      const putReq = store.put(updatedRecord);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Calculate total storage size in bytes used by all saved MP3 files
 */
export async function getTotalStorageUsage(): Promise<{ totalBytes: number; count: number }> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = req.result as AudioTrack[];
        const totalBytes = records.reduce((acc, curr) => acc + (curr.size || 0), 0);
        resolve({ totalBytes, count: records.length });
      };

      req.onerror = () => reject(req.error);
    });
  } catch {
    return { totalBytes: 0, count: 0 };
  }
}

/**
 * Trigger native browser file download to local disk
 */
export function downloadMp3File(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename.endsWith('.mp3') ? filename : `${filename}.mp3`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}
