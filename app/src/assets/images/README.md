# Assets - Images

This folder contains imported images used in React components.

## Structure

```
images/
  ├── logos/       # Brand logos
  ├── diagrams/    # Architecture diagrams
  └── ui/          # UI elements, backgrounds
```

## Usage

Import directly in components:

```tsx
import { logoDark, logoLight } from "../assets/images/logos";
import heroImage from "../assets/images/banners/hero.svg";

function Header() {
  return <img src={logoDark} alt="Ginva" />;
}
```

## Notes

- Vite handles image optimization automatically
- Use relative imports for local images
- Consider using public/ for large static assets
