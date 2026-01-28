# Digital Magazine Flipbook

A premium, production-grade digital magazine experience built with React. Features a realistic page-flip animation, intelligent lazy loading, and elegant UI.

## Features

- 📖 **Realistic Flipbook** - Smooth page-turning animations with shadows and depth
- 🚀 **Lazy Loading** - Intelligent page streaming for optimal performance
- 📱 **Responsive** - Desktop double-page spread, mobile single-page view
- ⌨️ **Full Navigation** - Mouse, touch, keyboard, and direct page jump
- 🎨 **Premium Design** - Dark theme with gold accents
- ♿ **Accessible** - ARIA labels, keyboard navigation, screen reader support
- 📥 **Download** - One-click PDF download

## Quick Start

```bash
npm install
npm run dev
```

## Configuration

Edit `src/config/magazine.ts` to customize:

```typescript
export const MAGAZINE_CONFIG = {
  // PDF source - replace with your GitHub Releases URL
  PDF_URL: 'https://github.com/your-repo/releases/download/v1.0/magazine.pdf',
  
  // Logo stored in public folder
  LOGO_PATH: '/logo.png',
  
  // Branding
  BRAND_NAME: 'Your Magazine',
  TAGLINE: 'presents',
};
```

## Replacing the PDF

1. Upload your PDF to GitHub Releases
2. Copy the direct download URL
3. Update `PDF_URL` in `src/config/magazine.ts`

## Replacing the Logo

1. Add your logo to the `/public` folder (e.g., `/public/logo.png`)
2. Update `LOGO_PATH` in `src/config/magazine.ts`
3. Supported formats: PNG, SVG, WebP

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← / → | Previous / Next page |
| Home | Go to first page |
| End | Go to last page |
| F | Toggle fullscreen |
| Space | Next page |

## Deployment

Deploy to Vercel or Netlify with `npm run build`.

## Tech Stack

- React 18 + TypeScript
- react-pdf (PDF.js)
- Framer Motion (animations)
- Zustand (state management)
- Tailwind CSS (styling)
