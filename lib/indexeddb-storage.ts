/**
 * IndexedDB Storage Adapter for Zustand
 * Supports storage of more than 100MB (IndexedDB can store several GB)
 */

const DB_NAME = 'vitea-storage'
const STORE_NAME = 'app-state'
const DB_VERSION = 1

interface StorageAdapter {
  getItem: (name: string) => Promise<string | null>
  setItem: (name: string, value: string) => Promise<void>
  removeItem: (name: string) => Promise<void>
}

let dbInstance: IDBDatabase | null = null
let initPromise: Promise<IDBDatabase> | null = null

function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance)
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error)
      initPromise = null
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })

  return initPromise
}

function getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
  return initDB().then((db) => {
    const transaction = db.transaction([STORE_NAME], mode)
    return transaction.objectStore(STORE_NAME)
  })
}

export const indexedDBStorage: StorageAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const store = await getStore('readonly')
      return new Promise((resolve, reject) => {
        const request = store.get(name)
        request.onsuccess = () => {
          resolve(request.result || null)
        }
        request.onerror = () => {
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('IndexedDB getItem error:', error)
      return null
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const store = await getStore('readwrite')
      return new Promise((resolve, reject) => {
        const request = store.put(value, name)
        request.onsuccess = () => {
          resolve()
        }
        request.onerror = () => {
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('IndexedDB setItem error:', error)
      throw error
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      const store = await getStore('readwrite')
      return new Promise((resolve, reject) => {
        const request = store.delete(name)
        request.onsuccess = () => {
          resolve()
        }
        request.onerror = () => {
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('IndexedDB removeItem error:', error)
      throw error
    }
  },
}

// Migrate data from localStorage to IndexedDB
async function migrateFromLocalStorage(name: string): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const localValue = localStorage.getItem(name)
    if (localValue) {
      // Check if already migrated
      const existing = await indexedDBStorage.getItem(name)
      if (!existing) {
        // Migrate to IndexedDB
        await indexedDBStorage.setItem(name, localValue)
        console.log(`Migrated ${name} from localStorage to IndexedDB`)
        // Optionally remove from localStorage after migration
        // localStorage.removeItem(name)
      }
    }
  } catch (error) {
    console.error('Migration error:', error)
  }
}

// Create IndexedDB storage adapter for Zustand
// Zustand persist v4 supports async storage
// Note: Zustand persist expects getItem to return the parsed object, not a string
export function createIndexedDBStorage() {
  // Initialize DB on first use
  let dbReady = initDB().catch(() => null)
  let migrationDone = false

  return {
    getItem: async (name: string): Promise<any> => {
      try {
        await dbReady
        
        // Migrate from localStorage on first access
        if (!migrationDone && typeof window !== 'undefined') {
          await migrateFromLocalStorage(name)
          migrationDone = true
        }
        
        const value = await indexedDBStorage.getItem(name)
        return value ? JSON.parse(value) : null
      } catch (error) {
        console.error('IndexedDB getItem error:', error)
        return null
      }
    },
    setItem: async (name: string, value: any): Promise<void> => {
      try {
        await dbReady
        // Zustand persist passes the value as an object, we need to stringify it
        await indexedDBStorage.setItem(name, JSON.stringify(value))
      } catch (error) {
        console.error('IndexedDB setItem error:', error)
        throw error
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        await dbReady
        await indexedDBStorage.removeItem(name)
      } catch (error) {
        console.error('IndexedDB removeItem error:', error)
        throw error
      }
    },
  }
}

