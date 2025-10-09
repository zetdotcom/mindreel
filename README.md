# mindreel

MindReel is an Electron + Vite + React application.

## Tailwind CSS v4

This project has been upgraded to Tailwind CSS v4 using the new “CSS‑first” approach:

- No traditional `tailwind.config.js` customization is required for the current feature set (the existing file is intentionally minimal and can be removed later if unused).
- Global styles import Tailwind via a single line in `src/index.css`:
  ```@import "tailwindcss";```
- Additional design tokens are defined directly with the `@theme` at-rule (see `src/index.css`).
- A custom utility example (`focus-ring`) is declared with `@utility`.
- Autoprefixing is handled automatically by the Tailwind v4 PostCSS plugin (`@tailwindcss/postcss`).

If you need to extend Tailwind later (extra colors, plugins, etc.), you can:
1. Reintroduce or expand `tailwind.config.js` (exporting an object).
2. Or continue to add tokens via `@theme` in your CSS.

## Development

Install dependencies:
```
npm install
```

Start the app (Electron + Vite dev servers):
```
npm run start
```

## Scripts

- `start` – Launch Electron in development with Vite
- `make` / `package` / `publish` – Electron Forge lifecycle commands
- `typecheck` – Run TypeScript without emitting

## Notes

If the dev process appears to hang during “Building main process and preload bundles…”, enable verbose logs:
```
DEBUG=@electron-forge:plugin-vite*,vite:* npm run start
```

## License

MIT
