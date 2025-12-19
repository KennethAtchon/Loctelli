# Loctelli Frontend

✅ **Migration Completed**: December 18, 2025

Modern frontend application built with Vite, React, TanStack Router, and TanStack Query. Successfully migrated from Next.js 15.4.7.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 19** - UI library
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Data fetching and state management
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Shadcn/ui** - UI components

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
VITE_API_URL=http://localhost:8000
```

### Development

```bash
# Start dev server
pnpm dev

# The app will be available at http://localhost:3000
```

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Project Structure

```
frontend/
├── src/
│   ├── routes/          # TanStack Router routes
│   ├── components/       # React components
│   ├── lib/             # Utilities and API client
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── types/           # TypeScript types
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies
```

## Environment Variables

All public environment variables must be prefixed with `VITE_`:

- `VITE_API_URL` - Backend API URL (default: http://localhost:8000)
- `VITE_APP_NAME` - Application name

## Routing

Routes are defined in `src/routes/` using TanStack Router's file-based routing:

- `__root.tsx` - Root layout
- `index.tsx` - Home page (`/`)
- `auth/login.tsx` - Login page (`/auth/login`)
- `auth/register.tsx` - Register page (`/auth/register`)

## API Client

The API client is located in `src/lib/api/` and uses the `/api/proxy` prefix for all backend calls.

## Migration from Next.js

This project was migrated from Next.js. See `migration/11-vite-tanstack-migration.md` for details.

## License

Private - Loctelli
