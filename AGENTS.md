# Repository Guidelines

## Project Structure & Module Organization
This Vite + React + TypeScript app stores presentational components in `components/`, while form logic, persistence, and pricing utilities live in `app/` (see `useQuoteForm.ts`, `storage.ts`, `calculations.ts`). `index.tsx` bootstraps the root, `index.css` provides global styles, `index.html` is the Vite template, and `metadata.json` feeds AI Studio metadata. Add shared types to `app/types.ts` and keep multi-use helpers beside related feature modules. Treat generated PDFs and other runtime artifacts as temporary files.

## Build, Test, and Development Commands
Install dependencies with `npm install`. Run `npm run dev` for the hot-reload server; append `-- --host` to expose it on your LAN. Use `npm run build` before merging to validate the production bundle and TypeScript. `npm run preview` serves the built output for deployment smoke tests.

## Coding Style & Naming Conventions
Use 4-space indentation, single quotes, and TypeScript annotations to stay consistent with the existing codebase. Name components and contexts with PascalCase (`QuotePreviewModal`), hooks with a `use` prefix, and helpers in camelCase. Prefer functional components with typed props, memoize heavier calculations via `app` utilities, and centralize shared state in the quote context instead of duplicating local storage access across components.

## Testing Guidelines
Automated coverage is pending; follow `TESTING.md` when introducing Vitest + React Testing Library suites. Name specs `*.test.tsx`, co-locate them with the implementation or under `__tests__/`, and focus first on calculation accuracy, localStorage persistence, and PDF export flows. Until tests exist, document manual validation of those user journeys in pull requests.

## Commit & Pull Request Guidelines
Write imperative commit subjects under ~72 characters and separate feature, refactor, and chore work. Summaries should note behaviour changes and touched modules (e.g., `components/QuoteForm.tsx`, `app/storage.ts`). PRs must include linked issues, screenshots or GIFs for UI updates, and the latest command output (`npm run build`, plus any new test scripts). Keep `.env.local` and other secrets out of commits.

## Configuration & Secrets
No environment variables are required by default. Document any new variables in `README.md` and provide non-sensitive defaults so `npm run dev` still starts without production credentials. Generated PDFs, logs, and local secrets should remain untracked.
