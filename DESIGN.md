# DESIGN.md

## Surface Mode & Three Dials
- **Mode:** Operate (creative 3D studio tool where precision, color accuracy, scanability, and fast tactile editing outrank ornament).
- **ENERGY:** 1 (Calm, studio-grade focus so the user's jersey colors stay the focal point).
- **RHYTHM:** 1 (Consistent, predictable studio chrome across tool tabs and viewports).
- **MOTION:** 1 (Purposeful hover/active states and camera preset easing; respects `prefers-reduced-motion: reduce`).

## Color System (WCAG AA Verified via `contrast-check.py`)
- **Dark Studio Surfaces:** Stage `#0d1118` to `#181e29` matte cyclorama, Chrome `#11151c`, Rail `#0d1016`.
- **Light Studio Surfaces:** Stage `#f8fafc` to `#dfe6ef` matte cyclorama, Chrome `#ffffff`, Rail `#f8fafc`.
- **Single Brand Accent:** Emerald (`#10b981` primary fill with `#020617` foreground at 7.95:1 contrast; `#047857` text on white at 5.48:1; `#34d399` text on `#11151c` at 9.52:1).
- **Muted Secondary Copy:** `#475569` on light surfaces (6.92:1) and `#94a3b8` on `#11151c` dark surfaces (7.14:1).

## Typography
- **UI Typeface:** `Inter` (explicitly confirmed by the product owner for the entire application interface; crisp tabular numerals enabled for hex codes, dimensions, angles, and percentages).
- **Jersey Print Fonts (Canvas/3D Only):** Anton, Bebas Neue, Oswald, Teko, Barlow Condensed, Rajdhani, Montserrat.

## Decision Rationales (R-31)
- **Dark studio default + Light toggle:** Creative 3D tools benefit from a neutral dark surround when judging bright jersey colors; Light mode is fully themed for daytime and mobile readability.
- **Matte cyclorama stage instead of dot grid:** A clean matte studio backdrop eliminates background clutter behind the 3D garment and avoids decorative grid noise.
- **Split 2D + 3D layout on desktop, 3D/2D switcher + bottom sheet on mobile:** Users need direct 3D spatial confidence alongside precise 2D graphic alignment without squeezing both onto a 390px phone screen.
- **Solid controls on viewport, blur reserved for modal backdrop:** Caps glassmorphism to 1 focal overlay so viewport buttons stay legible over light and dark jersey colors.
- **Semantic native controls + visible focus rings:** Every tool row, dropzone, tab, and dialog is keyboard navigable, labeled, and closable with `Escape`.
