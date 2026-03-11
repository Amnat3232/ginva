# Images Directory

Static images for the Ginva protocol.

## Folder Structure

- `logos/` - Protocol logos (logo.svg, logo-dark.svg, etc.)
- `icons/` - UI icons and favicons
- `banners/` - Hero banners, marketing images
- `features/` - Feature showcase images

## Usage

```tsx
// In components
import logo from '../assets/images/logos/logo.svg';
<img src={logo} alt="Ginva" />

// Or from public (for static assets)
<img src="/images/logos/logo.svg" alt="Ginva" />
```

## Guidelines

- Use SVG for logos and icons (scalable)
- Optimize PNG/JPG for photos (use WebP when possible)
- Keep file sizes under 500KB for web images
