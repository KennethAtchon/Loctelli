# Frontend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
pnpm install
```

### 2. Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Loctelli
```

**Important**: All public environment variables must be prefixed with `VITE_` in Vite.

### 3. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### 4. Build for Production

```bash
pnpm build
```

The built files will be in the `dist/` directory.

### 5. Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
frontend/
├── src/
│   ├── routes/          # TanStack Router routes
│   │   ├── __root.tsx   # Root layout
│   │   ├── index.tsx    # Home page
│   │   ├── account.tsx  # User account page
│   │   ├── auth/        # Auth routes
│   │   └── admin/       # Admin routes
│   ├── components/      # React components
│   ├── lib/             # Utilities and API client
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── types/           # TypeScript types
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies
```

## Key Differences from Next.js

### Environment Variables

- **Next.js**: `process.env.NEXT_PUBLIC_*`
- **Vite**: `import.meta.env.VITE_*`

### Routing

- **Next.js**: File-based routing with `app/` directory
- **Vite**: TanStack Router with `src/routes/` directory

### Navigation

- **Next.js**: `next/link` and `next/navigation`
- **Vite**: `@tanstack/react-router` `Link` and hooks

### Images

- **Next.js**: `next/image` component
- **Vite**: Standard `<img>` tag or import

## Troubleshooting

### Route Not Found

- Ensure route file follows TanStack Router naming convention
- Run `pnpm dev` to regenerate route tree
- Check route file exports `Route` correctly

### Environment Variables Not Working

- Ensure variables start with `VITE_` prefix
- Restart dev server after adding variables
- Check `src/vite-env.d.ts` type definitions

### Build Fails

- Run `tsc --noEmit` to check types
- Clear `.vite` cache: `rm -rf .vite`
- Check `vite.config.ts` for errors

## Next Steps

1. Install dependencies: `pnpm install`
2. Create `.env` file with `VITE_API_URL`
3. Run dev server: `pnpm dev`
4. Test all routes
5. Create remaining admin routes as needed
