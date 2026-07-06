import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  View,
  ScrollView,
  TextInput,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { File as FSFile } from 'expo-file-system';
import preferencesDb from '@/db/preferences';
import { getApiKey, setApiKey, deleteApiKey } from '@/db/secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDb, getAllSnippets, getAllTags } from '@/db';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme, useThemeMode } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();

  // Settings states
  const { themeMode, setThemeMode } = useThemeMode();

  // Stats states
  const [snippetCount, setSnippetCount] = useState(0);
  const [tagCount, setTagCount] = useState(0);

  // API Key states
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load preferences and stats on focus
  useFocusEffect(
    useCallback(() => {
      loadSettingsAndStats();
    }, [])
  );

  const loadSettingsAndStats = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Load Theme preference from preferences wrapper
      const prefs = await preferencesDb.getPreferences();
      // Theme is loaded and managed reactively via useThemeMode hook

      // Fetch DB stats
      const snippets = await getAllSnippets();
      const tags = await getAllTags();
      setSnippetCount(snippets.length);
      
      // Only count user-created (custom) tags in the statistics
      const defaultTags = ['frontend', 'backend', 'utility', 'hooks', 'database'];
      const customTagsCount = tags.filter((t: any) => !defaultTags.includes(t.title)).length;
      setTagCount(customTagsCount);

      // Load API Key
      const key = await getApiKey();
      setApiKeyInput(key || '');
    } catch (err) {
      setErrorMsg('Failed to load settings or stats');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      setIsSavingKey(true);
      const cleanedKey = apiKeyInput.trim();
      if (!cleanedKey) {
        await deleteApiKey();
        setApiKeyInput('');
      } else {
        if (!cleanedKey.startsWith('sk-') || cleanedKey.length < 20) {
          Alert.alert(
            "Invalid Key Format",
            "OpenAI API keys typically start with 'sk-' and are at least 20 characters long. Please verify your credentials and try again."
          );
          setIsSavingKey(false);
          return;
        }
        await setApiKey(cleanedKey);
        Alert.alert("API Key Saved", "Your OpenAI API Key was updated securely.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save API Key.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleToggleTheme = async (mode: 'light' | 'dark' | 'system') => {
    try {
      await setThemeMode(mode);
      Alert.alert(
        'Theme Updated',
        `Theme preference set to ${mode} successfully.`
      );
    } catch (err) {
      setErrorMsg('Failed to save theme preference');
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all snippets, custom tags, and attached file records permanently. Are you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const db = await getDb();
              
              // Retrieve all file URIs to delete them physically from storage
              let files: { file_uri: string }[] = [];
              try {
                files = await db.getAllAsync<{ file_uri: string }>(`SELECT file_uri FROM files`);
              } catch (fileErr) {
                console.warn('Failed to fetch file URIs before database reset:', fileErr);
              }
              
              // Clear all SQLite tables and seed defaults
              await db.withTransactionAsync(async () => {
                await db.runAsync(`DELETE FROM snippet_tags`);
                await db.runAsync(`DELETE FROM files`);
                await db.runAsync(`DELETE FROM ai_explanation`);
                await db.runAsync(`DELETE FROM snippets`);
                await db.runAsync(`DELETE FROM tags`);
                await db.runAsync(`DELETE FROM language`);

                // Re-seed default languages immediately
                const now = new Date().toISOString();
                const defaultLangs = ['TypeScript', 'JavaScript', 'Python', 'HTML', 'CSS'];
                for (const lang of defaultLangs) {
                  await db.runAsync(
                    `INSERT OR IGNORE INTO language (title, createdAt, updatedAt) VALUES (?, ?, ?)`,
                    [lang, now, now]
                  );
                }

                // Re-seed default tags immediately
                const defaultTags = ['frontend', 'backend', 'utility', 'hooks', 'database'];
                for (const tag of defaultTags) {
                  await db.runAsync(
                    `INSERT OR IGNORE INTO tags (title, createdAt, updatedAt) VALUES (?, ?, ?)`,
                    [tag, now, now]
                  );
                }
              });

              // Clean up physical files from filesystem
              for (const file of files) {
                if (file.file_uri) {
                  try {
                    const f = new FSFile(file.file_uri);
                    if (f.exists) {
                      f.delete();
                    }
                  } catch (fsErr) {
                    console.warn(`Failed to delete physical file on database reset: ${file.file_uri}`, fsErr);
                  }
                }
              }

              try {
                await AsyncStorage.removeItem('hasCompletedOnboarding');
              } catch (asyncErr) {
                console.warn('Failed to clear onboarding storage keys:', asyncErr);
              }

              Alert.alert('Reset Complete', 'Database cleared successfully. Default tags and languages have been reset.');
              await loadSettingsAndStats();
            } catch (err) {
              setErrorMsg('Failed to clear database');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {errorMsg && (
          <View style={styles.errorContainer}>
            <ThemedText style={{ color: '#c53030' }}>{errorMsg}</ThemedText>
          </View>
        )}

        {/* Section 1: Application Theme Options */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={24} color="#0274DF" />
            <ThemedText style={styles.sectionTitle}>Theme Preferences</ThemedText>
          </View>

          <View style={styles.themeSelectorContainer}>
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => handleToggleTheme(mode)}
                style={[
                  styles.themeOptionBtn,
                  { backgroundColor: theme.background },
                  themeMode === mode && { borderColor: '#0274DF', borderWidth: 1.5 },
                ]}
              >
                <ThemedText
                  style={[
                    styles.themeOptionText,
                    themeMode === mode && { color: '#0274DF', fontWeight: 'bold' },
                  ]}
                  themeColor={themeMode === mode ? undefined : 'textSecondary'}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </ThemedView>

        {/* Section 2: Vault Database Stats */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart-outline" size={24} color="#0274DF" />
            <ThemedText style={styles.sectionTitle}>Vault Statistics</ThemedText>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.background }]}>
              <ThemedText style={styles.statNumber}>{snippetCount}</ThemedText>
              <ThemedText style={styles.statLabel} themeColor="textSecondary">
                Snippets Saved
              </ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.background }]}>
              <ThemedText style={styles.statNumber}>{tagCount}</ThemedText>
              <ThemedText style={styles.statLabel} themeColor="textSecondary">
                Tags Created
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Section: API Credentials */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="key-outline" size={24} color="#0274DF" />
            <ThemedText style={styles.sectionTitle}>API Credentials</ThemedText>
          </View>
          <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
            Save your OpenAI API Key locally on your device to enable AI-powered explanations.
          </ThemedText>

          <View style={styles.apiKeyRow}>
            <TextInput
              style={[
                styles.apiKeyInput,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              placeholder="Paste OpenAI API Key (sk-...)"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!isKeyVisible}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
            />
            <Pressable
              onPress={() => setIsKeyVisible(!isKeyVisible)}
              style={styles.keyVisibilityBtn}
            >
              <Ionicons name={isKeyVisible ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <Pressable
            onPress={handleSaveApiKey}
            disabled={isSavingKey}
            style={[styles.actionBtn, { backgroundColor: '#0274DF', marginTop: Spacing.three }]}
          >
            {isSavingKey ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.actionBtnText}>Save API Key</ThemedText>
            )}
          </Pressable>
        </ThemedView>

        {/* Section: Privacy & Legal */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color={theme.accent} />
            <ThemedText style={styles.sectionTitle}>Privacy &amp; Legal</ThemedText>
          </View>
          <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
            Review how DevVault handles your data and protects your privacy.
          </ThemedText>

          <Pressable
            onPress={() => router.push('/privacy')}
            style={({ pressed }) => [
              styles.privacyRow,
              { backgroundColor: theme.background, borderColor: theme.borderSubtle },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={styles.privacyRowLeft}>
              <Ionicons name="document-text-outline" size={18} color={theme.textSecondary} />
              <ThemedText style={{ fontSize: 14, fontWeight: '500' }}>Privacy Policy</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
          </Pressable>
        </ThemedView>

        {/* Section 3: Data Management */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning-outline" size={24} color="#e53e3e" />
            <ThemedText style={[styles.sectionTitle, { color: '#e53e3e' }]}>Data Management</ThemedText>
          </View>
          <ThemedText style={styles.sectionDescription} themeColor="textSecondary">
            Clear all contents from your local database vault. This action is irreversible.
          </ThemedText>

          <Pressable
            onPress={handleClearAllData}
            style={[styles.actionBtn, { backgroundColor: '#e53e3e' }]}
          >
            <ThemedText style={styles.actionBtnText}>Reset Local Database</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
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
  scrollContainer: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.four,
  },
  sectionCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  apiKeyInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
  },
  themeSelectorContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  themeOptionBtn: {
    flex: 1,
    height: 40,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  statBox: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0274DF',
  },
  statLabel: {
    fontSize: 11,
    marginTop: Spacing.half,
  },
  actionBtn: {
    height: 44,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#fed7d7',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  keyVisibilityBtn: {
    padding: Spacing.two,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  privacyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});