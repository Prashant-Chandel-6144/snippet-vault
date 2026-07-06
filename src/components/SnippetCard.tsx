/**
 * SnippetCard — Design.md list row / snippet row pattern
 *
 * • bg-card (#1a1f21) background, radius-10
 * • 2px left border in language category color
 * • Title 13px/500 + metadata dot-separated 11px text-secondary
 * • Code preview in bg-card-deep (#0e1112), monospace 11px
 * • Tag pills: radius-16, accent-teal-wash bg when active
 * • No drop shadows — depth via bg steps per Design.md §8
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './themed-text';
import { useRouter } from 'expo-router';
import {
  BG_CARD,
  BG_CARD_DEEP,
  BORDER_SUBTLE,
  ACCENT_TEAL,
  ACCENT_TEAL_LIGHT,
  ACCENT_TEAL_WASH,
  STATUS_CRITICAL,
  STATUS_INFO,
  STATUS_WARNING,
  STATUS_PURPLE,
  TEXT_SECONDARY,
  Radius,
} from '@/constants/theme';

// Deterministic language → left-border color mapping (status palette only)
const LANG_COLORS: Record<string, string> = {
  typescript: ACCENT_TEAL,
  javascript: STATUS_WARNING,
  python:     STATUS_INFO,
  html:       STATUS_CRITICAL,
  css:        STATUS_PURPLE,
  rust:       STATUS_CRITICAL,
  go:         STATUS_INFO,
  java:       STATUS_WARNING,
  kotlin:     STATUS_PURPLE,
  swift:      STATUS_CRITICAL,
  php:        STATUS_PURPLE,
  ruby:       STATUS_CRITICAL,
  c:          STATUS_INFO,
  cpp:        STATUS_INFO,
  shell:      ACCENT_TEAL,
  sql:        STATUS_WARNING,
  json:       STATUS_WARNING,
  yaml:       STATUS_INFO,
  markdown:   TEXT_SECONDARY,
};

function getLangColor(title?: string): string {
  if (!title) return TEXT_SECONDARY;
  const key = title.toLowerCase().replace(/[^a-z]/g, '');
  return LANG_COLORS[key] ?? STATUS_INFO;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export interface SnippetCardProps {
  snippet: {
    id: number;
    title: string;
    code: string;
    isFavorite: boolean;
    languageTitle?: string;
    createdAt?: string;
    updatedAt?: string;
    tags?: { id: number; title: string }[];
  };
  onToggleFavorite: (id: number, currentStatus: boolean) => void;
  onEdit?: (snippet: SnippetCardProps['snippet']) => void;
  onDelete: (id: number) => void;
}

export function SnippetCard({ snippet, onToggleFavorite, onEdit, onDelete }: SnippetCardProps) {
  const router = useRouter();
  const borderColor = useMemo(() => getLangColor(snippet.languageTitle), [snippet.languageTitle]);

  const metaParts = useMemo(() => {
    const parts: string[] = [];
    if (snippet.languageTitle) parts.push(snippet.languageTitle);
    if (snippet.tags && snippet.tags.length > 0) parts.push(`#${snippet.tags[0].title}`);
    const timeStr = formatRelativeTime(snippet.updatedAt ?? snippet.createdAt);
    if (timeStr) parts.push(timeStr);
    return parts.join(' · ');
  }, [snippet]);

  const handleNavigate = () => {
    router.push({ pathname: '/snippet/[id]', params: { id: snippet.id } });
  };

  return (
    <Pressable
      onPress={handleNavigate}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: borderColor, opacity: pressed ? 0.85 : 1 },
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Snippet: ${snippet.title}. ${metaParts}`}
      accessibilityHint="Tap to open code viewer and AI explanation."
    >
      {/* Row top: title + action icons */}
      <View style={styles.rowTop}>
        <ThemedText style={styles.cardTitle} numberOfLines={1}>
          {snippet.title}
        </ThemedText>
        <View style={styles.actions}>
          <Pressable
            onPress={() => onToggleFavorite(snippet.id, snippet.isFavorite)}
            hitSlop={10}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={snippet.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Ionicons
              name={snippet.isFavorite ? 'heart' : 'heart-outline'}
              size={16}
              color={snippet.isFavorite ? STATUS_CRITICAL : TEXT_SECONDARY}
            />
          </Pressable>
          {onEdit && (
            <Pressable
              onPress={() => onEdit(snippet)}
              hitSlop={10}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Edit snippet"
            >
              <Ionicons name="pencil-outline" size={15} color={TEXT_SECONDARY} />
            </Pressable>
          )}
          <Pressable
            onPress={() => onDelete(snippet.id)}
            hitSlop={10}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Delete snippet"
          >
            <Ionicons name="trash-outline" size={15} color={STATUS_CRITICAL} />
          </Pressable>
        </View>
      </View>

      {/* Metadata dot-separated line — per Design.md §7 */}
      {metaParts.length > 0 && (
        <ThemedText type="caption" themeColor="textSecondary" style={styles.meta} numberOfLines={1}>
          {metaParts}
        </ThemedText>
      )}

      {/* Code preview — bg-card-deep, monospace */}
      {snippet.code.trim().length > 0 && (
        <View style={styles.codeBlock}>
          <ThemedText type="code" style={styles.codeText} numberOfLines={4}>
            {snippet.code}
          </ThemedText>
        </View>
      )}

      {/* Tag pills — radius-16, teal-wash background */}
      {snippet.tags && snippet.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {snippet.tags.slice(0, 4).map((tag) => (
            <View key={`st-${tag.id}`} style={styles.tagPill}>
              <ThemedText style={styles.tagText}>#{tag.title}</ThemedText>
            </View>
          ))}
          {snippet.tags.length > 4 && (
            <ThemedText type="caption" themeColor="textTertiary">
              +{snippet.tags.length - 4}
            </ThemedText>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BG_CARD,
    borderRadius: Radius.card,        // 10px per Design.md §3
    borderLeftWidth: 2,               // left-border accent per Design.md §3
    borderLeftColor: TEXT_SECONDARY,  // overridden per-instance
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    // No border on other sides except the design-specified left accent
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: BORDER_SUBTLE,
    borderRightColor: BORDER_SUBTLE,
    borderBottomColor: BORDER_SUBTLE,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#e8ebec',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  meta: {
    fontSize: 11,
  },
  codeBlock: {
    backgroundColor: BG_CARD_DEEP,    // bg-card-deep per Design.md §4
    borderRadius: Radius.input,        // 8px
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  codeText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#c8ccce',                  // default text-primary variant for code per Design.md §4
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    alignItems: 'center',
  },
  tagPill: {
    backgroundColor: ACCENT_TEAL_WASH,  // accent-teal-wash per Design.md §4
    borderRadius: Radius.pill,           // 16px — fully rounded chips
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    color: ACCENT_TEAL_LIGHT,            // accent-teal-light per Design.md §4
    fontWeight: '500',
  },
});
