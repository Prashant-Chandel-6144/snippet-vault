import { getDb } from "./client";

export interface LanguageItem {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export async function getAllLanguages(): Promise<LanguageItem[]> {
  try {
    const db = await getDb();
    return await db.getAllAsync<LanguageItem>(`SELECT * FROM language`);
  } catch (error) {
    console.error("Database error in getAllLanguages:", error);
    throw new Error("Failed to retrieve languages: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function createLanguage(input: { title: string }): Promise<number> {
  try {
    const db = await getDb();
    const result = await db.runAsync(
      `INSERT INTO language (title, createdAt, updatedAt) VALUES (?, ?, ?)`,
      [input.title, new Date().toISOString(), new Date().toISOString()]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Database error in createLanguage:", error);
    throw new Error("Failed to create language: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function getLanguageForSnippet(snippetId: number): Promise<LanguageItem | null> {
  try {
    const db = await getDb();
    return await db.getFirstAsync<LanguageItem>(
      `SELECT l.* FROM language l INNER JOIN snippets s ON l.id = s.language_id WHERE s.id = ?`,
      [snippetId]
    );
  } catch (error) {
    console.error("Database error in getLanguageForSnippet:", error);
    throw new Error("Failed to retrieve language for snippet: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function updateLanguage(input: { id: number; title: string }): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `UPDATE language SET title = ?, updatedAt = ? WHERE id = ?`,
      [input.title, new Date().toISOString(), input.id]
    );
  } catch (error) {
    console.error("Database error in updateLanguage:", error);
    throw new Error("Failed to update language: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function deleteLanguage(id: number): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(`DELETE FROM language WHERE id = ?`, [id]);
  } catch (error) {
    console.error("Database error in deleteLanguage:", error);
    throw new Error("Failed to delete language: " + (error instanceof Error ? error.message : String(error)));
  }
}

