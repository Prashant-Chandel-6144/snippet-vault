import { File } from 'expo-file-system';
import { getDb } from "./client";

export interface FileItem {
  id: number;
  snippet_id: number | null;
  file_name: string;
  file_uri: string;
  file_size: number | null;
  file_type: 'screenshot' | 'code_file' | 'template';
  createdAt: string;
  updatedAt: string;
}

export async function getFilesByType(type: 'screenshot' | 'code_file' | 'template'): Promise<FileItem[]> {
  try {
    const db = await getDb();
    return await db.getAllAsync<FileItem>(`SELECT * FROM files WHERE file_type = ?`, [type]);
  } catch (error) {
    console.error("Database error in getFilesByType:", error);
    throw new Error("Failed to retrieve files by type: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function createFile(input: {
  fileName: string;
  fileUri: string;
  fileSize?: number;
  fileType: 'screenshot' | 'code_file' | 'template';
  snippetId?: number | null;
}): Promise<number> {
  try {
    const db = await getDb();
    const result = await db.runAsync(
      `INSERT INTO files (snippet_id, file_name, file_uri, file_size, file_type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.snippetId ?? null,
        input.fileName,
        input.fileUri,
        input.fileSize ?? null,
        input.fileType,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Database error in createFile:", error);
    throw new Error("Failed to store file: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function getFilesForSnippet(id: number): Promise<FileItem[]> {
  try {
    const db = await getDb();
    return await db.getAllAsync<FileItem>(`SELECT * FROM files WHERE snippet_id = ?`, [id]);
  } catch (error) {
    console.error("Database error in getFilesForSnippet:", error);
    throw new Error("Failed to retrieve files for snippet: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function deleteFile(id: number): Promise<void> {
  try {
    const db = await getDb();
    // Retrieve the file URI first to delete it from physical storage
    const file = await db.getFirstAsync<{ file_uri: string }>(
      `SELECT file_uri FROM files WHERE id = ?`,
      [id]
    );

    await db.runAsync(`DELETE FROM files WHERE id = ?`, [id]);

    if (file?.file_uri) {
      try {
        const f = new File(file.file_uri);
        if (f.exists) {
          f.delete();
        }
      } catch (fsErr) {
        console.warn(`Failed to delete physical file: ${file.file_uri}`, fsErr);
      }
    }
  } catch (error) {
    console.error("Database error in deleteFile:", error);
    throw new Error("Failed to delete file: " + (error instanceof Error ? error.message : String(error)));
  }
}

