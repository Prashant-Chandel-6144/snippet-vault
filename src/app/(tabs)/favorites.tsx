import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  getFavoriteSnippets,
  toggleFavoriteSnippet,
  deleteSnippet,
  getAllLanguages,
} from '@/db';
import { ThemedText } from '@/components/themed-text';
import { useSnippetStore } from '@/hooks/store';
import { ThemedView } from '@/components/themed-view';
import { SnippetCard } from '@/components/SnippetCard';
import { Spacing } from '@/constants/theme';
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

export default function FavoritesScreen() {
  const theme = useTheme();

  // Data states from global cache
  const { snippets: allSnippets, languages, refreshData } = useSnippetStore();

  const favoriteSnippets = React.useMemo(() => {
    return allSnippets.filter((s) => s.isFavorite === 1);
  }, [allSnippets]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reload data whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await refreshData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load favorite snippets');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (snippetId: number, isFav: number) => {
    try {
      setErrorMsg(null);
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
              setErrorMsg(null);
              await deleteSnippet(snippetId);
              const favs = await getFavoriteSnippets();
              setSnippets(favs as Snippet[]);
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

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0274DF" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {errorMsg && (
        <View style={styles.errorContainer}>
          <ThemedText style={{ color: '#c53030' }}>{errorMsg}</ThemedText>
        </View>
      )}

      <FlatList
        data={favoriteSnippets}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-dislike-outline" size={64} color={theme.textSecondary} />
            <ThemedText style={{ marginTop: Spacing.two }} themeColor="textSecondary">
              You haven't favorited any snippets yet.
            </ThemedText>
            <ThemedText style={{ marginTop: Spacing.one, fontSize: 13 }} themeColor="textSecondary">
              Tap the heart icon on any snippet to save it here.
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
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