import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Animated,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import {
  getSnippetStats,
  getRecentSnippets,
  getSnippetsByLanguage,
  getSnippetsByTag,
} from '@/db/snippets';
import { getAllLanguages, createLanguage, updateLanguage, deleteLanguage } from '@/db/language';
import { getAllTags, createTag, updateTag, deleteTag } from '@/db/tags';
import { useSnippetStore } from '@/hooks/store';

interface SnippetItem {
  id: number;
  title: string;
  code: string;
  isFavorite: number;
  language_id: number | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: number; title: string }[];
}

interface LanguageItem {
  id: number;
  title: string;
}

interface TagItem {
  id: number;
  title: string;
}

interface Stats {
  totalSnippets: number;
  totalLanguages: number;
  totalFiles: number;
  totalTags: number;
}

type FilterMode = 'none' | 'language' | 'tag';

const LANG_COLORS: Record<string, string> = {
  javascript: '#F7DF1E',
  typescript: '#3178C6',
  python: '#3776AB',
  html: '#E34F26',
  css: '#1572B6',
  json: '#5B5EA6',
  swift: '#FA7343',
  kotlin: '#7F52FF',
  rust: '#CE422B',
  go: '#00ADD8',
  java: '#ED8B00',
  cpp: '#00599C',
  c: '#A8B9CC',
  php: '#777BB4',
  ruby: '#CC342D',
  bash: '#4EAA25',
  shell: '#4EAA25',
  sql: '#336791',
  dart: '#00B4AB',
  default: '#0274DF',
};

function getLangColor(title: string): string {
  const key = title.toLowerCase().replace(/[^a-z]/g, '');
  return LANG_COLORS[key] ?? LANG_COLORS.default;
}

function getLangInitial(title: string): string {
  return title.slice(0, 2).toUpperCase();
}

function timeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

// Visual Skeleton placeholder card
function SkeletonSnippetCard({ theme }: { theme: any }) {
  const [opacity] = useState(new Animated.Value(0.3));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.snippetCard, { backgroundColor: theme.backgroundElement, borderLeftColor: theme.backgroundSelected, opacity }]}>
      <View style={{ gap: 8 }}>
        <View style={{ width: '60%', height: 16, backgroundColor: theme.backgroundSelected, borderRadius: 4 }} />
        <View style={{ width: '40%', height: 12, backgroundColor: theme.backgroundSelected, borderRadius: 4 }} />
      </View>
      <View style={{ width: '100%', height: 40, backgroundColor: theme.background, borderRadius: 6, marginTop: 12 }} />
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
        <View style={{ width: 60, height: 18, backgroundColor: theme.backgroundSelected, borderRadius: 8 }} />
        <View style={{ width: 80, height: 18, backgroundColor: theme.backgroundSelected, borderRadius: 8 }} />
      </View>
    </Animated.View>
  );
}

export default function CollectionsScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const router = useRouter();
  const accentColor = scheme === 'dark' ? '#3C9FFE' : '#0274DF';

  const { snippets, languages, tags, refreshData } = useSnippetStore();
  const [stats, setStats] = useState<Stats>({ totalSnippets: 0, totalLanguages: 0, totalFiles: 0, totalTags: 0 });
  const [filteredSnippets, setFilteredSnippets] = useState<SnippetItem[]>([]);

  const [filterMode, setFilterMode] = useState<FilterMode>('none');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageItem | null>(null);
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // CRUD states for Collections
  const [crudModalVisible, setCrudModalVisible] = useState(false);
  const [crudMode, setCrudMode] = useState<'create' | 'edit'>('create');
  const [crudType, setCrudType] = useState<'language' | 'tag'>('language');
  const [crudTargetId, setCrudTargetId] = useState<number | null>(null);
  const [crudTitle, setCrudTitle] = useState('');
  const [crudSubmitting, setCrudSubmitting] = useState(false);

  const handleOpenAddModal = (type: 'language' | 'tag') => {
    setCrudMode('create');
    setCrudType(type);
    setCrudTargetId(null);
    setCrudTitle('');
    setCrudModalVisible(true);
  };

  const handleOpenEditModal = (type: 'language' | 'tag', item: { id: number; title: string }) => {
    setCrudMode('edit');
    setCrudType(type);
    setCrudTargetId(item.id);
    setCrudTitle(item.title);
    setCrudModalVisible(true);
  };

  const handleSaveCollection = async () => {
    if (!crudTitle.trim()) {
      Alert.alert("Error", "Title cannot be empty.");
      return;
    }
    try {
      setCrudSubmitting(true);
      if (crudMode === 'create') {
        if (crudType === 'language') {
          await createLanguage({ title: crudTitle.trim() });
        } else {
          await createTag({ title: crudTitle.trim() });
        }
      } else {
        if (crudTargetId !== null) {
          if (crudType === 'language') {
            await updateLanguage({ id: crudTargetId, title: crudTitle.trim() });
          } else {
            await updateTag({ id: crudTargetId, title: crudTitle.trim() });
          }
        }
      }
      setCrudModalVisible(false);
      await loadAll();
    } catch (error) {
      Alert.alert("Error", "Failed to save collection: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setCrudSubmitting(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (crudTargetId === null) return;
    
    Alert.alert(
      `Delete ${crudType === 'language' ? 'Language' : 'Tag'}`,
      `Are you sure you want to permanently delete "${crudTitle}"? This will unlink it from any snippets.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setCrudSubmitting(true);
              setCrudModalVisible(false);
              if (crudType === 'language') {
                await deleteLanguage(crudTargetId);
                if (selectedLanguage?.id === crudTargetId) {
                  clearFilter();
                }
              } else {
                await deleteTag(crudTargetId);
                if (selectedTag?.id === crudTargetId) {
                  clearFilter();
                }
              }
              await loadAll();
            } catch (error) {
              Alert.alert("Error", "Failed to delete collection: " + (error instanceof Error ? error.message : String(error)));
            } finally {
              setCrudSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const recentSnippets = React.useMemo(() => {
    return [...snippets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8) as unknown as SnippetItem[];
  }, [snippets]);

  const loadAll = useCallback(async () => {
    try {
      await refreshData();
      const loadedStats = await getSnippetStats();
      setStats(loadedStats);
    } catch (err) {
      console.error('Collections load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshData]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    clearFilter();
    loadAll();
  };

  const clearFilter = () => {
    setFilterMode('none');
    setSelectedLanguage(null);
    setSelectedTag(null);
    setFilteredSnippets([]);
  };

  const handleSelectLanguage = async (lang: LanguageItem) => {
    if (selectedLanguage?.id === lang.id) {
      clearFilter();
      return;
    }
    try {
      setFilterLoading(true);
      setFilterMode('language');
      setSelectedLanguage(lang);
      setSelectedTag(null);
      const snippets = await getSnippetsByLanguage(lang.id);
      setFilteredSnippets(snippets as SnippetItem[]);
    } catch (err) {
      console.error('Filter by language error:', err);
    } finally {
      setFilterLoading(false);
    }
  };

  const handleSelectTag = async (tag: TagItem) => {
    if (selectedTag?.id === tag.id) {
      clearFilter();
      return;
    }
    try {
      setFilterLoading(true);
      setFilterMode('tag');
      setSelectedTag(tag);
      setSelectedLanguage(null);
      const snippets = await getSnippetsByTag(tag.id);
      setFilteredSnippets(snippets as SnippetItem[]);
    } catch (err) {
      console.error('Filter by tag error:', err);
    } finally {
      setFilterLoading(false);
    }
  };

  const navigateToSnippet = (id: number) => {
    router.push(`/snippet/${id}`);
  };

  const activeSnippets = filterMode !== 'none' ? filteredSnippets : recentSnippets;
  const filterLabel =
    filterMode === 'language' && selectedLanguage
      ? `Language: ${selectedLanguage.title}`
      : filterMode === 'tag' && selectedTag
      ? `Tag: #${selectedTag.title}`
      : 'Recently Added';

  // Render the stats, language filters and tag lists as the FlatList header for performant scrolling
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Stats Banner */}
      <View 
        style={[styles.statsBanner, { backgroundColor: theme.backgroundElement }]}
        accessible={true}
        accessibilityLabel={`Statistics banner. ${stats.totalSnippets} snippets, ${stats.totalLanguages} languages, ${stats.totalTags} tags, ${stats.totalFiles} files.`}
      >
        <StatCard icon="code-slash" label="Snippets" value={stats.totalSnippets} color={accentColor} theme={theme} />
        <View style={[styles.statsDivider, { backgroundColor: theme.backgroundSelected }]} />
        <StatCard icon="layers-outline" label="Languages" value={stats.totalLanguages} color="#9333ea" theme={theme} />
        <View style={[styles.statsDivider, { backgroundColor: theme.backgroundSelected }]} />
        <StatCard icon="pricetag-outline" label="Tags" value={stats.totalTags} color="#059669" theme={theme} />
        <View style={[styles.statsDivider, { backgroundColor: theme.backgroundSelected }]} />
        <StatCard icon="attach-outline" label="Files" value={stats.totalFiles} color="#f59e0b" theme={theme} />
      </View>

      {/* Gesture Help Hint */}
      <View style={styles.hintContainer}>
        <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
        <ThemedText style={styles.hintText} themeColor="textSecondary">
          Tip: Long press any Language pill or Tag chip to rename or delete.
        </ThemedText>
      </View>

      {/* By Language Selector */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="layers" size={18} color={accentColor} />
          <ThemedText style={styles.sectionTitle}>By Language</ThemedText>
          <Pressable onPress={() => handleOpenAddModal('language')} style={styles.addCollectionBtn} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={20} color={accentColor} />
          </Pressable>
        </View>
        {languages.length === 0 ? (
          <ThemedText style={styles.emptyCollectionHint} themeColor="textSecondary">
            No languages added yet. Tap '+' to create one.
          </ThemedText>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.pillsScroll}
            accessible={true}
            accessibilityLabel="Language collections selectors"
          >
            {languages.map((lang) => {
              const isActive = selectedLanguage?.id === lang.id;
              const color = getLangColor(lang.title);
              return (
                <Pressable
                  key={`lang-${lang.id}`}
                  onPress={() => handleSelectLanguage(lang)}
                  onLongPress={() => handleOpenEditModal('language', lang)}
                  style={[
                    styles.langPill,
                    {
                      backgroundColor: isActive ? color : theme.backgroundElement,
                      borderColor: isActive ? color : 'transparent',
                      borderWidth: 1.5,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="tab"
                  accessibilityLabel={`Filter by language ${lang.title}`}
                  accessibilityHint="Double tap to filter. Long press to rename or delete."
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={[styles.langInitialBadge, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : color + '22' }]}>
                    <ThemedText style={[styles.langInitial, { color: isActive ? '#fff' : color }]}>
                      {getLangInitial(lang.title)}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.langPillText, { color: isActive ? '#fff' : theme.text }]}>
                    {lang.title}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* By Tag Selector */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pricetags" size={18} color="#059669" />
          <ThemedText style={styles.sectionTitle}>By Tag</ThemedText>
          <Pressable onPress={() => handleOpenAddModal('tag')} style={styles.addCollectionBtn} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={20} color="#059669" />
          </Pressable>
        </View>
        {tags.length === 0 ? (
          <ThemedText style={styles.emptyCollectionHint} themeColor="textSecondary">
            No tags added yet. Tap '+' to create one.
          </ThemedText>
        ) : (
          <View 
            style={styles.tagsWrap}
            accessible={true}
            accessibilityLabel="Tag filters list"
          >
            {tags.map((tag) => {
              const isActive = selectedTag?.id === tag.id;
              return (
                <Pressable
                  key={`tag-${tag.id}`}
                  onPress={() => handleSelectTag(tag)}
                  onLongPress={() => handleOpenEditModal('tag', tag)}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: isActive ? 'rgba(5, 150, 105, 0.2)' : theme.backgroundElement,
                      borderColor: isActive ? '#059669' : 'transparent',
                      borderWidth: 1.5,
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="tab"
                  accessibilityLabel={`Filter by tag ${tag.title}`}
                  accessibilityHint="Double tap to filter. Long press to rename or delete."
                  accessibilityState={{ selected: isActive }}
                >
                  <ThemedText style={[styles.tagChipText, { color: isActive ? '#059669' : theme.textSecondary }]}>
                    #{tag.title}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* List Header/Title */}
      <View style={[styles.section, { marginTop: Spacing.two, marginBottom: Spacing.one }]}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name={filterMode !== 'none' ? 'filter' : 'time-outline'}
            size={18}
            color={filterMode !== 'none' ? '#9333ea' : '#f59e0b'}
          />
          <ThemedText style={styles.sectionTitle}>{filterLabel}</ThemedText>
          {filterMode !== 'none' && (
            <Pressable 
              onPress={clearFilter} 
              style={styles.clearFilterBtn}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear current filter"
            >
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );

  // Loading state placeholder cards
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Mock stats loader */}
          <View style={[styles.statsBanner, { backgroundColor: theme.backgroundElement, height: 75, opacity: 0.5 }]} />
          
          <ThemedText style={[styles.sectionTitle, { marginTop: Spacing.four }]} themeColor="textSecondary">Loading Collections...</ThemedText>
          
          {/* Skeleton snippet cards */}
          <SkeletonSnippetCard theme={theme} />
          <SkeletonSnippetCard theme={theme} />
          <SkeletonSnippetCard theme={theme} />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filterLoading ? [] : activeSnippets}
        keyExtractor={(item) => `col-snippet-${item.id}`}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={accentColor} 
          />
        }
        ListEmptyComponent={
          filterLoading ? (
            <View style={{ gap: Spacing.three, paddingVertical: Spacing.two }}>
              <SkeletonSnippetCard theme={theme} />
              <SkeletonSnippetCard theme={theme} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={theme.textSecondary} />
              <ThemedText style={styles.emptyText} themeColor="textSecondary">
                No snippets found matching selection.
              </ThemedText>
            </View>
          )
        }
        renderItem={({ item }) => (
          <SnippetCollectionCard
            snippet={item}
            languages={languages}
            onPress={() => navigateToSnippet(item.id)}
            theme={theme}
            accentColor={accentColor}
          />
        )}
      />

      {/* CRUD Modal for Collections */}
      <Modal visible={crudModalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.dialogModal, { backgroundColor: theme.background }]}>
            <ThemedText style={styles.dialogTitle}>
              {crudMode === 'create' ? 'Create' : 'Manage'} {crudType === 'language' ? 'Language' : 'Tag'}
            </ThemedText>

            <TextInput
              style={[
                styles.dialogInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              placeholder={`Enter name (e.g. ${crudType === 'language' ? 'Ruby' : 'async'})...`}
              placeholderTextColor={theme.textSecondary}
              value={crudTitle}
              onChangeText={crudSubmitting ? undefined : setCrudTitle}
              autoFocus
            />

            <View style={styles.dialogButtonsRow}>
              {crudMode === 'edit' && (
                <Pressable
                  onPress={crudSubmitting ? undefined : handleDeleteCollection}
                  style={[styles.dialogBtn, { backgroundColor: '#f56565', marginRight: 'auto' }]}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" style={{ marginRight: 4 }} />
                  <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Delete</ThemedText>
                </Pressable>
              )}
              <Pressable
                onPress={() => setCrudModalVisible(false)}
                disabled={crudSubmitting}
                style={[styles.dialogBtn, { backgroundColor: theme.backgroundElement }]}
              >
                <ThemedText themeColor="textSecondary">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={crudSubmitting ? undefined : handleSaveCollection}
                disabled={crudSubmitting}
                style={[styles.dialogBtn, { backgroundColor: crudType === 'language' ? accentColor : '#059669' }]}
              >
                {crudSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Save</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  theme: any;
}

function StatCard({ icon, label, value, color, theme }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={color} />
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel} themeColor="textSecondary">{label}</ThemedText>
    </View>
  );
}

interface SnippetCollectionCardProps {
  snippet: SnippetItem;
  languages: LanguageItem[];
  onPress: () => void;
  theme: any;
  accentColor: string;
}

function SnippetCollectionCard({ snippet, languages, onPress, theme, accentColor }: SnippetCollectionCardProps) {
  const lang = languages.find((l) => l.id === snippet.language_id);
  const langColor = lang ? getLangColor(lang.title) : accentColor;
  const preview = snippet.code.trim().split('\n').slice(0, 2).join('\n');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.snippetCard,
        {
          backgroundColor: theme.backgroundElement,
          opacity: pressed ? 0.85 : 1,
          borderLeftColor: langColor,
        },
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Snippet title: ${snippet.title}. Language: ${lang ? lang.title : 'Unknown'}`}
      accessibilityHint="Double tap to open this snippet's full viewer, attachments, and AI details."
    >
      {/* Top row */}
      <View style={styles.snippetCardTop}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.snippetCardTitle} numberOfLines={1}>
            {snippet.title}
          </ThemedText>
          <ThemedText style={styles.snippetCardTime} themeColor="textSecondary">
            {timeAgo(snippet.updatedAt)}
          </ThemedText>
        </View>
        <View style={styles.snippetCardRight}>
          {lang && (
            <View style={[styles.langBadge, { backgroundColor: langColor + '22' }]}>
              <ThemedText style={[styles.langBadgeText, { color: langColor }]}>{lang.title}</ThemedText>
            </View>
          )}
          {snippet.isFavorite === 1 && (
            <Ionicons name="heart" size={14} color="#f56565" style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>

      {/* Code preview */}
      <View style={[styles.codePreview, { backgroundColor: theme.background }]}>
        <ThemedText style={styles.codePreviewText} numberOfLines={2} type="code">
          {preview}
        </ThemedText>
      </View>

      {/* Tags row */}
      {snippet.tags && snippet.tags.length > 0 && (
        <View style={styles.snippetTagsRow}>
          {snippet.tags.slice(0, 4).map((tag) => (
            <View key={`stag-${tag.id}`} style={[styles.snippetTagPill, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
              <ThemedText style={[styles.snippetTagText, { color: '#059669' }]}>#{tag.title}</ThemedText>
            </View>
          ))}
          {snippet.tags.length > 4 && (
            <ThemedText style={styles.moreTagsText} themeColor="textSecondary">
              +{snippet.tags.length - 4} more
            </ThemedText>
          )}
        </View>
      )}

      {/* Arrow */}
      <View style={styles.snippetCardArrow}>
        <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: 120,
    gap: Spacing.three,
  },
  headerContainer: {
    gap: Spacing.four,
    marginBottom: Spacing.two,
  },

  // Stats Banner
  statsBanner: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsDivider: {
    width: 1,
    height: 36,
    borderRadius: 1,
  },

  // Section
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  clearFilterBtn: {
    padding: 4,
  },

  // Language pills
  pillsScroll: {
    gap: Spacing.two,
    paddingVertical: 4,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  langInitialBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langInitial: {
    fontSize: 10,
    fontWeight: '800',
  },
  langPillText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Tags
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    gap: Spacing.two,
  },
  emptyText: {
    fontSize: 14,
  },

  // Snippet card
  snippetCard: {
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  snippetCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  snippetCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  snippetCardTime: {
    fontSize: 11,
    marginTop: 2,
  },
  snippetCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  langBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  langBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  codePreview: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  codePreviewText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#8b949e',
  },
  snippetTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  snippetTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  snippetTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 10,
  },
  snippetCardArrow: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
  },
  addCollectionBtn: {
    padding: 2,
  },
  emptyCollectionHint: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: Spacing.one,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.one,
    marginTop: -Spacing.two,
    marginBottom: Spacing.two,
  },
  hintText: {
    fontSize: 11,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogModal: {
    width: '85%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  dialogInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
    marginBottom: Spacing.four,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  dialogBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderRadius: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
