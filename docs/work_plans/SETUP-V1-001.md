# Work Plan: SETUP-V1-001 - Repository Initialization & Core Tooling

*   **Task ID**: SETUP-V1-001
*   **Phase**: 1 - Foundational Setup
*   **Status**: Not Started
*   **Estimate**: 0.5 Days
*   **Author**: Gemini
*   **Dependencies**: Git installed, Node.js (LTS) installed, npm/npx installed.
*   **Related Docs**: `docs/architecture_v2.md`, `docs/STYLE_GUIDE.md` (To be created by STYLE-V1-001)

## Problem Statement

Initialize the project's Git repository and set up the essential development tooling for a Node.js/TypeScript project using Genkit. This includes package management, TypeScript configuration, linting, formatting, and the Genkit CLI for local development and deployment preparation.

## Components Involved

*   Git Repository (GitHub)
*   Node.js environment
*   npm
*   TypeScript
*   ESLint
*   Prettier
*   Genkit CLI
*   `package.json`
*   `tsconfig.json`
*   `.eslintrc.json`, `.prettierrc.json`, `.gitignore`

## Proposed Solution / Design Approach

1.  Create the project root directory and initialize a Git repository.
2.  Set up a standard `.gitignore` file for Node.js/TypeScript/Genkit projects.
3.  Initialize the project using `npm init`.
4.  Install TypeScript and necessary Node.js types as development dependencies.
5.  Create a standard `tsconfig.json` file configured for Node.js/Genkit compatibility (e.g., ESNext modules, strict mode).
6.  Install and configure ESLint and Prettier for code linting and formatting.
7.  Install the Genkit CLI globally (or locally via npx) and initialize the Genkit project (`genkit init`) to scaffold basic configuration (`genkit.config.ts`) and potentially an example flow.
8.  Add scripts to `package.json` for common tasks: build, lint, format, test stubs, starting the Genkit development environment (`genkit start`), and deploying flows (`genkit flow deploy` placeholder).
9.  Establish the basic source code directory structure.

## Implementation Checklist

*   [ ] Create project root directory.
*   [ ] `git init`.
*   [ ] Create `.gitignore` (include `node_modules`, `.env`, build artifacts `dist/`, OS files, `.genkit/` cache, `.firebase/` cache, `*.log`).
*   [ ] `npm init -y`.
*   [ ] Install core dev dependencies: `npm install --save-dev typescript @types/node ts-node`.
*   [ ] Create `tsconfig.json` (target ES2022/ESNext, module NodeNext/ESNext, moduleResolution bundler/nodenext, strict true, outDir dist, rootDir src, esModuleInterop true, sourceMap true, skipLibCheck true).
*   [ ] Create `src/` directory.
*   [ ] Install ESLint & Prettier dependencies: `npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier eslint-plugin-prettier`.
*   [ ] Create `.eslintrc.json` (configure parser, plugins, extends - e.g., `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:prettier/recommended`).
*   [ ] Create `.prettierrc.json` (define basic formatting rules - e.g., `singleQuote: true`, `trailingComma: 'es5'`, `semi: false`).
*   [ ] Create `.prettierignore` (include build output, logs, etc.).
*   [ ] Install Genkit CLI globally: `npm install -g genkit` (or decide to use `npx genkit` consistently).
*   [ ] Initialize Genkit project: `npx genkit init` (select appropriate template/plugins - likely Firebase, Google AI initially).
*   [ ] Review generated `genkit.config.ts` and ensure it aligns with project needs.
*   [ ] Add scripts to `package.json`:
    *   `"build": "tsc"`
    *   `"start:dev": "ts-node src/index.ts"` (Placeholder for bot entry point later)
    *   `"lint": "eslint . --ext .ts"`
    *   `"format": "prettier --write ."`
    *   `"genkit:start": "npx genkit start"`
    *   `"genkit:deploy:dev": "npx genkit flow deploy --platform firebase --project <DEV_PROJECT_ID> --all"` (Placeholder - needs project ID)
    *   `"test": "echo "Error: no test specified" && exit 1"` (Placeholder - test runner added later)
*   [ ] Create basic directory structure: `src/flows`, `src/tools` (empty for V1), `src/utils`, `src/config`, `src/data`, `src/discord`, `tests/`, `docs/`, `infra/`.
*   [ ] Create placeholder `README.md`.
*   [ ] Make initial commit to Git repository.

## Verification Steps

*   [ ] **Command:** `npm install` - **Expected:** Completes with exit code 0.
*   [ ] **Command:** `npm run build` - **Expected:** Completes with exit code 0 and `dist/` directory exists.
*   [ ] **Command:** `npm run lint` - **Expected:** Completes with exit code 0 (or known, acceptable warnings).
*   [ ] **Command:** `npm run format -- --check` - **Expected:** Completes with exit code 0, indicating no files need formatting changes.
*   [ ] **Command:** `npx genkit start --port <TEST_PORT> & sleep 5 && curl http://localhost:<TEST_PORT>; kill %1` - **Expected:** Starts Genkit UI, curl returns success (e.g., 200 OK for UI), process terminates cleanly.
*   [ ] **Command:** `git status --ignored` - **Expected:** Output lists files/directories matching `.gitignore` (e.g., `node_modules/`, `.env`).
*   [ ] **Manual Check:** Verify initial commit pushed to remote repository (if applicable).

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Specific ESLint rules? (Start with recommended sets, refine in STYLE-V1-001).

## Acceptable Tradeoffs

*   Minimal Genkit configuration initially.
*   Placeholder test scripts.
*   Placeholder deployment scripts (require Project IDs).
