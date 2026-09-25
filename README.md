# Savings Goals

A modern, private client-side savings goals tracker with deadline forecasting, deposit and withdrawal history, and visual analytics.

## Tech Stack

- React 19 + Vite + TypeScript (SPA, zero backend dependencies)
- React Router v7 (createBrowserRouter, lazy-loaded routes)
- Tailwind CSS v4 with @tailwindcss/vite plugin
- shadcn/ui component primitives (Radix UI)
- Lucide React for consistent vector iconography
- Motion for transitions and animations
- React Hook Form + Zod for validation
- Recharts for savings analytics and progress forecasting
- Zustand with persist middleware (local device storage)
- next-themes for flashless light/dark mode
- date-fns for calculations
- @fontsource-variable/inter for self-hosted typography

## Project Setup Commands

### 1. Initialize Project
```bash
npm create vite@latest savings-goals -- --template react-ts
cd savings-goals
```

### 2. Install Tailwind CSS v4 & Vite Plugin
```bash
npm install tailwindcss @tailwindcss/vite
```

### 3. Install Core Libraries
```bash
npm install react-router-dom zustand motion react-hook-form zod @hookform/resolvers recharts date-fns lucide-react next-themes sonner @fontsource-variable/inter clsx tailwind-merge class-variance-authority @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-alert-dialog @radix-ui/react-progress @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-popover @radix-ui/react-tooltip
```

### 4. Configure Path Aliases
Ensure `@/*` points to `./src/*` in `vite.config.ts` and `tsconfig.json`.

## Run, Build, and Deploy Steps

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build Locally
```bash
npm run preview
```

### Deploy to Static Hosts
- **Vercel**: Pre-configured with `vercel.json` rewrites for SPA client-side routing.
- **Netlify**: Pre-configured with `public/_redirects` routing all requests to `index.html`.

## Strict Privacy Principles
- All target calculations and financial amounts stay on the user device.
- Zero third-party tracking, cookies, or external analytics scripts.
- Export data anytime in CSV or JSON format from Settings.
