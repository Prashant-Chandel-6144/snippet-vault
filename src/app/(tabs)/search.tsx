import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
  Alert,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  searchSnippets,
  getAllSnippets,
  getAllLanguages,
  getAllTags,
  toggleFavoriteSnippet,
  deleteSnippet,
} from '@/db';
import { ThemedText } from '@/components/themed-text';
import { useSnippetStore } from '@/hooks/store';
import { ThemedView } from '@/components/themed-view';
import { SnippetCard } from '@/components/SnippetCard';
import { Spacing, Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Snippet {
  id: number;
  title: string;
  code: string;
  isFavorite: number;
  language_id: number | null;
  createdAt: string;
  updatedAt: string;
  tags?: { id: number; title: string }[];
}

interface Language {
  id: number;
  title: string;
}

interface Tag {
  id: number;
  title: string;
}

export default function SearchScreen() {
  const theme = useTheme();

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

  // Data states from global cache
  const { snippets: allSnippets, languages, tags, refreshData } = useSnippetStore();
  const [filteredSnippets, setFilteredSnippets] = useState<Snippet[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load languages and tags when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadFilters();
    }, [])
  );

  // Trigger search whenever cache, search query, or filters change
  useEffect(() => {
    performSearch();
  }, [allSnippets, searchQuery, selectedLanguageId, selectedTagId]);

  const loadFilters = async () => {
    try {
      await refreshData();
    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Perform fast, non-blocking client-side search on global cache
      let results = allSnippets;
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        results = results.filter(
          (s) => s.title.toLowerCase().includes(query) || s.code.toLowerCase().includes(query)
        );
      }

      // Filter by language client-side
      if (selectedLanguageId !== null) {
        results = results.filter((s) => s.language_id === selectedLanguageId);
      }

      // Filter by tag client-side
      if (selectedTagId !== null) {
        results = results.filter(
          (s) => s.tags && s.tags.some((t) => t.id === selectedTagId)
        );
      }

      setFilteredSnippets(results);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Search query failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (snippetId: number, isFav: number) => {
    try {
      await toggleFavoriteSnippet(snippetId, isFav === 0);
      await refreshData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Database error toggling favorite');
    }
  };

  const handleDeleteSnippet = async (snippetId: number) => {
    Alert.alert(
      'Delete Snippet',
      'Are you sure you want to delete this snippet permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSnippet(snippetId);
              await performSearch();
            } catch (err) {
              setErrorMsg(err instanceof Error ? err.message : 'Database error deleting snippet');
            }
          },
        },
      ]
    );
  };

  const getLanguageName = (langId: number | null) => {
    const lang = languages.find((l) => l.id === langId);
    return lang ? lang.title : 'Plain Text';
  };

  return (
    <ThemedView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.text,
              backgroundColor: theme.backgroundElement,
            },
          ]}
          placeholder="Search snippets by title or code..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Filters Sub-header */}
      <View style={styles.filtersSection}>
        {/* Language Selection Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollView}
          style={{ maxHeight: 40 }}
        >
          <Pressable
            onPress={() => setSelectedLanguageId(null)}
            style={[
              styles.filterPill,
              selectedLanguageId === null && {
                backgroundColor: '#0274DF',
                borderColor: '#0274DF',
              },
            ]}
          >
            <ThemedText
              style={[styles.filterText, selectedLanguageId === null && { color: '#fff' }]}
              themeColor={selectedLanguageId === null ? undefined : 'textSecondary'}
            >
              All Languages
            </ThemedText>
          </Pressable>
          {languages.map((lang) => (
            <Pressable
              key={lang.id}
              onPress={() => setSelectedLanguageId(lang.id)}
              style={[
                styles.filterPill,
                selectedLanguageId === lang.id && {
                  backgroundColor: '#0274DF',
                  borderColor: '#0274DF',
                },
              ]}
            >
              <ThemedText
                style={[styles.filterText, selectedLanguageId === lang.id && { color: '#fff' }]}
                themeColor={selectedLanguageId === lang.id ? undefined : 'textSecondary'}
              >
                {lang.title}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tag Selection Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollView}
          style={{ maxHeight: 40, marginTop: Spacing.two }}
        >
          <Pressable
            onPress={() => setSelectedTagId(null)}
            style={[
              styles.filterPill,
              selectedTagId === null && {
                backgroundColor: '#3C9FFE',
                borderColor: '#3C9FFE',
              },
            ]}
          >
            <ThemedText
              style={[styles.filterText, selectedTagId === null && { color: '#fff' }]}
              themeColor={selectedTagId === null ? undefined : 'textSecondary'}
            >
              All Tags
            </ThemedText>
          </Pressable>
          {tags.map((tag) => (
            <Pressable
              key={tag.id}
              onPress={() => setSelectedTagId(tag.id)}
              style={[
                styles.filterPill,
                selectedTagId === tag.id && {
                  backgroundColor: '#3C9FFE',
                  borderColor: '#3C9FFE',
                },
              ]}
            >
              <ThemedText
                style={[styles.filterText, selectedTagId === tag.id && { color: '#fff' }]}
                themeColor={selectedTagId === tag.id ? undefined : 'textSecondary'}
              >
                #{tag.title}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {errorMsg && (
        <View style={styles.errorContainer}>
          <ThemedText style={{ color: '#c53030' }}>{errorMsg}</ThemedText>
        </View>
      )}

      {/* Loading indicator */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0274DF" />
        </View>
      ) : (
        /* Results list */
        <FlatList
          data={filteredSnippets}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
              <ThemedText style={{ marginTop: Spacing.two }} themeColor="textSecondary">
                No snippets matches your search query or filters.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <SnippetCard
              snippet={{
                ...item,
                isFavorite: item.isFavorite === 1,
                languageTitle: getLanguageName(item.language_id)
              }}
              onToggleFavorite={() => handleToggleFavorite(item.id, item.isFavorite)}
              onDelete={() => handleDeleteSnippet(item.id)}
            />
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    borderRadius: Spacing.two,
  },
  clearBtn: {
    padding: Spacing.one,
  },
  filtersSection: {
    marginVertical: Spacing.two,
  },
  filterScrollView: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
    borderWidth: 1,
    borderColor: '#4a5568',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
  },
  listContainer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  cardTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  langPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardActionBtn: {
    padding: Spacing.one,
  },
  codeScrollView: {
    backgroundColor: '#0d1117',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
    maxHeight: 180,
  },
  codeText: {
    color: '#c9d1d9',
    fontSize: 12,
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  cardTagPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  errorContainer: {
    backgroundColor: '#fed7d7',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
});