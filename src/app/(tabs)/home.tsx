import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
  Alert,
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import {
  createSnippet,
  updateSnippet,
  getAllSnippets,
  deleteSnippet,
  toggleFavoriteSnippet,
  getAllLanguages,
  createLanguage,
  getAllTags,
  createTag,
  setTagsForSnippet,
  deleteTag,
} from '@/db';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SnippetCard } from '@/components/SnippetCard';
import {
  Spacing,
  BG_BASE,
  BG_CARD,
  BG_CARD_DEEP,
  BORDER_SUBTLE,
  BORDER_HAIRLINE,
  ACCENT_TEAL,
  ACCENT_TEAL_LIGHT,
  ACCENT_TEAL_WASH,
  STATUS_CRITICAL,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  Radius,
  SCREEN_H_PAD,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveScreenshot, saveAttachedFile } from '@/lib/files';
import { useSnippetStore } from '@/hooks/store';

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

export default function HomeScreen() {
  const theme = useTheme();

  // Modal & Form states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [customLanguage, setCustomLanguage] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [editingSnippetId, setEditingSnippetId] = useState<number | null>(null);

  // Pending attachments for new snippet
  const [pendingAttachments, setPendingAttachments] = useState<
    { uri: string; name: string; type: 'screenshot' | 'document' }[]
  >([]);

  // Data states from global cache
  const { snippets, languages, tags, refreshData } = useSnippetStore();
  const [filterLanguageId, setFilterLanguageId] = useState<number | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load data whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      initializeData();
    }, [])
  );

  const initializeData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Seed default languages if none exist
      const langs = await getAllLanguages();
      if (langs.length === 0) {
        await createLanguage({ title: 'TypeScript' });
        await createLanguage({ title: 'JavaScript' });
        await createLanguage({ title: 'Python' });
        await createLanguage({ title: 'HTML' });
        await createLanguage({ title: 'CSS' });
      }

      // Seed default tags if none exist
      const tgs = await getAllTags();
      if (tgs.length === 0) {
        await createTag({ title: 'frontend' });
        await createTag({ title: 'backend' });
        await createTag({ title: 'utility' });
        await createTag({ title: 'hooks' });
        await createTag({ title: 'database' });
      }

      await refreshData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadSnippets = async () => {
    try {
      setErrorMsg(null);
      await refreshData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load snippets');
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
              await loadSnippets();
            } catch (err) {
              setErrorMsg(err instanceof Error ? err.message : 'Database error deleting snippet');
            }
          },
        },
      ]
    );
  };

  const handleEditSnippet = (snippetToEdit: Snippet) => {
    setEditingSnippetId(snippetToEdit.id);
    setTitle(snippetToEdit.title);
    setCode(snippetToEdit.code);
    setSelectedLanguageId(snippetToEdit.language_id);
    setSelectedTagIds(snippetToEdit.tags ? snippetToEdit.tags.map((t: { id: number; title: string }) => t.id) : []);
    setCreateModalVisible(true);
  };

  const handleSaveSnippet = async () => {
    if (!title.trim()) {
      setErrorMsg('Snippet title cannot be empty.');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Snippet code cannot be empty.');
      return;
    }
    if (selectedLanguageId === null) {
      setErrorMsg('Please select a language.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      if (editingSnippetId !== null) {
        // Edit mode
        await updateSnippet({
          title: title.trim(),
          code: code.trim(),
          language_id: selectedLanguageId,
          id: editingSnippetId,
        });

        // Sync tags
        await setTagsForSnippet(editingSnippetId, selectedTagIds);

        // Save any pending attachments
        for (const att of pendingAttachments) {
          try {
            if (att.type === 'screenshot') {
              await saveScreenshot(editingSnippetId, att.uri);
            } else {
              await saveAttachedFile(editingSnippetId, att.uri, att.name);
            }
          } catch (attErr) {
            console.warn('Failed to save attachment:', attErr);
          }
        }
      } else {
        // Create mode
        const snippetId = await createSnippet({
          title: title.trim(),
          code: code.trim(),
          language_id: selectedLanguageId,
        });

        // Insert tag joins
        if (selectedTagIds.length > 0) {
          await setTagsForSnippet(Number(snippetId), selectedTagIds);
        }

        // Save any pending attachments
        for (const att of pendingAttachments) {
          try {
            if (att.type === 'screenshot') {
              await saveScreenshot(Number(snippetId), att.uri);
            } else {
              await saveAttachedFile(Number(snippetId), att.uri, att.name);
            }
          } catch (attErr) {
            console.warn('Failed to save attachment:', attErr);
          }
        }
      }

      // Reset form states
      setTitle('');
      setCode('');
      setSelectedLanguageId(null);
      setSelectedTagIds([]);
      setEditingSnippetId(null);
      setPendingAttachments([]);
      setCreateModalVisible(false);

      await loadSnippets();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Database error saving snippet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCustomLanguage = async () => {
    if (!customLanguage.trim()) return;
    try {
      setErrorMsg(null);
      const newId = await createLanguage({ title: customLanguage.trim() });
      await refreshData();
      setSelectedLanguageId(Number(newId));
      setCustomLanguage('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add custom language');
    }
  };

  const handleAddCustomTag = async () => {
    if (!customTag.trim()) return;
    try {
      setErrorMsg(null);
      const newId = await createTag({ title: customTag.trim() });
      await refreshData();
      setSelectedTagIds((prev) => [...prev, Number(newId)]);
      setCustomTag('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add custom tag');
    }
  };

  const handleConfirmDeleteTag = (tagId: number, tagTitle: string) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete the tag "#${tagTitle}"? This will unlink it from any snippets.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setErrorMsg(null);
              await deleteTag(tagId);
              
              // Deselect if active
              setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
              
              // Refresh tag list
              await refreshData();
            } catch (err) {
              setErrorMsg(err instanceof Error ? err.message : 'Failed to delete tag');
            }
          },
        },
      ]
    );
  };

  const toggleTagSelection = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const getLanguageName = (langId: number | null) => {
    const lang = languages.find((l) => l.id === langId);
    return lang ? lang.title : 'Plain Text';
  };

  // Filter snippets based on horizontal bar selection
  const filteredSnippets = filterLanguageId
    ? snippets.filter((s) => s.language_id === filterLanguageId)
    : snippets;

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT_TEAL} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Error Banner */}
      {errorMsg && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText} numberOfLines={2}>
            {errorMsg}
          </ThemedText>
          <Pressable onPress={() => setErrorMsg(null)} style={styles.errorCloseBtn}>
            <Ionicons name="close-circle" size={20} color="#c53030" />
          </Pressable>
        </View>
      )}

      {/* Horizontal Language Filter Chips — Design.md §4 pills */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollView}
        >
          <Pressable
            onPress={() => setFilterLanguageId(null)}
            style={[
              styles.filterPill,
              !filterLanguageId && styles.filterPillActive,
            ]}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel="Show all snippets"
            accessibilityState={{ selected: !filterLanguageId }}
          >
            <ThemedText
              style={[
                styles.filterText,
                !filterLanguageId && styles.filterTextActive,
              ]}
            >
              All
            </ThemedText>
          </Pressable>
          {languages.map((lang) => (
            <Pressable
              key={lang.id}
              onPress={() => setFilterLanguageId(lang.id)}
              style={[
                styles.filterPill,
                filterLanguageId === lang.id && styles.filterPillActive,
              ]}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={`Filter by language ${lang.title}`}
              accessibilityState={{ selected: filterLanguageId === lang.id }}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  filterLanguageId === lang.id && styles.filterTextActive,
                ]}
              >
                {lang.title}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* DevVault List */}
      <FlatList
        data={filteredSnippets}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={theme.textSecondary} />
            <ThemedText style={{ marginTop: Spacing.two }} themeColor="textSecondary">
              No snippets found in this category.
            </ThemedText>
            <Pressable
              onPress={() => setCreateModalVisible(true)}
              style={styles.emptyBtn}
            >
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
                Add Your First Snippet
              </ThemedText>
            </Pressable>
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
            onEdit={() => handleEditSnippet(item)}
            onDelete={() => handleDeleteSnippet(item.id)}
          />
        )}
      />

      {/* FAB — accent-teal, no shadow per Design.md §8 */}
      <Pressable
        onPress={() => setCreateModalVisible(true)}
        style={styles.fab}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Create new snippet"
        accessibilityHint="Opens a modal to add title, code, tags, and attachments."
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

      {/* Slide-up Create Snippet Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Modal Header — Design.md §4 modal pattern */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {editingSnippetId !== null ? 'Edit Snippet' : 'New Snippet'}
              </ThemedText>
              <Pressable
                onPress={() => {
                  setCreateModalVisible(false);
                  setEditingSnippetId(null);
                  setTitle('');
                  setCode('');
                  setSelectedLanguageId(null);
                  setSelectedTagIds([]);
                  setPendingAttachments([]);
                }}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={TEXT_SECONDARY} />
              </Pressable>
            </View>
            {/* Save row */}
            <View style={styles.modalSaveRow}>
              <Pressable
                onPress={handleSaveSnippet}
                disabled={submitting}
                style={[styles.saveBtn, submitting && { opacity: 0.5 }]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={ACCENT_TEAL_LIGHT} />
                ) : (
                  <ThemedText style={styles.saveBtnText}>Save Snippet</ThemedText>
                )}
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
              {/* Field label — small-caps per Design.md §4 */}
              <ThemedText type="label" themeColor="textSecondary" style={styles.fieldLabel}>
                Title
              </ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Fetch API helper"
                placeholderTextColor={TEXT_TERTIARY}
                value={title}
                onChangeText={setTitle}
              />

              <ThemedText type="label" themeColor="textSecondary" style={styles.fieldLabel}>
                Code
              </ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Paste code here..."
                placeholderTextColor={TEXT_TERTIARY}
                multiline
                numberOfLines={6}
                value={code}
                onChangeText={setCode}
              />

              {/* Language Picker */}
              <ThemedText type="label" themeColor="textSecondary" style={styles.fieldLabel}>
                Language
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalSelector}
              >
                {languages.map((lang) => (
                  <Pressable
                    key={lang.id}
                    onPress={() => setSelectedLanguageId(lang.id)}
                    style={[
                      styles.selectorPill,
                      selectedLanguageId === lang.id && styles.selectorPillActive,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.selectorPillText,
                        selectedLanguageId === lang.id && styles.selectorPillTextActive,
                      ]}
                    >
                      {lang.title}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Custom Language */}
              <View style={styles.customAddRow}>
                <TextInput
                  style={styles.customAddInput}
                  placeholder="Add language..."
                  placeholderTextColor={TEXT_TERTIARY}
                  value={customLanguage}
                  onChangeText={setCustomLanguage}
                />
                <Pressable
                  onPress={handleAddCustomLanguage}
                  style={styles.customAddBtn}
                >
                  <Ionicons name="add" size={18} color={ACCENT_TEAL_LIGHT} />
                </Pressable>
              </View>

              {/* Tag Picker */}
              <ThemedText type="label" themeColor="textSecondary" style={styles.fieldLabel}>
                Tags
              </ThemedText>
              <View style={styles.tagsContainer}>
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const isDefault = ['frontend', 'backend', 'utility', 'hooks', 'database'].includes(tag.title);
                  return (
                    <Pressable
                      key={tag.id}
                      onPress={() => toggleTagSelection(tag.id)}
                      style={[
                        styles.tagChip,
                        isSelected && styles.tagChipActive,
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <ThemedText
                          style={[
                            styles.tagChipText,
                            isSelected && styles.tagChipTextActive,
                          ]}
                        >
                          #{tag.title}
                        </ThemedText>
                        {!isDefault && (
                          <Pressable
                            onPress={() => handleConfirmDeleteTag(tag.id, tag.title)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name="close-circle"
                              size={13}
                              color={isSelected ? ACCENT_TEAL_LIGHT : TEXT_SECONDARY}
                            />
                          </Pressable>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Custom Tag */}
              <View style={styles.customAddRow}>
                <TextInput
                  style={styles.customAddInput}
                  placeholder="Add tag..."
                  placeholderTextColor={TEXT_TERTIARY}
                  value={customTag}
                  onChangeText={setCustomTag}
                />
                <Pressable
                  onPress={handleAddCustomTag}
                  style={styles.customAddBtn}
                >
                  <Ionicons name="add" size={18} color={ACCENT_TEAL_LIGHT} />
                </Pressable>
              </View>

              {/* File Attachments Section */}
              <ThemedText type="label" themeColor="textSecondary" style={styles.fieldLabel}>
                Attachments
              </ThemedText>
              <ThemedText type="caption" themeColor="textTertiary" style={{ marginBottom: Spacing.two }}>
                Attach screenshots or files. Saved when you tap Save.
              </ThemedText>

              {/* Pending attachment previews */}
              {pendingAttachments.length > 0 && (
                <View style={styles.pendingAttachmentsContainer}>
                  {pendingAttachments.map((att, idx) => (
                    <View key={`pending-${idx}`} style={[styles.pendingAttCard, { backgroundColor: theme.background }]}>
                      {att.type === 'screenshot' ? (
                        <Image source={{ uri: att.uri }} style={styles.pendingAttThumb} />
                      ) : (
                        <View style={styles.pendingAttIconWrap}>
                          <Ionicons name="document-text" size={24} color="#0274DF" />
                        </View>
                      )}
                      <ThemedText style={styles.pendingAttName} numberOfLines={1}>
                        {att.name}
                      </ThemedText>
                      <Pressable
                        onPress={() => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        style={styles.pendingAttRemoveBtn}
                      >
                        <Ionicons name="close-circle" size={18} color="#f56565" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Attach buttons */}
              <View style={styles.attachBtnsRow}>
                <Pressable
                  onPress={async () => {
                    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!permResult.granted) {
                      Alert.alert('Permission Denied', 'Gallery access is needed to attach screenshots.');
                      return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ['images'],
                      allowsEditing: true,
                      quality: 0.8,
                    });
                    if (!result.canceled && result.assets?.[0]) {
                      const asset = result.assets[0];
                      const name = asset.fileName || `screenshot_${Date.now()}.jpg`;
                      setPendingAttachments((prev) => [...prev, { uri: asset.uri, name, type: 'screenshot' }]);
                    }
                  }}
                  style={styles.attachBtn}
                >
                  <Ionicons name="image-outline" size={16} color={ACCENT_TEAL_LIGHT} />
                  <ThemedText style={styles.attachBtnText}>Screenshot</ThemedText>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    try {
                      const res = await DocumentPicker.getDocumentAsync({
                        type: '*/*',
                        copyToCacheDirectory: true,
                      });
                      if (!res.canceled && res.assets?.[0]) {
                        const asset = res.assets[0];
                        setPendingAttachments((prev) => [...prev, { uri: asset.uri, name: asset.name, type: 'document' }]);
                      }
                    } catch (err) {
                      Alert.alert('Error', 'Failed to pick file.');
                    }
                  }}
                  style={styles.attachBtn}
                >
                  <Ionicons name="document-attach-outline" size={16} color={ACCENT_TEAL_LIGHT} />
                  <ThemedText style={styles.attachBtnText}>File</ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  keyboardView: { flex: 1 },

  // ── Error banner ───────────────────────────────────────────────────────────
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(216,90,48,0.12)',
    paddingHorizontal: SCREEN_H_PAD,
    paddingVertical: 8,
    marginHorizontal: SCREEN_H_PAD,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: STATUS_CRITICAL,
    zIndex: 100,
  },
  errorText: { color: STATUS_CRITICAL, flex: 1, fontSize: 11 },
  errorCloseBtn: { marginLeft: 8, padding: 2 },

  // ── Filter chips — Design.md §4 pills ─────────────────────────────────────
  filterRow: {
    height: 44,
    marginBottom: 8,
  },
  filterScrollView: {
    paddingHorizontal: SCREEN_H_PAD,
    gap: 6,
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,               // fully rounded chips per spec
    backgroundColor: BG_CARD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: ACCENT_TEAL_WASH,
  },
  filterText: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  filterTextActive: {
    color: ACCENT_TEAL_LIGHT,
    fontWeight: '600',
  },

  // ── Snippet list ───────────────────────────────────────────────────────────
  listContainer: {
    paddingHorizontal: SCREEN_H_PAD,
    paddingBottom: 120,
    gap: 8,                         // 8px gap between stacked cards per Design.md §3
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyBtn: {
    backgroundColor: ACCENT_TEAL_WASH,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: ACCENT_TEAL_LIGHT,
    fontSize: 13,
    fontWeight: '500',
  },

  // ── FAB — accent-teal, no shadow per Design.md §8 ─────────────────────────
  fab: {
    position: 'absolute',
    right: SCREEN_H_PAD,
    bottom: 80,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACCENT_TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // ── Modal — Design.md §4 modal/bottom sheet ───────────────────────────────
  modalSafeArea: {
    flex: 1,
    backgroundColor: BG_CARD,      // bg-card per Design.md §4
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_H_PAD,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_SUBTLE,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e8ebec',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSaveRow: {
    paddingHorizontal: SCREEN_H_PAD,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_SUBTLE,
  },
  saveBtn: {
    backgroundColor: ACCENT_TEAL_WASH,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: ACCENT_TEAL_LIGHT,
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: SCREEN_H_PAD,
    paddingBottom: 48,
    gap: 4,
  },
  // field label — small-caps style per Design.md §4
  fieldLabel: {
    marginTop: 14,
    marginBottom: 4,
  },
  // input well — bg-card-deep per Design.md §4
  textInput: {
    backgroundColor: BG_CARD_DEEP,
    borderWidth: 0.5,
    borderColor: BORDER_SUBTLE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#e8ebec',
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },

  // ── Language pills ─────────────────────────────────────────────────────────
  horizontalSelector: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  selectorPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 6,
    backgroundColor: BG_CARD_DEEP,
    borderWidth: 0.5,
    borderColor: BORDER_SUBTLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorPillActive: {
    backgroundColor: ACCENT_TEAL_WASH,
    borderColor: ACCENT_TEAL,
  },
  selectorPillText: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  selectorPillTextActive: {
    color: ACCENT_TEAL_LIGHT,
    fontWeight: '600',
  },

  // ── Tag chips ──────────────────────────────────────────────────────────────
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: BG_CARD_DEEP,
    borderWidth: 0.5,
    borderColor: BORDER_SUBTLE,
  },
  tagChipActive: {
    backgroundColor: ACCENT_TEAL_WASH,
    borderColor: ACCENT_TEAL,
  },
  tagChipText: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  tagChipTextActive: {
    color: ACCENT_TEAL_LIGHT,
    fontWeight: '600',
  },

  // ── Custom add row ─────────────────────────────────────────────────────────
  customAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  customAddInput: {
    flex: 1,
    backgroundColor: BG_CARD_DEEP,
    borderWidth: 0.5,
    borderColor: BORDER_SUBTLE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#e8ebec',
  },
  customAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_TEAL_WASH,
    borderWidth: 0.5,
    borderColor: ACCENT_TEAL,
  },

  // ── Attachments ────────────────────────────────────────────────────────────
  pendingAttachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  pendingAttCard: {
    width: 96,
    height: 84,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    backgroundColor: BG_CARD_DEEP,
    borderWidth: 0.5,
    borderColor: BORDER_SUBTLE,
    position: 'relative',
  },
  pendingAttThumb: {
    width: 40,
    height: 36,
    borderRadius: 4,
    marginBottom: 4,
  },
  pendingAttIconWrap: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pendingAttName: {
    fontSize: 9,
    textAlign: 'center',
    color: TEXT_SECONDARY,
    width: '100%',
  },
  pendingAttRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  attachBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 24,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: BG_CARD_DEEP,
    borderWidth: 0.5,
    borderColor: BORDER_SUBTLE,
  },
  attachBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },
});