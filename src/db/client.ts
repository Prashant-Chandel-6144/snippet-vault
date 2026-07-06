import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { SCHEMA } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS === 'web') {
    // Return a safe mock interface for web to prevent native crashes
    return Promise.resolve({
      execAsync: async () => {},
      runAsync: async () => ({ lastInsertRowId: 0, changes: 0 }),
      getFirstAsync: async () => null,
      getAllAsync: async () => [],
      withTransactionAsync: async (cb: () => Promise<void>) => {
        await cb();
      },
    } as unknown as SQLite.SQLiteDatabase);
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync('snippet_vault.db');
        await db.execAsync(`
          PRAGMA journal_mode = WAL;
          PRAGMA foreign_keys = ON;
        `);
        await db.execAsync(SCHEMA);
        return db;
      } catch (error) {
        dbPromise = null; // Reset promise so subsequent requests can try to initialize again
        console.error('Failed to initialize database client:', error);
        throw error;
      }
    })();
  }
  return dbPromise;
}