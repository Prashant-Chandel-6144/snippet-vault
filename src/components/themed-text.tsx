import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  /**
   * screenTitle  — 20px / weight 500 (screen headers, plain nouns)
   * body         — 13px / weight 500 (row titles, body text) [default]
   * caption      — 11px / weight 400 (metadata, captions)
   * label        — 11px / weight 500 / UPPERCASE / letter-spaced (small-caps stat labels)
   * bigNumber    — 28px / weight 500 (stat card hero numbers)
   * code         — monospace 12px / line-height 1.6
   * link         — 13px / accent-teal color
   */
  type?: 'screenTitle' | 'body' | 'caption' | 'label' | 'bigNumber' | 'code' | 'link'
       // Legacy aliases kept for backwards-compat with existing screens
       | 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'linkPrimary';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        // ── Primary variants ──────────────────────────────
        type === 'screenTitle' && styles.screenTitle,
        type === 'body'        && styles.body,
        type === 'caption'     && styles.caption,
        type === 'label'       && styles.label,
        type === 'bigNumber'   && styles.bigNumber,
        type === 'code'        && styles.code,
        type === 'link'        && styles.link,
        // ── Legacy aliases ────────────────────────────────
        type === 'default'     && styles.body,
        type === 'title'       && styles.screenTitle,
        type === 'small'       && styles.body,
        type === 'smallBold'   && styles.smallBold,
        type === 'subtitle'    && styles.subtitle,
        type === 'linkPrimary' && styles.link,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  /** Screen headers — plain nouns per Design.md §7 */
  screenTitle: {
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 26,
  },
  /** Row titles, body text — 13px/500 per Design.md §2 */
  body: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  /** Metadata, captions — 11px/400 per Design.md §2 */
  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
  },
  /** Stat card labels — small-caps style per Design.md §2 */
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  /** Hero stat numbers — 28px/500 per Design.md §2 */
  bigNumber: {
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 34,
  },
  /** Code blocks — monospace 12px / line-height 1.6 per Design.md §4 */
  code: {
    fontFamily: Fonts?.mono ?? 'monospace',
    fontWeight: Platform.select({ android: '700' }) ?? '400',
    fontSize: 11,
    lineHeight: 18, // ≈ 1.6 × 11
  },
  /** Links — teal color */
  link: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5DCAA5',
  },
  // ── Legacy aliases (mapped to closest Design.md variant) ─────────────────
  smallBold: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
});
