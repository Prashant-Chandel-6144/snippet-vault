/**
 * Design System — DevVault
 * Based on Design.md: Raw UX Dark Theme
 *
 * Dark-only. Both 'light' and 'dark' maps use the same dark palette.
 * The theme toggle in Settings is preserved for API compatibility.
 */

import { Platform } from 'react-native';

// ─── Raw Design Tokens ──────────────────────────────────────────────────────

/** Outermost app background / status bar area */
export const BG_APP = '#0b0e10';
/** Screen background */
export const BG_BASE = '#141819';
/** Cards, list rows, chips, inputs */
export const BG_CARD = '#1a1f21';
/** Code blocks, nested surfaces, input wells */
export const BG_CARD_DEEP = '#0e1112';
/** Card / modal borders 0.5–1px */
export const BORDER_SUBTLE = '#23292b';
/** Dividers, tab bar top border */
export const BORDER_HAIRLINE = '#1c2224';

/** Headings, primary values, body */
export const TEXT_PRIMARY = '#e8ebec';
/** Labels, captions, metadata */
export const TEXT_SECONDARY = '#9aa3a6';
/** Placeholder text, disabled, deep hints */
export const TEXT_TERTIARY = '#6b7274';
/** Inactive tab icons / labels */
export const TEXT_DISABLED = '#5f5e5a';

/** Primary brand — active states, progress fills, links */
export const ACCENT_TEAL = '#1D9E75';
/** Active tab, highlighted text, active pill text */
export const ACCENT_TEAL_LIGHT = '#5DCAA5';
/** Selected pill / button backgrounds */
export const ACCENT_TEAL_WASH = 'rgba(29,158,117,0.12)';

/** Alerts, errors, destructive emphasis */
export const STATUS_CRITICAL = '#D85A30';
/** Neutral category / informational */
export const STATUS_INFO = '#378ADD';
/** Warnings, drift, caution */
export const STATUS_WARNING = '#EF9F27';
/** Syntax keywords, secondary accent for code */
export const STATUS_PURPLE = '#7F77DD';

// ─── Theme Color Map ──────────────────────────────────────────────────────────

const darkTheme = {
  // Surfaces
  background: BG_BASE,
  backgroundApp: BG_APP,
  backgroundElement: BG_CARD,
  backgroundDeep: BG_CARD_DEEP,
  backgroundSelected: ACCENT_TEAL_WASH,

  // Borders
  borderSubtle: BORDER_SUBTLE,
  borderHairline: BORDER_HAIRLINE,

  // Text
  text: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  textTertiary: TEXT_TERTIARY,
  textDisabled: TEXT_DISABLED,

  // Accent
  accent: ACCENT_TEAL,
  accentLight: ACCENT_TEAL_LIGHT,
  accentWash: ACCENT_TEAL_WASH,

  // Status
  statusCritical: STATUS_CRITICAL,
  statusInfo: STATUS_INFO,
  statusWarning: STATUS_WARNING,
  statusPurple: STATUS_PURPLE,
};

export const Colors = {
  // Dark-only per Design.md — light map mirrors dark
  light: darkTheme,
  dark: darkTheme,
} as const;

export type ThemeColor = keyof typeof darkTheme;

// ─── Typography ──────────────────────────────────────────────────────────────

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    mono: 'var(--font-mono)',
  },
});

// ─── Spacing Scale ────────────────────────────────────────────────────────────

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
  eight: 64,
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────────

export const Radius = {
  card: 10,
  modal: 16,
  pill: 16,
  input: 8,
  button: 8,
} as const;

export const BottomTabInset = Platform.select({ ios: 90, android: 90 }) ?? 90;
export const MaxContentWidth = 800;
export const SCREEN_H_PAD = 14;
