# AGENTS.md: AI Collaboration Guide

This document provides essential context for AI agents interacting with this project. Adhering to these guidelines will ensure consistency and maintain code quality.

## 1. Project Overview

- **Primary Goal:** A production-ready, cross-platform weather monitoring application built with React Native and Expo. It provides real-time weather data, forecasts, AI-powered summaries, interactive maps, and weather alerts.
- **Core Technologies:** TypeScript, React Native, Expo, Node.js.
- **Architecture:** The project uses a service-oriented architecture with context-based state management. See `README.md` for a detailed breakdown.

## 2. Key Commands

| Command             | Description                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| `npm install`       | Installs all project dependencies.                                              |
| `npm run dev`       | Starts the development server with Expo.                                        |
| `npm run preflight` | **CRITICAL:** Runs format, typecheck, lint, and tests. Must pass before commit. |
| `npm test`          | Runs the full Jest test suite.                                                  |
| `npm test:watch`    | Runs tests in interactive watch mode.                                           |
| `npm run lint`      | Lints the codebase using `expo lint`.                                           |
| `npm run typecheck` | Runs the TypeScript compiler to check for type errors.                          |
| `npm run format`    | Formats all code using Prettier.                                                |

## 3. Development Environment

### Initial Setup

1.  **Install Dependencies:** Run `npm install` to fetch all required packages.
2.  **Environment Variables:** Create a `.env` file in the project root. This is mandatory for the app to function, as it contains required launch configuration. A template can be found in the `README.md`.

    ```env
    ANDROID_GOOGLE_SERVICES_FILE_PATH=your_firebase_json_file_here
    ```

3.  **Start the App:** Run `npm run dev` to start the Expo development server.

### Agent MCP Usage

Prefer MCP tools over raw shell commands:

- Use `context7` for up-to-date docs. Resolve with `context7.resolve-library-id`, then fetch via `context7.get-library-docs`.

## 4. Testing and Validation

### Pre-Submission Check

**Always run `npm run preflight` after making any changes.** This single command validates that your changes meet all project quality standards, including formatting, linting, type safety, and testing. If this check fails, you must fix the reported issues.

### Running Tests

- To run all tests once, use `npm test`.
- For a continuous testing environment during development, use `npm test:watch`.
- Test files are located in the `__tests__` directory and follow a structure that mirrors the `src` directory. They must end with `.test.ts` or `.test.tsx`.
- Mocks for external modules are located in the `__mocks__` directory.

## 5. Code Style and Conventions

- **Formatting:** Code is automatically formatted by Prettier. Run `npm run format` or rely on the `preflight` script. Key styles include 2-space indentation and single quotes.
- **Naming:**
  - Components: `PascalCase` (e.g., `WeatherCard.tsx`)
  - Functions/Variables: `camelCase` (e.g., `getWeatherData`)
  - Files: `camelCase` or `kebab-case` (e.g., `weatherService.ts`, `_layout.tsx`)
- **Error Handling:** Implement `try...catch` blocks for all asynchronous operations, especially within the service layer (`/services`).
- **State Management:** Utilize the central `WeatherContext` for global state. Avoid local state for data that needs to be shared across different screens.
