import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Share,
  Dimensions,
  Modal,
  Animated,
  TextInput
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getSnippetById } from '@/db/snippets';
import { getLanguageForSnippet } from '@/db/language';
import { getAiExplanationForSnippet, saveAiExplanation } from '@/db/ai';
import { getFilesForSnippet } from '@/db/files';
import { generateExplanation } from '@/lib/ai';
import { saveScreenshot, saveCodeFile, deleteLocalFile, readLocalFile, saveAttachedFile } from '@/lib/files';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { CodeHighlighter } from '@/components/CodeHighlighter';

const { width, height } = Dimensions.get('window');

interface AttachedFile {
  id: number;
  file_name: string;
  file_uri: string;
  file_size: number | null;
  file_type: 'screenshot' | 'code_file' | 'template';
  createdAt: string;
}

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
  createdAt: string;
  updatedAt: string;
}

function SkeletonSnippetDetail({ theme }: { theme: any }) {
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
    <Animated.View style={{ flex: 1, padding: Spacing.four, gap: Spacing.four, opacity }}>
      {/* Header section placeholder */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ width: '50%', height: 24, backgroundColor: theme.backgroundElement, borderRadius: 4 }} />
        <View style={{ width: 80, height: 24, backgroundColor: theme.backgroundElement, borderRadius: 12 }} />
      </View>

      {/* Tags section placeholder */}
      <View style={{ flexDirection: 'row', gap: 6, marginVertical: Spacing.two }}>
        <View style={{ width: 60, height: 18, backgroundColor: theme.backgroundElement, borderRadius: 8 }} />
        <View style={{ width: 80, height: 18, backgroundColor: theme.backgroundElement, borderRadius: 8 }} />
      </View>

      {/* Code Section placeholder */}
      <View style={{ width: '100%', height: 200, backgroundColor: theme.backgroundElement, borderRadius: 8 }} />

      {/* Actions Row placeholder */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, height: 40, backgroundColor: theme.backgroundElement, borderRadius: 8 }} />
        <View style={{ flex: 1, height: 40, backgroundColor: theme.backgroundElement, borderRadius: 8 }} />
        <View style={{ flex: 1, height: 40, backgroundColor: theme.backgroundElement, borderRadius: 8 }} />
      </View>

      {/* AI Section placeholder */}
      <View style={{ width: '100%', height: 150, backgroundColor: theme.backgroundElement, borderRadius: 8, marginTop: Spacing.two }} />
    </Animated.View>
  );
}

export default function SnippetDetailsScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Export states
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFileName, setExportFileName] = useState('');
  const [exportFormat, setExportFormat] = useState<'txt' | 'js' | 'json'>('txt');

  // Modals for viewing attachments
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingCode, setViewingCode] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setInitialLoading(true);
      const snippetId = Number(id);
      if (isNaN(snippetId)) throw new Error("Invalid snippet ID");

      const [loadedSnippet, loadedLanguage, loadedExplanation, loadedAttachments] = await Promise.all([
        getSnippetById(snippetId),
        getLanguageForSnippet(snippetId),
        getAiExplanationForSnippet(snippetId),
        getFilesForSnippet(snippetId)
      ]);

      if (!loadedSnippet) {
        throw new Error("Snippet not found");
      }

      setSnippet(loadedSnippet);
      setLanguage(loadedLanguage as Language | null);
      setAttachments(loadedAttachments as AttachedFile[]);
      
      if (loadedExplanation) {
        setExplanation(loadedExplanation.content);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load snippet');
    } finally {
      setInitialLoading(false);
    }
  };

  const refreshAttachments = async () => {
    try {
      const loadedAttachments = await getFilesForSnippet(Number(id));
      setAttachments(loadedAttachments as AttachedFile[]);
    } catch (err) {
      console.error("Failed to refresh attachments:", err);
    }
  };

  const handleExplainWithAI = async () => {
    if (!snippet) return;
    try {
      setExplaining(true);
      setErrorMsg(null);
      
      const langTitle = language ? language.title : 'Unknown';
      const result = await generateExplanation(snippet.code, langTitle);
      
      await saveAiExplanation(snippet.id, result);
      setExplanation(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      Alert.alert('AI Error', msg);
    } finally {
      setExplaining(false);
    }
  };

  const getExtensionForLanguage = (langTitle: string): string => {
    const l = langTitle.toLowerCase();
    if (l.includes('javascript') || l === 'js') return 'js';
    if (l.includes('typescript') || l === 'ts') return 'ts';
    if (l.includes('json')) return 'json';
    if (l.includes('python') || l === 'py') return 'py';
    if (l.includes('html')) return 'html';
    if (l.includes('css')) return 'css';
    return 'txt';
  };

  const handleAttachScreenshot = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "We need gallery access to attach screenshots.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets?.[0]?.uri) {
      try {
        setAttachmentLoading(true);
        await saveScreenshot(Number(id), pickerResult.assets[0].uri);
        await refreshAttachments();
        Alert.alert("Attached", "Screenshot successfully attached to snippet.");
      } catch (err) {
        Alert.alert("Error", "Failed to attach screenshot: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setAttachmentLoading(false);
      }
    }
  };

  const handleAttachDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets?.[0]?.uri) {
        setAttachmentLoading(true);
        const asset = res.assets[0];
        await saveAttachedFile(Number(id), asset.uri, asset.name);
        await refreshAttachments();
        Alert.alert("Attached", `Attached file: ${asset.name}`);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to attach file: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handleAttachChoice = () => {
    Alert.alert(
      "Attach File",
      "Choose the type of file you want to attach to this snippet:",
      [
        {
          text: "Screenshot (Gallery)",
          onPress: handleAttachScreenshot
        },
        {
          text: "Code / Text File",
          onPress: handleAttachDocument
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const handleExportCode = () => {
    if (!snippet) return;
    // Set default name (sanitized snippet title)
    const defaultName = snippet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    setExportFileName(defaultName);
    
    // Choose format based on language
    const defaultExt = getExtensionForLanguage(language ? language.title : 'text');
    if (defaultExt === 'js' || defaultExt === 'json') {
      setExportFormat(defaultExt);
    } else {
      setExportFormat('txt');
    }
    
    setExportModalVisible(true);
  };

  const handleConfirmExport = async () => {
    if (!snippet) return;
    if (!exportFileName.trim()) {
      Alert.alert("Error", "File name cannot be empty.");
      return;
    }
    try {
      setAttachmentLoading(true);
      setExportModalVisible(false);
      const res = await saveCodeFile(snippet.id, exportFileName.trim(), snippet.code, exportFormat);
      await refreshAttachments();
      Alert.alert("Exported", `Saved code file locally:\n${res.fileUri}`);
    } catch (err) {
      Alert.alert("Error", "Failed to export code: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAttachmentLoading(false);
    }
  };

  const handleShareSnippet = async () => {
    if (!snippet) return;
    Alert.alert(
      "Share Snippet",
      "How would you like to share this snippet?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Share as Text",
          onPress: async () => {
            try {
              await Share.share({
                title: snippet.title,
                message: `// ${snippet.title}\n\n${snippet.code}`,
              });
            } catch (err) {
              console.error("Text sharing failed", err);
            }
          }
        },
        {
          text: "Share as File",
          onPress: async () => {
            try {
              // Get the first code file attachment if exists, otherwise create a temporary one to share
              let fileUri = attachments.find(a => a.file_type === 'code_file')?.file_uri;
              
              if (!fileUri) {
                const ext = getExtensionForLanguage(language ? language.title : 'text');
                const tempRes = await saveCodeFile(snippet.id, snippet.title, snippet.code, ext);
                fileUri = tempRes.fileUri;
                await refreshAttachments();
              }

              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
              } else {
                Alert.alert("Sharing Unavailable", "Sharing files is not supported on this device.");
              }
            } catch (err) {
              Alert.alert("Error", "Failed to share file: " + (err instanceof Error ? err.message : String(err)));
            }
          }
        }
      ]
    );
  };

  const handleDeleteAttachment = (fileId: number) => {
    Alert.alert(
      "Remove Attachment",
      "Remove this attachment permanently?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setAttachmentLoading(true);
              await deleteLocalFile(fileId);
              await refreshAttachments();
            } catch (err) {
              Alert.alert("Error", "Failed to delete attachment.");
            } finally {
              setAttachmentLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleViewAttachment = async (file: AttachedFile) => {
    if (file.file_type === 'screenshot') {
      setViewingImage(file.file_uri);
    } else {
      try {
        setAttachmentLoading(true);
        const codeContent = await readLocalFile(file.file_uri);
        setViewingCode({ title: file.file_name, content: codeContent });
      } catch (err) {
        Alert.alert("Error", "Could not read code file content.");
      } finally {
        setAttachmentLoading(false);
      }
    }
  };

  if (initialLoading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Loading...',
            headerStyle: {
              backgroundColor: theme.background,
            },
            headerTintColor: theme.text,
            headerShadowVisible: false,
          }} 
        />
        <SkeletonSnippetDetail theme={theme} />
      </ThemedView>
    );
  }

  if (errorMsg && !snippet) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e53e3e" />
        <ThemedText style={{ marginTop: Spacing.two }}>{errorMsg}</ThemedText>
      </ThemedView>
    );
  }

  if (!snippet) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e53e3e" />
        <ThemedText style={{ marginTop: Spacing.two }}>Snippet not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: snippet?.title || 'Details',
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header section */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>{snippet.title}</ThemedText>
          {language && (
            <View style={[styles.langPill, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">{language.title}</ThemedText>
            </View>
          )}
        </View>

        {/* Tags */}
        {snippet.tags && snippet.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {snippet.tags.map((tag: { id: number; title: string }) => (
              <View key={`tag-${tag.id}`} style={[styles.tagPill, { backgroundColor: 'rgba(2, 116, 223, 0.1)' }]}>
                <ThemedText style={{ fontSize: 12, color: '#0274DF' }}>#{tag.title}</ThemedText>
              </View>
            ))}
          </View>
        )}

        {/* Code Section */}
        <View style={{ marginBottom: Spacing.four }}>
          <CodeHighlighter code={snippet.code} language={language?.title} />
        </View>

        {/* File Actions Row */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleAttachChoice}
            disabled={attachmentLoading}
            style={[styles.actionBtn, { backgroundColor: theme.backgroundElement, opacity: attachmentLoading ? 0.6 : 1 }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Attach file to snippet"
            accessibilityHint="Allows attaching gallery screenshots or code/text files to this snippet."
          >
            {attachmentLoading ? (
              <ActivityIndicator size="small" color="#0274DF" />
            ) : (
              <Ionicons name="attach-outline" size={18} color="#0274DF" />
            )}
            <ThemedText style={styles.actionBtnText}>Attach File</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleExportCode}
            disabled={attachmentLoading}
            style={[styles.actionBtn, { backgroundColor: theme.backgroundElement, opacity: attachmentLoading ? 0.6 : 1 }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Export snippet to local file"
            accessibilityHint="Saves the code of this snippet as a local file in your storage."
          >
            <Ionicons name="save-outline" size={18} color="#0274DF" />
            <ThemedText style={styles.actionBtnText}>Export Code</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleShareSnippet}
            disabled={attachmentLoading}
            style={[styles.actionBtn, { backgroundColor: theme.backgroundElement, opacity: attachmentLoading ? 0.6 : 1 }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share code snippet"
            accessibilityHint="Shares the snippet content or text files with external apps."
          >
            <Ionicons name="share-social-outline" size={18} color="#0274DF" />
            <ThemedText style={styles.actionBtnText}>Share</ThemedText>
          </Pressable>
        </View>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <View style={styles.attachmentsSection}>
            <ThemedText style={styles.sectionTitle}>Attached Files</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachmentsScroll}>
              {attachments.map((file) => (
                <View key={`attachment-${file.id}`} style={[styles.attachmentCard, { backgroundColor: theme.backgroundElement }]}>
                  <Pressable style={styles.attachmentPressable} onPress={() => handleViewAttachment(file)}>
                    {file.file_type === 'screenshot' ? (
                      <Image source={{ uri: file.file_uri }} style={styles.attachmentThumb} />
                    ) : (
                      <Ionicons name="document-text" size={32} color="#0274DF" />
                    )}
                    <ThemedText numberOfLines={1} style={styles.attachmentName}>{file.file_name}</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteAttachment(file.id)} style={styles.attachmentDeleteBtn}>
                    <Ionicons name="close-circle" size={18} color="#f56565" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* AI Explanation Section */}
        <View style={[styles.aiSection, { borderColor: theme.backgroundElement, backgroundColor: theme.backgroundElement }]}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={20} color="#9333ea" />
            <ThemedText style={styles.aiTitle}>DevSnippet AI Explanation</ThemedText>
          </View>
          
          {explanation ? (
            <View style={styles.markdownContainer}>
              <Markdown 
                style={{
                  body: { color: theme.text, fontSize: 14, lineHeight: 22 },
                  heading1: { color: theme.text, fontSize: 20, fontWeight: 'bold', marginVertical: 8 },
                  heading2: { color: theme.text, fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
                  heading3: { color: theme.text, fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
                  paragraph: { color: theme.text, marginBottom: 12 },
                  code_inline: { backgroundColor: theme.background, color: '#ff7b72', padding: 4, borderRadius: 4, fontFamily: 'monospace' },
                  code_block: { backgroundColor: '#0d1117', color: '#c9d1d9', padding: 12, borderRadius: 8, fontFamily: 'monospace', overflow: 'hidden' },
                  fence: { backgroundColor: '#0d1117', color: '#c9d1d9', padding: 12, borderRadius: 8, fontFamily: 'monospace', overflow: 'hidden' },
                  list_item: { color: theme.text, marginVertical: 4 },
                  bullet_list: { color: theme.text },
                }}
              >
                {explanation}
              </Markdown>
            </View>
          ) : (
            <View style={styles.aiPromptContainer}>
              <ThemedText style={styles.aiPromptText} themeColor="textSecondary">
                Get a detailed, AI-powered explanation of how this code works, best practices, and potential improvements.
              </ThemedText>
              <Pressable 
                onPress={handleExplainWithAI} 
                disabled={explaining}
                style={[styles.aiBtn, explaining && { opacity: 0.7 }]}
              >
                {explaining ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="color-wand-outline" size={18} color="#fff" />
                    <ThemedText style={styles.aiBtnText}>Explain Code</ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal visible={viewingImage !== null} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Pressable style={styles.modalCloseArea} onPress={() => setViewingImage(null)} />
          <View style={styles.imageViewerContainer}>
            {viewingImage && (
              <Image source={{ uri: viewingImage }} style={styles.fullImage} contentFit="contain" />
            )}
            <Pressable style={styles.modalCloseBtn} onPress={() => setViewingImage(null)}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Code Viewer Modal */}
      <Modal visible={viewingCode !== null} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.codeViewerModal, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.backgroundElement }]}>
              <ThemedText style={styles.modalHeaderTitle} numberOfLines={1}>
                {viewingCode?.title}
              </ThemedText>
              <Pressable onPress={() => setViewingCode(null)} style={styles.modalCloseBtnCircle}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.codeViewerScroll}>
              <View style={styles.codeBlockBackground}>
                <ThemedText style={styles.modalCodeText} type="code">
                  {viewingCode?.content}
                </ThemedText>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Export Snippet Modal */}
      <Modal visible={exportModalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.dialogModal, { backgroundColor: theme.background }]}>
            <ThemedText style={styles.dialogTitle}>Export Snippet as File</ThemedText>
            
            <ThemedText style={styles.dialogLabel}>File Name</ThemedText>
            <TextInput
              style={[
                styles.dialogInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.backgroundSelected,
                },
              ]}
              placeholder="Enter file name..."
              placeholderTextColor={theme.textSecondary}
              value={exportFileName}
              onChangeText={setExportFileName}
              accessible={true}
              accessibilityLabel="Export filename input"
            />
            
            <ThemedText style={styles.dialogLabel}>File Format</ThemedText>
            <View style={styles.dialogRow}>
              {(['txt', 'js', 'json'] as const).map((format) => (
                <Pressable
                  key={format}
                  onPress={() => setExportFormat(format)}
                  style={[
                    styles.selectorBtn,
                    { backgroundColor: theme.backgroundElement },
                    exportFormat === format && [styles.selectorBtnActive, { borderColor: '#0274DF' }]
                  ]}
                  accessible={true}
                  accessibilityRole="tab"
                  accessibilityLabel={`Select .${format} format`}
                  accessibilityState={{ selected: exportFormat === format }}
                >
                  <ThemedText style={[exportFormat === format && { color: '#0274DF', fontWeight: 'bold' }]}>
                    .{format.toUpperCase()}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <View style={styles.dialogButtonsRow}>
              <Pressable
                onPress={() => setExportModalVisible(false)}
                style={[styles.dialogBtn, { backgroundColor: theme.backgroundElement }]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel export"
              >
                <ThemedText themeColor="textSecondary">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleConfirmExport}
                style={[styles.dialogBtn, { backgroundColor: '#0274DF' }]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Confirm and save file"
              >
                <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Export</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six + 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    marginRight: Spacing.two,
  },
  langPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  tagPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Spacing.two,
  },
  codeContainer: {
    backgroundColor: '#0d1117',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    marginBottom: Spacing.four,
  },
  codeText: {
    color: '#c9d1d9',
    fontSize: 13,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: 10,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attachmentsSection: {
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  attachmentsScroll: {
    gap: Spacing.three,
  },
  attachmentCard: {
    width: 120,
    height: 100,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  attachmentPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  attachmentThumb: {
    width: 48,
    height: 48,
    borderRadius: Spacing.one,
    marginBottom: 4,
  },
  attachmentName: {
    fontSize: 10,
    textAlign: 'center',
    width: '100%',
  },
  attachmentDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  aiSection: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9333ea',
  },
  aiPromptContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  aiPromptText: {
    textAlign: 'center',
    marginBottom: Spacing.four,
    lineHeight: 20,
  },
  aiBtn: {
    backgroundColor: '#9333ea',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
    paddingVertical: 12,
    borderRadius: Spacing.four,
  },
  aiBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  markdownContainer: {
    marginTop: Spacing.two,
  },
  // Viewer Modals Styling
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  imageViewerContainer: {
    width: width * 0.9,
    height: height * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: -40,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  codeViewerModal: {
    width: width * 0.9,
    height: height * 0.8,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: Spacing.four,
  },
  modalCloseBtnCircle: {
    padding: 4,
  },
  codeViewerScroll: {
    flex: 1,
    padding: Spacing.three,
  },
  codeBlockBackground: {
    backgroundColor: '#0d1117',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    minHeight: '100%',
  },
  modalCodeText: {
    color: '#c9d1d9',
    fontSize: 12,
  },
  // Export Modal Styles
  dialogModal: {
    width: width * 0.85,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  dialogLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  dialogInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
    marginTop: Spacing.one,
  },
  dialogRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectorBtnActive: {
    borderWidth: 1.5,
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.five,
  },
  dialogBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 10,
    borderRadius: Spacing.two,
  },
});
