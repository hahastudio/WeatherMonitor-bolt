# GEMINI.MD: AI Collaboration Guide

This document provides essential context for AI models interacting with this project. Adhering to these guidelines will ensure consistency and maintain code quality.

## 0. Important Instructions for AI Collaboration

Before submitting any changes, it is crucial to validate them by running the preflight check. This command will format codes, check for type errors, lint the code, and run all tests.

To run the full suite of checks, execute the following command:

```bash
npm run preflight
```

This single command ensures that your changes meet all the quality gates of the project. While you can run the individual steps (`format`, `typecheck`, `lint`, `test`) separately, it is highly recommended to use `npm run preflight` to ensure a comprehensive validation.

When you don't know how to deal with an error, or have tried several times but failed to fix the error, you can google to find whether there are other solutions via tool `google_web_search`.

## 1. Project Overview & Purpose

- **Primary Goal:** A production-ready, cross-platform weather monitoring application built with React Native and Expo. It provides real-time weather data, forecasts, AI-powered summaries, interactive maps, and weather alerts.
- **Business Domain:** Meteorology and Weather Forecasting.

## 2. Core Technologies & Stack

- **Languages:** TypeScript
- **Frameworks & Runtimes:** React Native, Expo, Node.js
- **Databases:** `@react-native-async-storage/async-storage` is used for local key-value storage. No traditional database is present.
- **Key Libraries/Dependencies:**
  - `expo`: Core framework for building the application.
  - `expo-router`: File-based routing for navigation.
  - `@google/genai`: Integration with Google Gemini for AI-powered weather summaries.
  - `react-native-webview`: Used to embed the Windy.com interactive weather map.
  - `react-native-background-fetch`: Used to fetch weather data in background.
  - `expo-location`: For handling geolocation.
  - `expo-notifications`: For push notifications related to weather alerts.
- **Package Manager(s):** npm

## 3. Architectural Patterns

- **Overall Architecture:** The project follows a clear, service-oriented architecture as described in the README.
  - **Tab-Based Navigation:** Uses Expo Router for the main app structure.
  - **Context-Based State Management:** A central `WeatherContext` provides global state for weather data, handling API calls, and managing refresh logic.
  - **Service Layer:** External API interactions (OpenWeatherMap, Caiyun, Gemini) are abstracted into dedicated services within the `/services` directory.
- **Directory Structure Philosophy:**
  - `/app`: Contains all screens and routes, managed by Expo Router.
  - `/assets`: Static assets like images and icons.
  - `/components`: Reusable, self-contained React components.
  - `/contexts`: Houses React Context providers for global state management.
  - `/hooks`: Contains custom, reusable React hooks.
  - `/services`: Handles all external API communication and business logic.
  - `/types`: Defines all TypeScript interfaces and type definitions.
  - `/utils`: Holds utility functions and theme definitions.

## 4. Coding Conventions & Style Guide

- **Formatting:** Based on `.prettierrc`:
  - **Indentation:** 2 spaces.
  - **Quotes:** Single quotes (`'`).
  - **Bracket Spacing:** `true`.
  - **Tabs:** Not used.
- **Naming Conventions:**
  - `variables`, `functions`: `camelCase` (`myVariable`).
  - `classes`, `components`: `PascalCase` (`WeatherCard`).
  - `files`: `camelCase` (`weatherService.ts`) or `kebab-case` for router pages (`_layout.tsx`).
- **API Design:** The application consumes external REST APIs. Internal services that wrap these APIs should be designed to be clean and reusable.
- **Error Handling:** The architecture specifies comprehensive error handling within the service layer. Assume `async/await` with `try...catch` blocks is the standard pattern.
- **Test Files:**
  - **Location:** Test files are placed in `__tests__` directory, mirroring the source directory structure
  - **Naming:** Test files end with `.test.ts` or `.test.tsx`
  - **Structure:** Tests use Jest's `describe` and `it` blocks for organization
  - **Mocking:** Mock files are placed in `__mocks__` directory for module mocks
  - **Test Data:** Mock data should be defined within the test file when specific to that file
  - **Assertions:** Use Jest's `expect` with specific matchers like `toEqual`, `toHaveBeenCalled`

## 5. Key Files & Entrypoints

- **Main Entrypoint(s):** `index.ts` is the main entrypoint defined in `package.json`. App navigation and screen layout are controlled by Expo Router, starting with `app/_layout.tsx`.
- **Configuration:**
  - `app.config.ts`: Main Expo configuration file.
  - `eas.json`: Configuration for Expo Application Services (EAS) builds.
  - `.env`: Used for storing API keys and secrets (must be created locally).
  - `jest.config.ts`: Jest test framework configuration.
  - `jest.setup.ts`: Test environment setup and global mocks.
  - `__tests__/mocks.ts`: Shared test mocks and utilities.
- **CI/CD Pipeline:** No CI/CD pipeline configuration file (e.g., `.github/workflows`).

## 6. Development & Testing Workflow

- **Local Development Environment:** Setup requires cloning the repository, installing dependencies with `npm install`, creating a `.env` file with the necessary API keys, and running the app with `npm run dev`.
- **Testing:** The project uses Jest and React Native Testing Library for automated testing:
  - **Test Framework:** Jest with jest-expo preset
  - **Test Scripts:**
    - `npm test`: Run all tests
    - `npm test:watch`: Run tests in watch mode
  - **Test Location:** Tests are located in the `__tests__` directory, following the same structure as the source code
  - **Mock System:** Uses jest-fetch-mock for API calls and custom mocks for Expo modules
  - **Coverage:** Test coverage is enabled and reports are generated in the `/coverage` directory
  - **Test Philosophy:** Unit tests focus on service layer functionality, with particular attention to API transformations and error handling
- **CI/CD Process:** Inferred to be a manual process, likely using EAS CLI for builds and submissions.

## 7. Specific Instructions for Collaboration

- **Contribution Guidelines:** Follow the general steps: fork the repository, create a feature branch, and open a pull request.
- **Infrastructure (IaC):** No Infrastructure as Code (IaC) is present in this project.
- **Security:** Be mindful of security. Do not hardcode secrets or API keys directly in the source code. Use the `.env` file for all secrets, which are accessed via `process.env`.
- **Dependencies:** Add new dependencies using `npm install`. Avoid adding unnecessary packages to keep the app lightweight.
- **Commit Messages:** No explicit commit message convention is defined. Analyze the existing `git log` to match the established style before committing.
