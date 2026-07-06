export const SCHEMA = `

CREATE TABLE IF NOT EXISTS language (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS snippets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  isFavorite INTEGER NOT NULL DEFAULT 0,
  language_id INTEGER REFERENCES language(id) ON DELETE SET NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS snippet_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snippet_id INTEGER NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE (snippet_id, tag_id)
);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snippet_id INTEGER REFERENCES snippets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT NOT NULL DEFAULT 'code_file' CHECK (file_type IN ('screenshot', 'code_file', 'template')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_explanation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snippet_id INTEGER NOT NULL UNIQUE REFERENCES snippets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snippets_favorite ON snippets(isFavorite);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language_id);
CREATE INDEX IF NOT EXISTS idx_files_snippet ON files(snippet_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_snippet_tags_snippet ON snippet_tags(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_tags_tag ON snippet_tags(tag_id);
`;