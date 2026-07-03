# Design System — AbhiIterates.OS

This document is the single source of truth for all visual decisions.
Every UI component must derive its values from these tokens.
No hardcoded color values. No arbitrary spacing. No improvised typography.

---

## Philosophy

The design takes inspiration from Linear, Vercel, Notion, and GitHub — tools that
feel fast, minimal, and professional. The design is dark-first, high-contrast,
and content-focused. No decorations. No gradients for the sake of gradients.
Every design decision must serve the user's task, not the designer's ego.

---

## Color Tokens

### Base Palette

```css
/* Background layers — dark, premium, depth through elevation */
--color-bg:          #0a0a0a;   /* page background */
--color-surface:     #111111;   /* cards, panels, sidebars */
--color-surface-2:   #1a1a1a;   /* elevated surfaces, dropdowns */
--color-surface-3:   #222222;   /* tooltips, popovers */

/* Borders — subtle, not decorative */
--color-border:      #2a2a2a;   /* default border */
--color-border-2:    #3a3a3a;   /* hover border */
--color-border-3:    #4a4a4a;   /* focus border */

/* Text — accessibility contrast ratios above WCAG AA */
--color-text-primary:   #fafafa;  /* headings, primary content — 19.6:1 */
--color-text-secondary: #a1a1aa;  /* body text, descriptions — 7.2:1 */
--color-text-muted:     #71717a;  /* captions, placeholders — 4.6:1 */
--color-text-disabled:  #52525b;  /* disabled states */
--color-text-inverse:   #09090b;  /* text on light backgrounds */

/* Brand — indigo, professional, not playful */
--color-accent:         #6366f1;
--color-accent-hover:   #4f46e5;
--color-accent-active:  #4338ca;
--color-accent-muted:   rgba(99, 102, 241, 0.1);
--color-accent-subtle:  rgba(99, 102, 241, 0.06);

/* Semantic */
--color-success:        #22c55e;
--color-success-muted:  rgba(34, 197, 94, 0.1);
--color-warning:        #f59e0b;
--color-warning-muted:  rgba(245, 158, 11, 0.1);
--color-destructive:    #ef4444;
--color-destructive-muted: rgba(239, 68, 68, 0.1);
--color-info:           #3b82f6;
--color-info-muted:     rgba(59, 130, 246, 0.1);
```

### Tailwind Config Mapping

```js
// tailwind.config.js — extend these, do not override
colors: {
  background: '#0a0a0a',
  surface: {
    DEFAULT: '#111111',
    2: '#1a1a1a',
    3: '#222222',
  },
  border: {
    DEFAULT: '#2a2a2a',
    2: '#3a3a3a',
    3: '#4a4a4a',
  },
  text: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    muted: '#71717a',
    disabled: '#52525b',
    inverse: '#09090b',
  },
  accent: {
    DEFAULT: '#6366f1',
    hover: '#4f46e5',
    active: '#4338ca',
    muted: 'rgba(99,102,241,0.10)',
    subtle: 'rgba(99,102,241,0.06)',
  },
}
```

---

## Typography

### Font Family

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```

### Type Scale

All values use `rem` for accessibility (user font size preferences respected).
Base: `1rem = 16px` (browser default).

| Token | rem | px | Line Height | Weight | Use |
|---|---|---|---|---|---|
| `text-xs` | 0.6875 | 11 | 1.45 | 400 | Captions, labels, badges |
| `text-sm` | 0.75 | 12 | 1.5 | 400 | Secondary body, tooltips |
| `text-base` | 0.875 | 14 | 1.6 | 400 | **Default body text** |
| `text-md` | 1.0 | 16 | 1.5 | 500 | Emphasized body |
| `text-lg` | 1.125 | 18 | 1.45 | 500 | Section headers |
| `text-xl` | 1.25 | 20 | 1.4 | 600 | Card titles |
| `text-2xl` | 1.5 | 24 | 1.35 | 700 | Page headers |
| `text-3xl` | 1.875 | 30 | 1.25 | 700 | Hero headings |
| `text-4xl` | 2.25 | 36 | 1.1 | 800 | Marketing headers |

### Typography Rules

1. **One `h1` per page.** Always.
2. **Headings never exceed `text-2xl`** in the application shell (dashboard, modals). `text-3xl`+ is reserved for landing pages.
3. **Body text is `text-base` (14px).** Not 16px. This is deliberate — our target users are on dense information screens.
4. **Monospace font** is used only for code, file paths, and technical identifiers.
5. **Never use `font-black` (900) in the application shell.** It reads as aggressive.

---

## Spacing Scale

We use an **8px base grid**. Every spacing value is a multiple of 4px minimum.

```
1  →  4px    (micro gaps, icon padding)
2  →  8px    (tight element spacing)
3  →  12px   (input padding, list item gaps)
4  →  16px   (section gaps, card padding)
5  →  20px   (larger element spacing)
6  →  24px   (card content padding)
8  →  32px   (section separation)
10 →  40px   (large section padding)
12 →  48px   (page section gaps)
16 →  64px   (major section breaks)
20 →  80px   (hero sections)
24 →  96px   (landing page sections)
```

---

## Border Radius

```css
--radius-sm:   4px;   /* buttons-sm, badges, tags */
--radius-md:   6px;   /* inputs, small cards */
--radius-lg:   8px;   /* cards, panels */
--radius-xl:   12px;  /* modals, large cards */
--radius-2xl:  16px;  /* feature cards */
--radius-full: 9999px; /* avatars, pills */
```

---

## Shadows

```css
/* Used sparingly — shadows communicate elevation, not style */
--shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.5);
--shadow-md:  0 4px 12px rgba(0, 0, 0, 0.4);
--shadow-lg:  0 8px 30px rgba(0, 0, 0, 0.35);
--shadow-xl:  0 16px 60px rgba(0, 0, 0, 0.3);

/* Glow — used only for active/focus states of accent elements */
--shadow-accent: 0 0 0 3px rgba(99, 102, 241, 0.2);
```

---

## Component Rules

### Buttons

| Variant | Use Case |
|---|---|
| `primary` | One per view, the main action |
| `secondary` | Alternative actions |
| `ghost` | Navigation, tertiary actions |
| `destructive` | Delete, remove, irreversible actions |
| `outline` | Low-emphasis actions |

- **Height:** `h-8` (32px) for sm, `h-9` (36px) for default, `h-10` (40px) for lg
- **Padding:** `px-3` for sm, `px-4` for default, `px-5` for lg
- **Loading state:** Always show a spinner + disable the button. Never show a loading toast for button actions.
- **Danger actions:** Always require confirmation. Never delete on first click.

### Inputs

- **Height:** `h-9` (36px) default
- **Padding:** `px-3 py-2`
- **Border:** `border border-[#2a2a2a]` default, `border-[#6366f1]` on focus
- **Background:** `bg-[#111111]`
- **Always show** an error message below the field, never in a toast
- **Never use** placeholder text as a label substitute

### Cards

- **Background:** `bg-[#111111]`
- **Border:** `border border-[#2a2a2a]`
- **Radius:** `rounded-lg` (8px)
- **Padding:** `p-6` (24px) default
- **Hover:** `border-[#3a3a3a]` + `bg-[#1a1a1a]` subtle lift

### Badges / Tags

- **Height:** 20px (inline), 24px (standalone)
- **Padding:** `px-2 py-0.5`
- **Radius:** `rounded-sm` or `rounded-full`
- **Font:** `text-xs font-medium`

---

## Animation Principles

- **Duration:** 100–200ms for micro-interactions, 200–350ms for transitions, never above 500ms
- **Easing:** `ease-out` for elements entering, `ease-in` for elements leaving
- **No bouncing:** This is a professional productivity tool, not a game
- **Respect `prefers-reduced-motion`:** All animations must be disabled when the user has this set

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Icons

- **Library:** Lucide React (consistent, minimal, MIT licensed)
- **Sizes:** `w-3 h-3` (12px), `w-4 h-4` (16px) ← default, `w-5 h-5` (20px), `w-6 h-6` (24px)
- **Never mix** Lucide with other icon libraries in the same view
- **Always use `aria-hidden="true"`** on decorative icons
- **Always provide `aria-label`** on icon-only buttons

---

## Responsive Breakpoints

```
sm:   640px   (large phones, landscape)
md:   768px   (tablets)
lg:   1024px  (small laptops)
xl:   1280px  (desktops)
2xl:  1536px  (large displays)
```

**Mobile-first:** All base styles target mobile. Use breakpoint prefixes to expand.

---

## Accessibility Requirements

- **Minimum contrast:** WCAG AA (4.5:1 for normal text, 3:1 for large text)
- **Focus visible:** All interactive elements must have a visible focus ring (`ring-2 ring-accent`)
- **Keyboard navigable:** Full tab order on all interactive elements
- **Screen reader:** All images have `alt`, all icons have `aria-label` or `aria-hidden`
- **No color-only information:** Never use only color to convey state (always pair with text or icon)
