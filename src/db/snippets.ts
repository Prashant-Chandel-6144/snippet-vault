import { File } from 'expo-file-system';
import { getDb } from './client';

interface RawSnippetFromDb {
  id: number;
  title: string;
  code: string;
  isFavorite: number;
  language_id: number | null;
  createdAt: string;
  updatedAt: string;
  tags_json?: string;
}

function mapSnippet(raw: RawSnippetFromDb) {
  let tags: { id: number; title: string }[] = [];
  if (raw.tags_json) {
    try {
      const parsed = JSON.parse(raw.tags_json);
      if (Array.isArray(parsed)) {
        tags = parsed.filter(t => t && typeof t === 'object' && t.id !== null);
      }
    } catch (e) {
      console.warn("Failed to parse tags_json:", e);
    }
  }
  const { tags_json, ...rest } = raw;
  return {
    ...rest,
    tags,
  };
}

export async function createSnippet(input: { title: string; code: string; language_id: number | null }) {
  try {
    const db = await getDb();
    const result = await db.runAsync(
      `INSERT INTO snippets (title, code, language_id, isFavorite, createdAt, updatedAt) VALUES (?, ?, ?, 0, ?, ?)`,
      [input.title, input.code, input.language_id, new Date().toISOString(), new Date().toISOString()]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Database error in createSnippet:', error);
    throw new Error('Failed to create snippet: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function updateSnippet(input: { title: string; code: string; language_id: number | null; id: number }) {
  try {
    const db = await getDb();
    await db.runAsync(
      `UPDATE snippets SET title = ?, code = ?, language_id = ?, updatedAt = ? WHERE id = ?`,
      [input.title, input.code, input.language_id, new Date().toISOString(), input.id]
    );
  } catch (error) {
    console.error('Database error in updateSnippet:', error);
    throw new Error('Failed to update snippet: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function deleteSnippet(id: number) {
  try {
    const db = await getDb();
    // Retrieve associated files first to delete them from physical storage
    const files = await db.getAllAsync<{ file_uri: string }>(
      `SELECT file_uri FROM files WHERE snippet_id = ?`,
      [id]
    );

    await db.runAsync(`DELETE FROM snippets WHERE id = ?`, [id]);

    // Clean up files from filesystem
    for (const file of files) {
      if (file.file_uri) {
        try {
          const f = new File(file.file_uri);
          if (f.exists) {
            await f.deleteAsync();
          }
        } catch (fsErr) {
          console.warn(`Failed to delete physical file: ${file.file_uri}`, fsErr);
        }
      }
    }
  } catch (error) {
    console.error('Database error in deleteSnippet:', error);
    throw new Error('Failed to delete snippet: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function getAllSnippets() {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<RawSnippetFromDb>(
      `SELECT s.*, 
        (SELECT json_group_array(json_object('id', t.id, 'title', t.title))
         FROM snippet_tags st
         INNER JOIN tags t ON st.tag_id = t.id
         WHERE st.snippet_id = s.id) as tags_json
       FROM snippets s
       ORDER BY s.updatedAt DESC`
    );
    return rows.map(mapSnippet);
  } catch (error) {
    console.error('Database error in getAllSnippets:', error);
    throw new Error('Failed to retrieve snippets: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function getSnippetById(id: number) {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<RawSnippetFromDb>(
      `SELECT s.*, 
        (SELECT json_group_array(json_object('id', t.id, 'title', t.title))
         FROM snippet_tags st
         INNER JOIN tags t ON st.tag_id = t.id
         WHERE st.snippet_id = s.id) as tags_json
       FROM snippets s
       WHERE s.id = ?`,
      [id]
    );
    return row ? mapSnippet(row) : null;
  } catch (error) {
    console.error('Database error in getSnippetById:', error);
    throw new Error('Failed to retrieve snippet: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function searchSnippets(query: string) {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<RawSnippetFromDb>(
      `SELECT s.*, 
        (SELECT json_group_array(json_object('id', t.id, 'title', t.title))
         FROM snippet_tags st
         INNER JOIN tags t ON st.tag_id = t.id
         WHERE st.snippet_id = s.id) as tags_json
       FROM snippets s
       WHERE s.title LIKE ? OR s.code LIKE ?
       ORDER BY s.updatedAt DESC`,
      [`%${query}%`, `%${query}%`]
    );
    return rows.map(mapSnippet);
  } catch (error) {
    console.error('Database error in searchSnippets:', error);
    throw new Error('Failed to search snippets: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function getFavoriteSnippets() {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<RawSnippetFromDb>(
      `SELECT s.*, 
        (SELECT json_group_array(json_object('id', t.id, 'title', t.title))
         FROM snippet_tags st
         INNER JOIN tags t ON st.tag_id = t.id
         WHERE st.snippet_id = s.id) as tags_json
       FROM snippets s
       WHERE s.isFavorite = 1
       ORDER BY s.updatedAt DESC`
    );
    return rows.map(mapSnippet);
  } catch (error) {
    console.error('Database error in getFavoriteSnippets:', error);
    throw new Error('Failed to retrieve favorite snippets: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function toggleFavoriteSnippet(id: number, isFavorite: boolean) {
  try {
    const db = await getDb();
    await db.runAsync(`UPDATE snippets SET isFavorite = ?, updatedAt = ? WHERE id = ?`, [
      isFavorite ? 1 : 0,
      new Date().toISOString(),
      id,
    ]);
  } catch (error) {
    console.error('Database error in toggleFavoriteSnippet:', error);
    throw new Error('Failed to toggle favorite status: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function getSnippetsByLanguage(languageId: number) {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<RawSnippetFromDb>(
      `SELECT s.*,
        (SELECT json_group_array(json_object('id', t.id, 'title', t.title))
         FROM snippet_tags st
         INNER JOIN tags t ON st.tag_id = t.id
         WHERE st.snippet_id = s.id) as tags_json
       FROM snippets s
       WHERE s.language_id = ?
       ORDER BY s.updatedAt DESC`,
      [languageId]
    );
    return rows.map(mapSnippet);
  } catch (error) {
    console.error('Database error in getSnippetsByLanguage:', error);
    throw new Error('Failed to retrieve snippets by language: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function getSnippetsByTag(tagId: number) {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<RawSnippetFromDb>(
      `SELECT s.*,
        (SELECT json_group_array(json_object('id', t.id, 'title', t.title))
         FROM snippet_tags st2
         INNER JOIN tags t ON st2.tag_id = t.id
         WHERE st2.snippet_id = s.id) as tags_json
       FROM snippets s
       INNER JOIN snippet_tags st ON st.snippet_id = s.id
       WHERE st.tag_id = ?
       ORDER BY s.updatedAt DESC`,
      [tagId]
    );
    return rows.map(mapSnippet);
  } catch (error) {
    console.error('Database error in getSnippetsByTag:', error);
    throw new Error('Failed to retrieve snippets by tag: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function getRecentSnippets(limit: number = 10) {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<RawSnippetFromDb>(
      `SELECT s.*,
        (SELECT json_group_array(json_object('id', t.id, 'title', t.title))
         FROM snippet_tags st
         INNER JOIN tags t ON st.tag_id = t.id
         WHERE st.snippet_id = s.id) as tags_json
       FROM snippets s
       ORDER BY s.createdAt DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map(mapSnippet);
  } catch (error) {
    console.error('Database error in getRecentSnippets:', error);
    throw new Error('Failed to retrieve recent snippets: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function getSnippetStats(): Promise<{ totalSnippets: number; totalLanguages: number; totalFiles: number; totalTags: number }> {
  try {
    const db = await getDb();
    const snippetCount = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM snippets`);
    const langCount = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(DISTINCT language_id) as count FROM snippets WHERE language_id IS NOT NULL`);
    const fileCount = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM files`);
    const tagCount = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM tags`);
    return {
      totalSnippets: snippetCount?.count ?? 0,
      totalLanguages: langCount?.count ?? 0,
      totalFiles: fileCount?.count ?? 0,
      totalTags: tagCount?.count ?? 0,
    };
  } catch (error) {
    console.error('Database error in getSnippetStats:', error);
    throw new Error('Failed to retrieve snippet stats: ' + (error instanceof Error ? error.message : String(error)));
  }
}