# text2slide Design System

Dokumen ini berisi panduan visual dasar untuk menjaga tampilan text2slide tetap
konsisten di editor, template slide, export PNG/PDF, dan aset promosi.

## Brand Feel

text2slide menggunakan gaya visual yang tegas, modern, dan cocok untuk konten
edukasi digital. Tampilan utama harus terasa seperti creative tool: gelap,
fokus, kontras tinggi, dan punya aksen warna yang kuat.

## Color Palette

### Primary Dark UI

| Token | Color | Usage |
| --- | --- | --- |
| Background | `#101827` | App background utama |
| Panel | `#111827` | Sidebar, toolbar, control panel |
| Panel 2 | `#172033` | Secondary surface |
| Input | `#0C1422` | Input, textarea, select |
| Border | `#2A3A55` | Divider dan border default |
| Text | `#F8FAFC` | Teks utama |
| Muted Text | `#9AA8BC` | Label, helper text, metadata |

### Accent Colors

| Token | Color | Usage |
| --- | --- | --- |
| Lime Accent | `#A6FF1A` | CTA, highlight, active state |
| Sky Focus | `#7DD3FC` | Focus ring dan selected input |
| Blue Glow | `#2563EB` | Background glow / depth |
| Warning | `#FF9500` | Warning state |
| Error | `#FF3B30` | Error state |
| Success | `#34D399` | Success state |

## Theme Direction

| Theme | Feel | Main Usage |
| --- | --- | --- |
| Blue Promo | Dark blue, grid texture, lime accent | Default carousel and promo slides |
| Neon Course | Higher contrast, energetic accent | Course, offer, and launch content |
| Dark Code | Minimal dark UI, code/editor mood | Technical and developer content |

## Typography

| Role | Font | Style |
| --- | --- | --- |
| UI Text | `Inter`, system-ui, sans-serif | Clean, readable, practical |
| Slide Title | `Inter`, bold/black | Large, punchy, high contrast |
| Labels | `Inter`, 800-900 | Uppercase, compact, clear |
| Body Copy | `Inter`, 400-600 | Short paragraphs with strong spacing |

General rules:

- Use bold type for slide titles.
- Keep letter spacing normal for readable UI.
- Use uppercase labels only for short metadata, tags, or controls.
- Avoid long text blocks inside visual slides.

## Shape & Radius

| Element | Radius |
| --- | --- |
| Buttons | `8px` |
| Inputs | `8px` |
| Project cards | `8px` |
| Pills / tags | `999px` |
| Slide canvas | Keep fixed and clean, no excessive rounding |

## Slide Visual Style

- Use strong hierarchy: eyebrow, title, body, CTA/tag.
- Keep backgrounds dark with enough contrast for export.
- Use lime accent for key words, CTA, or brand moments.
- Use grid texture/noise lightly so exported slides still look clean.
- Logo/handle should be visible but not compete with the title.
- PPT-style templates should feel structured and presentation-ready.

## Export Sizes

| Asset | Size |
| --- | --- |
| Instagram carousel | `1080 x 1350` |
| Square variant | `1080 x 1080` |
| YouTube thumbnail target | `1280 x 720` |

## Do

- Use dark surfaces with clear contrast.
- Keep controls compact and easy to scan.
- Use one clear accent color per template.
- Make titles short, bold, and readable at mobile size.
- Keep exported assets clean without UI chrome.

## Avoid

- Too many accent colors in one slide.
- Low contrast text.
- Long paragraphs inside thumbnails or cover slides.
- Decorative elements that overlap important text.
- Changing brand colors per slide without purpose.
