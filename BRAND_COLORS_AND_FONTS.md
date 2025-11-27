# Naarimani Brand Colors & Fonts Guide

## 🎨 Color Palette

### Primary Colors (Main Brand Colors)

**Primary Pink (Main Brand Color)**
- HSL: `329 94% 45%`
- Hex: `#E91E63` (approximately)
- RGB: `rgb(233, 25, 99)` (approximately)
- Usage: Primary buttons, links, accents, theme color
- This is your **main brand color** - use this prominently in icons

**Accent Pink**
- HSL: `348 94% 45%`
- Hex: `#E91E4A` (approximately)
- RGB: `rgb(233, 25, 74)` (approximately)
- Usage: Accent elements, highlights

### Background Colors

**Background (Light Mode)**
- HSL: `329 58% 94%`
- Hex: `#F5E6ED` (approximately)
- RGB: `rgb(245, 230, 237)` (approximately)
- Usage: Main background color

**Card Background**
- HSL: `0 0% 100%`
- Hex: `#FFFFFF`
- RGB: `rgb(255, 255, 255)`
- Usage: Card backgrounds, modals

**Secondary Background**
- HSL: `330 33% 98%`
- Hex: `#FBF8FA` (approximately)
- RGB: `rgb(251, 248, 250)` (approximately)
- Usage: Secondary backgrounds

### Text Colors

**Foreground (Main Text)**
- HSL: `240 5.3% 26.1%`
- Hex: `#3F3F46` (approximately)
- RGB: `rgb(63, 63, 70)` (approximately)
- Usage: Primary text color

**Muted Text**
- HSL: `240 5.3% 46.1%`
- Hex: `#71717A` (approximately)
- RGB: `rgb(113, 113, 122)` (approximately)
- Usage: Secondary text, labels

### Border Colors

**Border**
- HSL: `330 20% 90%`
- Hex: `#E8DEE3` (approximately)
- RGB: `rgb(232, 222, 227)` (approximately)
- Usage: Borders, dividers

### Destructive/Error Colors

**Destructive (Red)**
- HSL: `0 84.2% 60.2%`
- Hex: `#EF4444` (approximately)
- RGB: `rgb(239, 68, 68)` (approximately)
- Usage: Error messages, delete actions

### Theme Colors (from manifest.json)

**Theme Color (PWA)**
- Hex: `#E91E63`
- This is the color shown in the browser's address bar on mobile

**Background Color (PWA)**
- Hex: `#FFFFFF`
- White background for splash screen

## 📝 Font Information

### Primary Font Family

**Font Name:** `PT Sans`
- **Source:** Google Fonts
- **Weights Available:**
  - Regular (400)
  - Bold (700)
  - Italic (400)
  - Bold Italic (700)

**Font Stack:**
```css
font-family: 'PT Sans', sans-serif;
```

**Usage:**
- Body text: `font-body` class
- Headlines: `font-headline` class
- All UI elements use this font

**Font URL:**
```
https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap
```

### Font Characteristics
- **Style:** Sans-serif
- **Readability:** Excellent for body text
- **Character:** Clean, modern, friendly
- **Language Support:** Good for English and many other languages

## 🎯 Recommended Color Combinations for Icons

### Option 1: Primary Pink on White (Recommended)
- **Background:** White (`#FFFFFF`)
- **Icon/Text:** Primary Pink (`#E91E63`)
- **Best for:** Main app icon, most use cases

### Option 2: White on Primary Pink
- **Background:** Primary Pink (`#E91E63`)
- **Icon/Text:** White (`#FFFFFF`)
- **Best for:** Alternative icon style, high contrast

### Option 3: Gradient (Premium Look)
- **Start:** Primary Pink (`#E91E63`)
- **End:** Accent Pink (`#E91E4A`)
- **Icon/Text:** White (`#FFFFFF`)
- **Best for:** Premium feel, modern look

### Option 4: Soft Background
- **Background:** Light Pink (`#F5E6ED` - background color)
- **Icon/Text:** Primary Pink (`#E91E63`)
- **Best for:** Subtle, elegant look

## 📐 Icon Specifications

### Required Sizes (from manifest.json)
- 72x72 px
- 96x96 px
- 128x128 px
- 144x144 px
- 152x152 px (Apple touch icon)
- 192x192 px
- 384x384 px
- 512x512 px (Main PWA icon)

### Design Guidelines
1. **Safe Zone:** Keep important elements within 80% of the icon size (for maskable icons)
2. **Contrast:** Ensure good contrast between icon and background
3. **Simplicity:** Icons should be recognizable at small sizes
4. **Brand Consistency:** Use the primary pink color (`#E91E63`) prominently

## 🎨 Quick Color Reference (Hex Codes)

```
Primary Pink:     #E91E63  (Main brand color)
Accent Pink:      #E91E4A  (Accent color)
Background:       #F5E6ED  (Light pink background)
White:            #FFFFFF  (Cards, backgrounds)
Text Dark:        #3F3F46  (Main text)
Text Muted:       #71717A  (Secondary text)
Border:           #E8DEE3  (Borders)
Error Red:        #EF4444  (Errors, destructive)
```

## 💡 Design Tips for Manifest Icons

1. **Use the Primary Pink (`#E91E63`)** as your main color
2. **Keep it simple** - icons should be recognizable at 72x72px
3. **High contrast** - ensure the icon stands out against the background
4. **Maskable icons** - design with safe zone in mind (80% of icon area)
5. **Consistent branding** - use the same design language across all sizes
6. **Test at small sizes** - make sure it's readable at 72x72px

## 📱 Platform-Specific Notes

### iOS (Apple)
- Use 152x152px and 192x192px for Apple touch icons
- Background should be solid color (white recommended)
- No transparency needed

### Android (PWA)
- 192x192px and 512x512px are most important
- Maskable icons should have safe zone
- Can use transparency in some cases

### General
- All icons should be PNG format
- Use lossless compression
- Ensure sharp edges (no anti-aliasing issues)

---

**Note:** The HSL values are the source of truth. Hex and RGB values are approximations. For exact colors, use the HSL values with a color converter tool.

