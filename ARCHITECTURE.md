# Architecture Overview

The OODA application is designed around strict separation of concerns, ensuring that UI components never directly interact with API configurations or raw execution loops. 

## 1. Environment & Configuration Layer
All configurations are driven by `.env` via `expo-constants`. 

**Path:** `src/config/`
- `env.ts`: Safely maps `process.env.EXPO_PUBLIC_*` properties to a strict TypeScript interface.
- `constants.ts`: Exports a singleton `Config` object that parses raw environment strings into actual types (e.g., `boolean`, `number`) and provides safe fallbacks. **No component should read `process.env` directly; always import `Config`.**

## 2. AI Provider Abstraction
OODA is built to run entirely offline on a local device or connect to robust cloud models. The Execution Engine does not care which provider is running.

**Path:** `src/services/ai/`
- `AIProvider.ts`: The unified interface requiring a `generate()` method.
- `OllamaProvider.ts`: Implementation for local Ollama instances over HTTP.
- `CloudProvider.ts`: Implementation for cloud services (OpenAI, Anthropic).
- `ProviderFactory.ts`: Returns the correct provider instance based on user configuration.

## 3. Multi-Agent Execution Engine
A custom orchestration layer that allows multiple AI agents to think and review in parallel.

**Path:** `src/services/execution/`
- `ExecutionEngine.ts`: The core orchestrator. Emits state (`round1`, `round2`, `reviewing`, `done`) to any subscribed UI components. Uses `Promise.all` to fire agent runs concurrently.
- `AgentRunner.ts`: Wraps an individual agent (e.g., Marketing, Sales). Injects the correct system prompt and parses the AI's response to extract confidence scores and cross-agent references.
- `Reviewer.ts`: A specialized runner that reads the entire transcript after all rounds complete to generate an executive summary.
- `DiscussionMemory.ts`: Manages the raw transcript log and formats it dynamically for context injection.

## 4. Prompts System
Prompts are isolated from application logic to prevent bloated files.

**Path:** `src/prompts/`
- Base persona prompts (`marketing.ts`, `sales.ts`, etc.) live here as simple string exports.
- `system.ts` acts as the prompt builder, merging the base persona with the company context and the live discussion transcript.

## 5. Storage Layer
**Path:** `src/store/storage.ts`
All persistence relies on `@react-native-async-storage/async-storage`. It manages:
- Company and competitor profiles
- AI Model selections and IP overrides
- Cached scraper data
- Discussion transcripts

## 6. Scraper Service
**Path:** `src/services/scraper/`
- `ScraperService.ts`: Performs robust HTTP requests to an external scraper API, featuring exponential backoff retries and batch processing (`Promise.all`).
- `ScraperScheduler.ts`: Runs silently in the background. It uses `expo-network` to abort gracefully if offline, and an `isRunning` lock to prevent duplicate runs. It dumps results directly into the `Storage Layer` for future consumption.
