import { openDB } from "idb";

const DB_NAME = "scripture-study";
const DB_VERSION = 1;

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("highlights")) {
          const hl = db.createObjectStore("highlights", { keyPath: "id" });
          hl.createIndex("byChapter", ["book", "chapter"]);
        }
        if (!db.objectStoreNames.contains("notes")) {
          const notes = db.createObjectStore("notes", { keyPath: "id" });
          notes.createIndex("byChapter", ["book", "chapter"]);
        }
        if (!db.objectStoreNames.contains("memoryVerses")) {
          db.createObjectStore("memoryVerses", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("journal")) {
          db.createObjectStore("journal", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cachedChapters")) {
          db.createObjectStore("cachedChapters", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

export async function dbGetAll(storeName) {
  const db = await getDB();
  return db.getAll(storeName);
}

export async function dbGet(storeName, key) {
  const db = await getDB();
  return db.get(storeName, key);
}

export async function dbPut(storeName, value) {
  const db = await getDB();
  return db.put(storeName, value);
}

export async function dbDelete(storeName, key) {
  const db = await getDB();
  return db.delete(storeName, key);
}

export async function dbGetByIndex(storeName, indexName, key) {
  const db = await getDB();
  return db.getAllFromIndex(storeName, indexName, key);
}

export default getDB;
