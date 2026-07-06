import { getDb } from "./client";

export interface AiExplanation {
  id: number;
  snippet_id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export async function getAiExplanationForSnippet(snippetId: number): Promise<AiExplanation | null> {
  try {
    const db = await getDb();
    return await db.getFirstAsync<AiExplanation>(
      `SELECT * FROM ai_explanation WHERE snippet_id = ?`,
      [snippetId]
    );
  } catch (error) {
    console.error("Database error in getAiExplanationForSnippet:", error);
    throw new Error("Failed to retrieve AI explanation: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function saveAiExplanation(snippetId: number, content: string): Promise<number> {
  try {
    const db = await getDb();
    const result = await db.runAsync(
      `INSERT OR REPLACE INTO ai_explanation (snippet_id, content, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
      [
        snippetId,
        content,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Database error in saveAiExplanation:", error);
    throw new Error("Failed to save AI explanation: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function deleteAiExplanation(snippetId: number): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(`DELETE FROM ai_explanation WHERE snippet_id = ?`, [snippetId]);
  } catch (error) {
    console.error("Database error in deleteAiExplanation:", error);
    throw new Error("Failed to delete AI explanation: " + (error instanceof Error ? error.message : String(error)));
  }
}

