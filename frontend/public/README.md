# PhenomPDF Logo Assets

This directory contains the official logo assets for PhenomPDF.

## Logo Files

### SVG Format (Vector - Recommended)
- **logo.svg** - Standard horizontal logo (400x120px)
- **logo-large.svg** - Large version for hero sections (600x200px)
- **logo-square.svg** - Square/Avatar version (256x256px)
- **logo-icon.svg** - Small icon version (64x64px)
- **favicon.svg** - Browser favicon (64x64px)

## Usage

### In React Components
Use the provided Logo component for consistency:

```jsx
import Logo from '../components/Logo';

<Logo size="small" />   // 32x32px
<Logo size="medium" />  // 48x48px
<Logo size="large" />   // 64x64px
```

### Direct SVG Usage
For static usage, reference the SVG files directly:

```html
<img src="/logo.svg" alt="PhenomPDF Logo" />
```

## Brand Colors

The logo uses a gradient of three colors:

- **Blue**: #2563EB (Primary)
- **Purple**: #9333EA (Middle)
- **Indigo**: #4F46E5 (Secondary)

## Logo Guidelines

1. **Minimum Size**: 64x64px for small icons
2. **Clear Space**: Maintain at least 10px of clear space around the logo
3. **Background**: Works best on white, light gray, or dark backgrounds
4. **Don't**: Stretch or distort the logo
5. **Don't**: Change the colors or gradient direction

## File Formats

- **SVG**: Use for all digital applications (web, apps, presentations)
- SVG files are infinitely scalable and maintain quality at any size
- All files include embedded gradients and effects

## Variations

### Horizontal Logo (logo.svg, logo-large.svg)
Best for:
- Website headers
- Landing pages
- Presentations
- Business cards

### Square Logo (logo-square.svg)
Best for:
- Profile pictures
- App icons
- Social media avatars
- Thumbnails

### Icon Logo (logo-icon.svg, favicon.svg)
Best for:
- Favicon
- Small buttons
- Navigation icons
- Tool badges
