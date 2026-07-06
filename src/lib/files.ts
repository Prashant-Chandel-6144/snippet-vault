import { Paths, File, Directory } from "expo-file-system";
import { getDb } from "@/db/client";
import { createFile, deleteFile as deleteDbFile } from "@/db/files";

const BASE_DIR = new Directory(Paths.document, "snippets");
const SCREENSHOTS_DIR = new Directory(BASE_DIR, "screenshots");
const CODE_DIR = new Directory(BASE_DIR, "code");
const TEMPLATES_DIR = new Directory(BASE_DIR, "templates");

// Ensure directories exist
export async function ensureDirsExist() {
  const dirs = [BASE_DIR, SCREENSHOTS_DIR, CODE_DIR, TEMPLATES_DIR];
  for (const dir of dirs) {
    try {
      if (!dir.exists) {
        await dir.createAsync();
      }
    } catch (error) {
      console.error(`Error ensuring directory exists (${dir.uri}):`, error);
    }
  }
}

// Get helper for dir paths based on type
function getDirectoryForType(type: 'screenshot' | 'code_file' | 'template'): Directory {
  if (type === 'screenshot') return SCREENSHOTS_DIR;
  if (type === 'template') return TEMPLATES_DIR;
  return CODE_DIR;
}

// Extract extension from URI
function getExtension(uri: string, defaultExt: string = "txt"): string {
  const parts = uri.split('.');
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    return lastPart.split('?')[0].split('#')[0].toLowerCase();
  }
  return defaultExt;
}

// Save screenshot to local storage
export async function saveScreenshot(snippetId: number, originalUri: string) {
  try {
    await ensureDirsExist();
    const ext = getExtension(originalUri, 'jpg');
    const fileName = `screenshot_${Date.now()}.${ext}`;
    const destFile = new File(SCREENSHOTS_DIR, fileName);
    
    // Copy file physically using the async File API
    const sourceFile = new File(originalUri);
    await sourceFile.copyAsync(destFile);

    const size = destFile.size;

    // Save database record
    const id = await createFile({
      fileName,
      fileUri: destFile.uri,
      fileSize: size > 0 ? size : undefined,
      fileType: 'screenshot',
      snippetId,
    });

    return { id, fileUri: destFile.uri };
  } catch (error) {
    console.error("Error saving screenshot physically:", error);
    throw new Error("Failed to save screenshot: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Save code file locally
export async function saveCodeFile(snippetId: number, title: string, code: string, extension: string) {
  try {
    await ensureDirsExist();
    // Sanitize title for filename
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedTitle}_${Date.now()}.${extension}`;
    const destFile = new File(CODE_DIR, fileName);

    // Write file physically using the async File API
    if (!destFile.exists) {
      await destFile.createAsync();
    }
    await destFile.writeAsync(code);

    const size = destFile.size;

    // Save database record
    const id = await createFile({
      fileName,
      fileUri: destFile.uri,
      fileSize: size > 0 ? size : undefined,
      fileType: 'code_file',
      snippetId,
    });

    return { id, fileUri: destFile.uri };
  } catch (error) {
    console.error("Error saving code file physically:", error);
    throw new Error("Failed to save code file: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Download template locally
export async function downloadTemplate(name: string, url: string) {
  try {
    await ensureDirsExist();
    const ext = getExtension(url, 'js');
    const fileName = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
    const destFile = new File(TEMPLATES_DIR, fileName);

    // Download file using static File API
    const downloadedFile = await File.downloadFileAsync(url, destFile, { idempotent: true });

    // Save database record
    const id = await createFile({
      fileName,
      fileUri: downloadedFile.uri,
      fileSize: downloadedFile.size > 0 ? downloadedFile.size : undefined,
      fileType: 'template',
      snippetId: null,
    });

    return { id, fileUri: downloadedFile.uri };
  } catch (error) {
    console.error("Error downloading template:", error);
    throw new Error("Failed to download template: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Move or Copy file physically and update SQLite DB
export async function moveOrCopyFile(fileId: number, currentUri: string, fileName: string, targetType: 'screenshot' | 'code_file' | 'template', action: 'move' | 'copy') {
  try {
    await ensureDirsExist();
    const targetDir = getDirectoryForType(targetType);
    const destFile = new File(targetDir, fileName);
    const currentFile = new File(currentUri);

    if (action === 'move') {
      await currentFile.moveAsync(destFile);
    } else {
      await currentFile.copyAsync(destFile);
    }

    const size = destFile.size;
    const db = await getDb();
    if (action === 'move') {
      // Update existing record
      await db.runAsync(
        `UPDATE files SET file_uri = ?, file_type = ?, file_size = ?, updatedAt = ? WHERE id = ?`,
        [destFile.uri, targetType, size > 0 ? size : null, new Date().toISOString(), fileId]
      );
      return { id: fileId, fileUri: destFile.uri };
    } else {
      // Get the existing snippet_id if there was one mapped to copy it over
      const originalRecord = await db.getFirstAsync<{ snippet_id: number | null }>(
        `SELECT snippet_id FROM files WHERE id = ?`,
        [fileId]
      );

      // Insert new record as copy
      const newId = await createFile({
        fileName: `copy_${fileName}`,
        fileUri: destFile.uri,
        fileSize: size > 0 ? size : undefined,
        fileType: targetType,
        snippetId: originalRecord?.snippet_id ?? null
      });
      return { id: newId, fileUri: destFile.uri };
    }
  } catch (error) {
    console.error("Error moving or copying file:", error);
    throw new Error(`Failed to ${action} file: ` + (error instanceof Error ? error.message : String(error)));
  }
}

// Delete file physically and from SQLite DB
export async function deleteLocalFile(fileId: number) {
  // Rely on database file delete which cleans physical file too
  await deleteDbFile(fileId);
}

// Save any picked file locally and map to DB
export async function saveAttachedFile(snippetId: number, originalUri: string, originalName: string) {
  try {
    await ensureDirsExist();
    const ext = getExtension(originalName, 'txt');
    // Sanitize name
    const baseName = originalName.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${baseName}_${Date.now()}.${ext}`;
    const destFile = new File(CODE_DIR, fileName);

    const sourceFile = new File(originalUri);
    await sourceFile.copyAsync(destFile);

    const size = destFile.size;

    const id = await createFile({
      fileName: originalName,
      fileUri: destFile.uri,
      fileSize: size > 0 ? size : undefined,
      fileType: 'code_file',
      snippetId,
    });

    return { id, fileUri: destFile.uri };
  } catch (error) {
    console.error("Error saving attached file physically:", error);
    throw new Error("Failed to save attached file: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Read and return details of a local file
export async function readLocalFile(fileUri: string): Promise<string> {
  try {
    const file = new File(fileUri);
    if (!file.exists) {
      throw new Error("File does not exist on disk");
    }
    return await file.textAsync();
  } catch (error) {
    console.error("Error reading local file:", error);
    throw new Error("Failed to read file: " + (error instanceof Error ? error.message : String(error)));
  }
}