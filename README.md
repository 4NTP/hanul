# Hanul

A full-stack monorepo application built with modern technologies for scalable web development.

## Open Source Dependencies

This project leverages numerous open source packages to provide a robust development experience. Below is a comprehensive list of the key dependencies used across the monorepo.

### Core Framework Dependencies

#### Backend (NestJS)

- **[@nestjs/common](https://github.com/nestjs/nest)** (v11.1.6) - Core NestJS framework with decorators and common utilities
- **[@nestjs/core](https://github.com/nestjs/nest)** (v11.1.6) - NestJS core module system and dependency injection
- **[@nestjs/platform-express](https://github.com/nestjs/nest)** (v11.1.6) - Express.js platform adapter for NestJS
- **[@nestjs/config](https://github.com/nestjs/nest)** (v4.0.2) - Configuration management for NestJS applications
- **[@nestjs/jwt](https://github.com/nestjs/nest)** (v11.0.0) - JWT authentication utilities for NestJS
- **[@nestjs/swagger](https://github.com/nestjs/nest)** (v11.2.0) - OpenAPI/Swagger documentation generation

#### Frontend (Next.js & React)

- **[next](https://github.com/vercel/next.js)** (v15.4.6) - React framework for production with server-side rendering
- **[react](https://github.com/facebook/react)** (v19.1.1) - JavaScript library for building user interfaces
- **[react-dom](https://github.com/facebook/react)** (v19.1.1) - React DOM renderer for web applications
- **[next-intl](https://github.com/amannn/next-intl)** (v4.3.4) - Internationalization library for Next.js
- **[next-themes](https://github.com/pacocoursey/next-themes)** (v0.4.6) - Theme management for Next.js applications

### Database & ORM

- **[@prisma/client](https://github.com/prisma/prisma)** (v6.14.0) - Type-safe database client
- **[prisma](https://github.com/prisma/prisma)** (v6.14.0) - Modern database toolkit and ORM
- **[zod-prisma-types](https://github.com/chrishoermann/zod-prisma-types)** (v3.2.4) - Generate Zod schemas from Prisma schema

### State Management & Data Fetching

- **[@tanstack/react-query](https://github.com/TanStack/query)** (v5.84.2) - Powerful data synchronization for React
- **[zod](https://github.com/colinhacks/zod)** (v4.0.17) - TypeScript-first schema declaration and validation library
- **[nestjs-zod](https://github.com/risenforces/nestjs-zod)** (v5.0.0-beta.20250812T233646) - Integration of Zod with NestJS

### AI Supports

- **[openai](https://github.com/openai/openai-node)** (4.21.0) - Chat complements support by openAi

### UI Components & Styling

- **[@radix-ui/react-dropdown-menu](https://github.com/radix-ui/primitives)** (v2.1.15) - Accessible dropdown menu component
- **[@radix-ui/react-slot](https://github.com/radix-ui/primitives)** (v1.2.3) - Flexible component composition utility
- **[tailwindcss](https://github.com/tailwindlabs/tailwindcss)** (v4.1.11) - Utility-first CSS framework
- **[class-variance-authority](https://github.com/joe-bell/cva)** (v0.7.1) - Create type-safe component variants
- **[clsx](https://github.com/lukeed/clsx)** (v2.1.1) - Utility for constructing className strings
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** (v3.3.1) - Merge Tailwind CSS classes without style conflicts
- **[lucide-react](https://github.com/lucide-icons/lucide)** (v0.539.0) - Beautiful & consistent icon toolkit

### Security & Authentication

- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** (v6.0.0) - Password hashing library
- **[helmet](https://github.com/helmetjs/helmet)** (v8.1.0) - Security middleware for Express.js applications

### Utilities & Development Tools

- **[luxon](https://github.com/moment/luxon)** (v3.7.1) - Modern JavaScript date library
- **[rxjs](https://github.com/ReactiveX/rxjs)** (v7.8.2) - Reactive Extensions library for JavaScript
- **[reflect-metadata](https://github.com/rbuckton/reflect-metadata)** (v0.2.2) - Metadata reflection API polyfill

### Logging

- **[winston](https://github.com/winstonjs/winston)** (v3.17.0) - Multi-transport async logging library
- **[winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file)** (v5.0.0) - Daily rotating file transport for Winston
- **[nest-winston](https://github.com/gremo/nest-winston)** (v1.10.2) - Winston integration for NestJS

### Build Tools & Monorepo Management

- **[turbo](https://github.com/vercel/turbo)** (v2.5.6) - High-performance build system for JavaScript and TypeScript codebases
- **[@dotenvx/dotenvx](https://github.com/dotenvx/dotenvx)** (v1.48.4) - Enhanced environment variable management

### Code Quality & Linting

- **[eslint](https://github.com/eslint/eslint)** (v9.33.0) - JavaScript and TypeScript linter
- **[prettier](https://github.com/prettier/prettier)** (v3.6.2) - Code formatter
- **[typescript](https://github.com/microsoft/TypeScript)** (v5.9.2) - TypeScript language and compiler
- **[typescript-eslint](https://github.com/typescript-eslint/typescript-eslint)** (v8.39.0) - TypeScript support for ESLint
- **[husky](https://github.com/typicode/husky)** (v9.1.7) - Git hooks made easy
- **[lint-staged](https://github.com/lint-staged/lint-staged)** (v16.1.5) - Run linters on git staged files

### Git & Commit Management

- **[@commitlint/cli](https://github.com/conventional-changelog/commitlint)** (v19.8.1) - Lint commit messages
- **[@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint)** (v19.8.1) - Conventional commit format rules

### Testing

- **[jest](https://github.com/jestjs/jest)** (v30.0.5) - JavaScript testing framework
- **[@testing-library/react](https://github.com/testing-library/react-testing-library)** (v16.3.0) - React testing utilities
- **[@testing-library/jest-dom](https://github.com/testing-library/jest-dom)** (v6.6.4) - Custom Jest matchers for DOM testing
- **[@playwright/test](https://github.com/microsoft/playwright)** (v1.54.2) - End-to-end testing framework
- **[supertest](https://github.com/ladjs/supertest)** (v7.1.4) - HTTP assertion library for testing APIs

### Package Management

- **[pnpm](https://github.com/pnpm/pnpm)** (v10.14.0) - Fast, disk space efficient package manager

## Project Structure

This monorepo contains:

- **apps/server**: NestJS backend API with PostgreSQL database
- **apps/web**: Next.js frontend with internationalization support
- **packages/ui**: Shared UI component library with Tailwind CSS
- **packages/eslint-config**: Shared ESLint configuration
- **packages/jest-config**: Shared Jest testing configuration
- **packages/typescript-config**: Shared TypeScript configuration
