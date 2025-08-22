# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack monorepo called "Hanul" using Turborepo with two main applications:

- **Server** (`apps/server`): NestJS API with PostgreSQL database via Prisma ORM
- **Web** (`apps/web`): Next.js frontend with internationalization and Tailwind CSS

## Common Development Commands

Use these commands from the root directory:

```bash
# Install dependencies
pnpm install

# Start development servers (both apps)
pnpm dev

# Build all applications
pnpm build

# Run tests across all packages
pnpm test

# Lint all code
pnpm lint

# Format all code
pnpm format

# Type check all packages
pnpm check-types
```

### Server-specific commands (from apps/server):

```bash
# Start server in development
pnpm dev

# Start server in debug mode
pnpm start:debug

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Generate Prisma client after schema changes
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

### Web-specific commands (from apps/web):

```bash
# Start web app in development (port 3001)
pnpm dev

# Run unit tests
pnpm test

# Run E2E tests with Playwright
pnpm test:e2e
```

## Architecture

### Monorepo Structure

- **Turborepo** manages build pipeline and caching
- **pnpm workspaces** handle package management
- Shared packages in `packages/` (eslint-config, typescript-config, ui, jest-config)

### Backend (NestJS)

- **Framework**: NestJS with Express
- **Database**: PostgreSQL via Prisma ORM
- **Validation**: Zod schemas with nestjs-zod integration
- **Auth**: JWT-based authentication with bcrypt
- **Logging**: Winston with daily rotating file logs
- **API Documentation**: Swagger/OpenAPI
- **Security**: Helmet middleware, CORS enabled

Key server modules:

- `users/`: User management with CRUD operations
- `tokens/`: JWT token handling
- `db/`: Database service wrapper around Prisma

Database schema is in `prisma/schema.prisma` with Prisma client generated to `apps/server/src/generated/prisma/`.

### Frontend (Next.js)

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **Internationalization**: next-intl for i18n (English/Korean)
- **State Management**: React Query for server state
- **Theming**: next-themes for dark/light mode
- **Testing**: Jest + React Testing Library + Playwright

### Code Quality

- **ESLint**: Shared configuration across all packages
- **Prettier**: Code formatting with lint-staged
- **Husky**: Git hooks for pre-commit linting/formatting
- **Commitlint**: Conventional commits enforced
- **TypeScript**: Strict configuration across all packages

## Development Guidelines

### Commit Convention

Use conventional commits format:

- `feat(scope): add new feature`
- `fix(scope): fix bug`
- `refactor(scope): refactor code`
- Scopes: `web`, `server`, `ui`, `db`, `infra`

### Database Changes

1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev` to create migration
3. Prisma client auto-regenerates in `apps/server/src/generated/prisma/`

### Adding Dependencies

- Root-level deps: Add to root `package.json`
- App-specific deps: Add to respective app's `package.json`
- Shared deps: Consider adding to appropriate package in `packages/`
- **IMPORTANT**: When adding any new open source library dependency, you MUST update the `README.md` file to include the new library in the "Open Source Dependencies" section with proper categorization, version, and description

### Environment Variables

- Development: `.env.local` or `.env.dev`
- Server looks for env files in monorepo root: `../../.env.local`, `../../.env.dev`, `../../.env`
- Required: `DATABASE_URL`, `PORT` (optional, defaults to 3000)

## Development Rules & Best Practices

### Code Quality Standards

- **Type Safety**: No `any` in public APIs; prefer explicit types and inference
- **Modularity**: Small, focused modules with feature-first folder structure
- **Error Handling**: Use typed error envelopes; no raw throws across boundaries
- **Logging**: Structured logs with correlation IDs in server
- **Consistency**: Always reference existing code patterns before introducing new approaches

### Database (Prisma) Guidelines

- Model naming is singular; tables auto-pluralized by Prisma
- Always index foreign keys; use `@id`, `@unique`, `@index` appropriately
- Use transactions for multi-step writes via `prisma.$transaction`
- Avoid N+1 queries; use `include/select` narrowly
- Configure connection pooling and timeouts conservatively

### Server (NestJS) Standards

- **Architecture**: Feature-based modules (`UserModule`, `AuthModule`, etc.)
- **Controllers**: Thin controllers that delegate to services
- **Validation**: Zod schemas co-located with features; validate all inputs/outputs
- **Error Handling**: Map domain errors to HTTP codes via exception filters
- **API Design**: RESTful endpoints with consistent response envelopes
- **Performance**: Batch I/O operations, paginate reads, structured logging

### Frontend (Next.js) Standards

- **Data Layer**: Typed REST clients with centralized base URL/headers
- **Network Communication**: ALWAYS use TanStack Query (React Query) for all HTTP requests - never use raw fetch() or axios directly in components
- **API Layer**: Create dedicated API service functions in `lib/api/` and use them with TanStack Query mutations/queries
- **Rendering**: Balance SSR/CSR to avoid content flash/reflow
- **Hooks**: Encapsulate loading/error/suspense in reusable hooks
- **UI**: Use `@hanul/ui` primitives and shadcn patterns exclusively
- **Performance**: Server data fetching for SEO, `next/image` for images

### Internationalization (next-intl)

- Messages in `apps/web/messages/{locale}.json` with dot-delimited keys
- Use `useTranslations('namespace')` and `useFormatter()`
- No hard-coded UI strings; localize all text including ARIA labels
- Use next-intl navigation helpers to preserve active locale

### UI Component Library

- Follow shadcn patterns with `class-variance-authority` for variants
- Centralize theme tokens in `globals.css`
- Use Radix primitives for accessibility
- Support dark mode by default
- Tree-shakeable exports with no side-effects

### Validation Strategy (Zod)

- Define Zod schemas for all external inputs/outputs
- Infer TypeScript types via `z.infer<typeof Schema>`
- Server: Validate requests with `nestjs-zod`, convert errors to 400 responses
- Web: Parse REST responses with Zod before using data
- Co-locate schemas: `feature.schema.ts` near controllers/services

### Testing Approach

- Unit tests for pure logic; integration for module boundaries; E2E for flows
- Keep tests fast and isolated; avoid cross-test state
- Mock Prisma layer in unit tests; use test DB for E2E
- Snapshot tests only for stable, low-noise UI

### Key File Locations

- Database schema: `prisma/schema.prisma`
- Server entry: `apps/server/src/main.ts`
- Web entry: `apps/web/app/[locale]/layout.tsx`
- Shared UI components: `packages/ui/`
- Build config: `turbo.json`
- Cursor rules: `.cursor/rules/` (development guidelines)
