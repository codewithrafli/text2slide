# Style Guide

Design system inspired by [Family.co](https://family.co/) — "Radical Softness" meets editorial typography.

## Design Philosophy

**"Premium Editorial meets Modern Web3"**

- Warm, approachable serif typography (old school)
- Hyper-fluid animations and 3D elements (new school)
- Strict monochrome UI that frames colorful content
- Soft, rounded geometry that feels non-intimidating

---

## Typography

### Brand Typeface (Headings)

| Property       | Value                                     |
| -------------- | ----------------------------------------- |
| Font Family    | `Fraunces` (Google Fonts) or `Clearface`  |
| Weights        | Regular (400), Medium (500)               |
| Letter Spacing | `-0.02em` to `-0.04em` (tight, editorial) |
| Usage          | Headlines, hero text, brand statements    |

**Why Fraunces?** It has the same "soft serif" warmth as Family's custom typeface — quirky curves from the 1970s vibe.

### UI Typeface (Body & Labels)

| Property    | Value                                                 |
| ----------- | ----------------------------------------------------- |
| Font Family | `Inter`, system-ui, sans-serif                        |
| Weights     | Regular (400), Medium (500), Semibold (600)           |
| Usage       | Body text, buttons, inputs, labels, dense information |

---

## Color Palette

### Dark Theme (Primary)

| Token              | Hex       | Usage                        |
| ------------------ | --------- | ---------------------------- |
| `--bg-primary`     | `#050505` | Page background              |
| `--bg-secondary`   | `#121212` | Cards, surfaces              |
| `--bg-tertiary`    | `#1E1E1E` | Hover states, elevated cards |
| `--text-primary`   | `#FFFFFF` | Main text                    |
| `--text-secondary` | `#9CA3AF` | Muted text, labels           |
| `--border-subtle`  | `#27272A` | Input borders, dividers      |

### Light Theme (Secondary)

| Token              | Hex       | Usage               |
| ------------------ | --------- | ------------------- |
| `--bg-primary`     | `#FFFFFF` | Page background     |
| `--bg-secondary`   | `#F2F4F7` | Cards, hover states |
| `--text-primary`   | `#000000` | Main text           |
| `--text-secondary` | `#666666` | Muted text          |

### Functional Colors

| Token              | Hex       | Usage                         |
| ------------------ | --------- | ----------------------------- |
| `--accent-success` | `#34D399` | Success states, confirmations |
| `--accent-error`   | `#FF3B30` | Error states                  |
| `--accent-warning` | `#FF9500` | Warnings                      |

---

## Shapes & Geometry

**Core principle:** "Super-rounded" — soft, bubbly, non-intimidating.

| Token           | Value    | Usage                           |
| --------------- | -------- | ------------------------------- |
| `--radius-sm`   | `12px`   | Inputs, small buttons           |
| `--radius-md`   | `24px`   | Cards, modals                   |
| `--radius-lg`   | `32px`   | Hero sections, large containers |
| `--radius-pill` | `9999px` | Pill buttons, tags              |

### Depth

- **No flat design** — use subtle depth through contrast (black vs dark gray)
- **Glassmorphism** — `backdrop-filter: blur(20px)` on sticky headers
- **Shadows** — Soft, diffuse. Used sparingly on floating elements

---

## Animation & Motion

**Principle:** "Continuous Motion" — elements flow, never just appear.

### Easing Functions

| Token            | Value                                 | Usage               |
| ---------------- | ------------------------------------- | ------------------- |
| `--ease-smooth`  | `cubic-bezier(0.25, 1, 0.5, 1)`       | General transitions |
| `--ease-elastic` | `cubic-bezier(0.68, -0.6, 0.32, 1.6)` | Playful bounces     |

### Micro-Interactions

| Element       | Effect                                       |
| ------------- | -------------------------------------------- |
| Button hover  | `scale(1.02)` + subtle brightness shift      |
| Card hover    | Gentle lift with soft shadow expansion       |
| List items    | Staggered entrance (10ms delay between each) |
| Page sections | Fade + slide up on scroll                    |

### Implementation

Use `framer-motion` for React animations. Key patterns:

- **Layout animations** — elements morph smoothly when resizing
- **Stagger children** — list items animate sequentially
- **Scroll-linked** — parallax effects on decorative elements

---

## CSS Variables Reference

```css
:root {
  /* Typography */
  --font-brand: 'Fraunces', 'Clearface', serif;
  --font-ui: 'Inter', system-ui, sans-serif;

  /* Colors - Dark Theme */
  --bg-primary: #050505;
  --bg-secondary: #121212;
  --bg-tertiary: #1e1e1e;

  --text-primary: #ffffff;
  --text-secondary: #9ca3af;

  --border-subtle: #27272a;

  --accent-success: #34d399;
  --accent-error: #ff3b30;
  --accent-warning: #ff9500;

  /* Spacing & Radius */
  --radius-sm: 12px;
  --radius-md: 24px;
  --radius-lg: 32px;
  --radius-pill: 9999px;

  /* Animation */
  --ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
  --ease-smooth: cubic-bezier(0.25, 1, 0.5, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-ui);
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3 {
  font-family: var(--font-brand);
  font-weight: 500;
  letter-spacing: -0.03em;
}
```

---

## Component Patterns

### Buttons

- **Primary:** Gradient or solid fill, pill-shaped (`border-radius: 9999px`)
- **Secondary:** Ghost/outline style with subtle border
- **Hover:** Scale up slightly + glow effect

### Cards

- Background: `--bg-secondary`
- Border: 1px `--border-subtle` or none
- Radius: `--radius-md` (24px)
- Hover: Subtle lift + brightness increase

### Inputs

- Background: `--bg-secondary` or transparent
- Border: 1px `--border-subtle`
- Radius: `--radius-sm` (12px)
- Focus: Border brightens, subtle glow

---

## Visual Assets

### 3D Elements

- Use high-fidelity 3D renders for hero sections
- Soft, diffuse colored shadows to make elements "float"
- Subtle rotation/parallax on scroll

### Illustrations

- Soft, rounded character style
- Limited color palette per illustration
- Should feel "friendly" and approachable

---

## Summary

| Attribute  | Approach                                      |
| ---------- | --------------------------------------------- |
| Typography | Warm serif (Fraunces) + clean sans (Inter)    |
| Colors     | Strict monochrome, functional accents only    |
| Shapes     | Super-rounded, pill buttons, soft corners     |
| Motion     | Fluid, continuous, staggered, scroll-linked   |
| Philosophy | "Radical Softness" — premium but approachable |
