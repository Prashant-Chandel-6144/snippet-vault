import { getDb } from "./client";

export interface TagItem {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export async function getAllTags(): Promise<TagItem[]> {
  try {
    const db = await getDb();
    return await db.getAllAsync<TagItem>(`SELECT * FROM tags`);
  } catch (error) {
    console.error("Database error in getAllTags:", error);
    throw new Error("Failed to retrieve tags: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function createTag(input: { title: string }): Promise<number> {
  try {
    const db = await getDb();
    const result = await db.runAsync(
      `INSERT INTO tags (title, createdAt, updatedAt) VALUES (?, ?, ?)`,
      [input.title, new Date().toISOString(), new Date().toISOString()]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Database error in createTag:", error);
    throw new Error("Failed to create tag: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function deleteTag(id: number): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(`DELETE FROM tags WHERE id = ?`, [id]);
  } catch (error) {
    console.error("Database error in deleteTag:", error);
    throw new Error("Failed to delete tag: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function linkTagToSnippet(tagId: number, snippetId: number): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR IGNORE INTO snippet_tags (tag_id, snippet_id, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
      [tagId, snippetId, new Date().toISOString(), new Date().toISOString()]
    );
  } catch (error) {
    console.error("Database error in linkTagToSnippet:", error);
    throw new Error("Failed to link tag to snippet: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function unlinkTagFromSnippet(tagId: number, snippetId: number): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(`DELETE FROM snippet_tags WHERE tag_id = ? AND snippet_id = ?`, [tagId, snippetId]);
  } catch (error) {
    console.error("Database error in unlinkTagFromSnippet:", error);
    throw new Error("Failed to unlink tag from snippet: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function getTagsForSnippet(snippetId: number): Promise<TagItem[]> {
  try {
    const db = await getDb();
    return await db.getAllAsync<TagItem>(
      `SELECT t.* FROM tags t INNER JOIN snippet_tags st ON t.id = st.tag_id WHERE st.snippet_id = ?`,
      [snippetId]
    );
  } catch (error) {
    console.error("Database error in getTagsForSnippet:", error);
    throw new Error("Failed to retrieve tags for snippet: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function setTagsForSnippet(snippetId: number, tagIds: number[]): Promise<void> {
  try {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM snippet_tags WHERE snippet_id = ?`, [snippetId]);
      for (const tagId of tagIds) {
        await db.runAsync(
          `INSERT INTO snippet_tags (tag_id, snippet_id, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
          [tagId, snippetId, new Date().toISOString(), new Date().toISOString()]
        );
      }
    });
  } catch (error) {
    console.error("Database error in setTagsForSnippet:", error);
    throw new Error("Failed to set tags for snippet: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function updateTag(input: { id: number; title: string }): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `UPDATE tags SET title = ?, updatedAt = ? WHERE id = ?`,
      [input.title, new Date().toISOString(), input.id]
    );
  } catch (error) {
    console.error("Database error in updateTag:", error);
    throw new Error("Failed to update tag: " + (error instanceof Error ? error.message : String(error)));
  }
}