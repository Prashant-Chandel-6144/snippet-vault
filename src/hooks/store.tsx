import React, { createContext, useContext, useState, useCallback } from 'react';
import { getAllSnippets, getAllLanguages, getAllTags } from '@/db';

export interface Snippet {
  id: number;
  title: string;
  code: string;
  isFavorite: number;
  language_id: number | null;
  createdAt: string;
  updatedAt: string;
  tags?: { id: number; title: string }[];
}

export interface Language {
  id: number;
  title: string;
}

export interface Tag {
  id: number;
  title: string;
}

interface SnippetStoreContextProps {
  snippets: Snippet[];
  languages: Language[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  setSnippets: React.Dispatch<React.SetStateAction<Snippet[]>>;
}

const SnippetStoreContext = createContext<SnippetStoreContextProps | null>(null);

export function SnippetStoreProvider({ children }: { children: React.ReactNode }) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [allSnippets, allLanguages, allTags] = await Promise.all([
        getAllSnippets(),
        getAllLanguages(),
        getAllTags()
      ]);
      setSnippets(allSnippets as Snippet[]);
      setLanguages(allLanguages as Language[]);
      setTags(allTags as Tag[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error("Failed to fetch store data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SnippetStoreContext.Provider value={{ snippets, languages, tags, loading, error, refreshData, setSnippets }}>
      {children}
    </SnippetStoreContext.Provider>
  );
}

export function useSnippetStore() {
  const context = useContext(SnippetStoreContext);
  if (!context) {
    throw new Error('useSnippetStore must be used within SnippetStoreProvider');
  }
  return context;
}
