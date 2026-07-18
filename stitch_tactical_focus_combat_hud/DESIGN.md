---
name: Focus Combat HUD
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#141313'
  surface-container-high: '#2b2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c5c7c2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c9c6c5'
  primary: '#e5e2e1'
  on-primary: '#313030'
  primary-container: '#c9c6c5'
  on-primary-container: '#535252'
  inverse-primary: '#5f5e5d'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#e6e2e2'
  on-tertiary: '#313030'
  tertiary-container: '#cac6c6'
  on-tertiary-container: '#545252'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e6e1e1'
  tertiary-fixed-dim: '#c9c5c5'
  on-tertiary-fixed: '#1c1b1c'
  on-tertiary-fixed-variant: '#484646'
  background: '#0a0a0a'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
  crimson: '#DC143C'
  amber: '#FFBF00'
  emerald: '#50C878'
typography:
  value-xl:
    fontFamily: Anton
    fontSize: 96px
    fontWeight: '400'
    lineHeight: '1.0'
    letterSpacing: 0.02em
  value-lg:
    fontFamily: Anton
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.0'
    letterSpacing: 0.02em
  label-header:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.25em
  log-body:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
    letterSpacing: 0em
  technical-prefix:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
spacing:
  unit: 4px
  gutter: 8px
  container-padding: 16px
  border-weight: 2px
---

## Brand & Style
The brand identity is rooted in **Cyber-Brutalism** and **Tactical HUD** aesthetics. It evokes a sense of high-stakes performance monitoring, urgency, and technical precision. The design is intentionally "raw" and "unrefined," utilizing heavy borders, monospaced typography, and high-contrast color shifts to simulate a military-grade or developer-centric terminal interface.

Key stylistic markers include:
- **Digital Gritty:** Use of scanlines, mesh overlays, and diagonal stripe patterns to simulate CRT or hardware displays.
- **Urgency-Driven:** Motion-based feedback through "pulsing" glows and blinking cursors.
- **Technical Utility:** Every element feels functional and part of a larger "operating system."

## Colors
The palette is primarily monochromatic, using deep blacks and varying grays to establish a "terminal" foundation. Semantic color is used aggressively for status signaling:
- **Crimson:** Reserved for penalties, high-threat alerts, and critical errors.
- **Amber:** Used for core performance metrics, high-value rewards (XP), and warnings.
- **Emerald:** Indicates stability, unlocked states, and successful system syncs.
- **Backgrounds:** Use a pitch-black (#0a0a0a) base with slightly elevated surfaces (#141313) to maintain high contrast with light-gray text and borders.

## Typography
The typography system uses three distinct families to categorize information hierarchy:
- **Anton (Display):** Used for massive, high-impact numerical values and session status. It should always be uppercase.
- **Space Grotesk (Navigation/Labels):** A wide, geometric sans-serif used for headers and navigational anchors. Highly tracked (0.25em) to maximize legibility at small sizes.
- **JetBrains Mono (System/Log):** A monospaced font used for all technical data, logs, and input fields to maintain the developer/hacker aesthetic. 

**Formatting Note:** Technical terms should often be wrapped in square brackets (e.g., `[CORE_TEMP]`) or prefixed with a command prompt (e.g., `C:\>`).

## Layout & Spacing
The layout uses a **12-column fluid grid** system optimized for edge-to-edge utility. 
- **Structure:** A fixed top navigation bar (32px height) is always present. The main content is divided into a left sidebar (2 columns), a central focus panel (7 columns), and a right "stakes" panel (3 columns).
- **Rhythm:** A 4px base unit controls spacing. Tight gutters (8px) between panels emphasize a crowded, "data-dense" HUD look.
- **Margins:** Global padding for the screen is 24px, while internal container padding is 16px.

## Elevation & Depth
This system eschews traditional shadows in favor of **Bold Borders** and **Tonal Layering**.
- **Structural Outlines:** All containers must have a 2px solid border (`#8e9192`). 
- **Active States:** Instead of shadows, use "reverse-offset" borders. An active button moves 2px down/right while a secondary border appears at the top/left to simulate a physical "click" into the surface.
- **Visual Texture:** Use semi-transparent overlays (scanlines/mesh) to create depth without using Z-axis elevation.
- **Glows:** For high-priority elements (like the Multiplier Core), use CSS `box-shadow` to create a "bloom" effect rather than an elevation shadow.

## Shapes
The shape language is strictly **Sharp (0px)**. There are no rounded corners in this design system. This reinforces the brutalist, industrial nature of the interface. Circles are used only for status rings or graphical indicators, never for container corners.

## Components
- **Tactical Buttons:** Flat, rectangular, with 2px borders. Primary buttons use a full-fill background (Primary or On-Surface) with inverted text. Hover states should feature a slide-in secondary color fill.
- **Progress Bars:** Represented as segmented blocks or solid fills with sharp edges. Critical status bars should "pulse" using opacity keyframes.
- **Data Cells:** Containers with a `technical-prefix` header and a `value-lg` body. Often feature a mesh or diagonal stripe background to indicate a "locked" or "inactive" state.
- **Combat Logs:** List items with vertical left-hand borders color-coded to status (Crimson for warnings).
- **Command Line:** A single-line input field with a monospaced font and a blinking block cursor.
- **HUD Tabs:** Small, uppercase labels with a border-bottom indicator when active.