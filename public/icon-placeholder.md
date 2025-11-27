# PWA Icons Required

To complete PWA setup, you need to create the following icon files in the `/public` directory:

- icon-72x72.png (72x72 pixels)
- icon-96x96.png (96x96 pixels)
- icon-128x128.png (128x128 pixels)
- icon-144x144.png (144x144 pixels)
- icon-152x152.png (152x152 pixels)
- icon-192x192.png (192x192 pixels)
- icon-384x384.png (384x384 pixels)
- icon-512x512.png (512x512 pixels)

## How to Generate Icons

1. Create a square logo/icon (at least 512x512 pixels)
2. Use an online tool like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://favicon.io/favicon-generator/
3. Or use ImageMagick:
   ```bash
   convert logo.png -resize 72x72 icon-72x72.png
   convert logo.png -resize 96x96 icon-96x96.png
   # ... and so on
   ```

## Icon Design Guidelines

- Use a simple, recognizable design
- Ensure good contrast for visibility
- Test on both light and dark backgrounds
- Follow platform-specific guidelines (iOS, Android)
- Use maskable icons for better Android support

## Temporary Solution

Until icons are created, the PWA will still work but may not display icons properly on home screens.

