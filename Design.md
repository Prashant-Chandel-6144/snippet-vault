# DevVault — Design System (Raw UX Dark Theme)

A dark, data-dense dashboard aesthetic adapted from an ML-observability reference UI. Optimized for mobile, high information density, and a single clear accent color per screen state.

---

## 1. Color Palette

### Surfaces
| Token | Hex | Usage |
|---|---|---|
| `bg-app` | `#0b0e10` | Outermost app background / status bar area |
| `bg-base` | `#141819` | Screen background |
| `bg-card` | `#1a1f21` | Cards, list rows, chips, inputs |
| `bg-card-deep` | `#0e1112` | Code blocks, nested/inset surfaces, input wells |
| `border-subtle` | `#23292b` | Card/modal borders (0.5–1px) |
| `border-hairline` | `#1c2224` | Dividers, tab bar top border |

### Text
| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#e8ebec` | Headings, primary values, body |
| `text-secondary` | `#9aa3a6` | Labels, captions, metadata |
| `text-tertiary` | `#6b7274` | Placeholder text, disabled, deep-nested hints |
| `text-disabled` | `#5f5e5a` | Inactive tab icons/labels |

### Accent (primary brand)
| Token | Hex | Usage |
|---|---|---|
| `accent-teal` | `#1D9E75` | Primary brand color — active states, progress fills, links |
| `accent-teal-light` | `#5DCAA5` | Active tab, highlighted text/values, active pill text |
| `accent-teal-wash` | `rgba(29,158,117,0.10–0.15)` | Selected pill/button backgrounds |

### Status / Category Colors
Used for category tags, severity, and left-border accents on list rows. Rotate through these for taxonomies (languages, alert levels, etc.) — never introduce new hues without checking here first.

| Token | Hex | Meaning |
|---|---|---|
| `status-critical` | `#D85A30` (coral/red-orange) | Alerts, errors, "over SLA," destructive emphasis |
| `status-info` | `#378ADD` (blue) | Neutral category / informational |
| `status-warning` | `#EF9F27` (amber) | Warnings, drift, caution |
| `status-success` | `#1D9E75` / `#5DCAA5` (teal) | Healthy, passing, primary accent |
| `status-purple` | `#7F77DD` | Syntax keywords, secondary accent for code |

**Rule of thumb:** each screen should have exactly one "hero" accent color for its primary metric/state; other status colors appear only in small doses (tag dots, left borders, chips).

---

## 2. Typography

| Role | Font | Size | Weight | Color |
|---|---|---|---|---|
| Screen title | Sans (system/Inter-like) | 18–22px | 500 | `text-primary` |
| Card big number / hero stat | Sans | 20–34px | 500–600 | `text-primary` or status color |
| Card label (small caps) | Sans | 10–11px | 500, letter-spacing ~0.04em | `text-secondary`, uppercase |
| Body / row title | Sans | 13–14px | 500 | `text-primary` |
| Metadata / caption | Sans | 11px | 400 | `text-secondary` |
| Code | Monospace (JetBrains Mono / SF Mono) | 11–12px | 400 | `text-primary` base, syntax colors for tokens |

No serif anywhere. Headings are never bold-heavy (max weight 600); rely on size + color for hierarchy, not boldness.

---

## 3. Layout & Spacing

- Base corner radius: **10px** for cards/rows, **16px** for modals/sheets, **16–32px** for outer device/screen container mockups.
- Card padding: **10–14px**.
- Gap between stacked cards: **8px**.
- Gap between unrelated sections: **12–16px**.
- Screen horizontal padding: **14–16px**.
- Left-border accent on list rows: **2px solid**, color = category/status color. This is the primary way to encode category at a glance without icons.
- Dividers: 1px, `border-hairline`, used sparingly (mainly above tab bar).

---

## 4. Components

### Stat card (2-up grid)
- `bg-card`, `radius-10`, padding 10px.
- Big number top (20px, weight 500), label below in small caps `text-secondary`.
- Optional small colored dot (top-right) to indicate alert state.

### List row / snippet row
- `bg-card`, `radius-10`, left-border 2px in category color.
- Title (13px/500) + metadata line (11px/`text-secondary`) stacked.
- Optional trailing value (e.g. latency, chevron).

### Pills / chips (filters, tags)
- `radius-16` (fully rounded), padding `5px 10px`, font 11px.
- Inactive: `bg-card` + `text-secondary`.
- Active/selected: `accent-teal-wash` background + `accent-teal-light` text.

### Buttons
- Primary action: `accent-teal-wash` bg, `accent-teal-light` text, `radius-8`, centered label, medium weight.
- Secondary/icon actions (copy/edit/share row): equal-width `bg-card` cells, `radius-8`, icon above/inline + 12px label.

### Code block
- `bg-card-deep`, `radius-8–10`, padding 10–12px, monospace 11px, line-height 1.6.
- Syntax coloring: keywords `#7F77DD` (purple), function/identifier names `#5DCAA5` (teal), rest default `text-primary`/`#c8ccce`.

### Modal / bottom sheet (e.g. "Add snippet")
- Appears as an inset panel (not full-screen): 14px side margins, floating above a dimmed (opacity ~0.35) background screen.
- `bg-card`, `radius-16`, `border-subtle` 0.5px, padding 14px.
- Field pattern: small-caps label (11px, `text-secondary`) above each input; input well is `bg-card-deep`, `radius-8`, padding `8px 10px`, placeholder in `text-tertiary`.
- Dropdowns: same input well style + trailing chevron-down icon.
- Close (×) icon top-right of modal header, title left-aligned same row.

### Charts (if needed elsewhere in app)
- Baseline vs current shown as two line colors: dashed for baseline (`text-secondary`/blue), solid for current (status color, e.g. coral when degrading).
- Axis labels 10–11px `text-secondary`, gridlines very faint.

---

## 5. Navigation — Custom Tab Bar

- 4 tabs, icon-over-label, centered, evenly spaced across bottom, ~10px font for labels.
- Icons: Tabler Icons (`ti ti-*`) — matches original reference (`ti-layout-grid`, `ti-search`, `ti-folder`, `ti-settings`, `ti-chevron-*`, `ti-x`, `ti-plus`, `ti-copy`, `ti-edit`, `ti-share`).
- Active tab: icon + label in `accent-teal-light` (`#5DCAA5`).
- Inactive tabs: `text-disabled` (`#5f5e5a`).
- A thin `border-hairline` divider sits above the tab bar separating it from content.
- Current app tab set: **Vault · Search · Collections · Settings**.

---

## 6. Iconography

- Icon set: **Tabler Icons** (outline style, consistent stroke width).
- Small status dot (7px circle) used next to a wordmark/logo or as an alert indicator on stat cards — solid fill in status color.
- Icons are never filled/duotone; keep single-color outline throughout for consistency with the reference.

---

## 7. Voice / Content Patterns (from reference)

- Screen titles are short, plain nouns: "Models," "Models Overview," "Inference Log" → for this app: "All snippets," "Search," "Collections."
- Metadata lines follow `Primary · Secondary · Tertiary` pattern separated by `·` (middle dot), e.g. `JavaScript · utils · updated 2d ago`.
- Counts/labels use small-caps style labels under big numbers (`MODELS`, `INF / DAY` → `SNIPPETS`, `COLLECTIONS`).

---

## 8. What NOT to do

- No light-mode surfaces mixed in — this is a dark-only theme.
- No bold/heavy display type; hierarchy comes from size + muted-vs-bright color, not font-weight extremes.
- Don't introduce new accent hues casually — pick from the status palette in §1.
- Don't fully round corners on cards (keep 10px, not pill-shaped) — pill shape is reserved for chips/tags/buttons only.
- Avoid drop shadows; depth comes from subtle background-color steps (`bg-app` → `bg-base` → `bg-card` → `bg-card-deep`), not shadows.

---

## 9. Open items for the agent to confirm per-screen

When applying this theme across the rest of the app, check for each new screen:
1. What is this screen's single hero accent color (teal, or a status color)?
2. What's the left-border category logic for any list rows (language? priority? type?)?
3. Does this screen need a stat-card grid at the top, or does it start directly with a list/filter row?
4. Any new icon needed that isn't in the Tabler set already referenced above?