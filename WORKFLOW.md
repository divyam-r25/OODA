# Application Workflow

OODA is designed to run automatically in the background, minimizing required user inputs. Below is the lifecycle of how competitive intelligence is gathered, stored, and analyzed.

## 1. Data Collection (Scraping Phase)
*Triggered automatically by `ScraperScheduler.ts` upon app launch or timer interval.*

1. **Initialization Check**: The app checks `Config.ENABLE_AUTO_SCRAPER` and verifies the device has an active internet connection using `expo-network`.
2. **Gather Sources**: The app looks up the user's configured Company Website and any added Competitor URLs from local storage.
3. **Parallel Fetching**: `ScraperService` dispatches HTTP POST requests to the Python scraper backend for all URLs simultaneously. 
4. **Retry & Recovery**: If a URL times out, the service utilizes exponential backoff to retry. If it ultimately fails, it is marked as a failure without crashing the whole batch.
5. **Caching**: Raw HTML/JSON responses are saved directly into the device's AsyncStorage (`ooda:scraper_results`), allowing the user to disconnect from the network without losing intelligence.

## 2. Signal Normalization (Upcoming Phase)
*Triggered after scraping or manually by the user.*

1. The raw scraper results are parsed.
2. Changes between the last known scrape and the current scrape are detected.
3. These changes are converted into an actionable "Signal" string (e.g., "Competitor X just lowered their pricing by 10%").

## 3. Multi-Agent Analysis (Execution Phase)
*Triggered by user pressing "Start Discussion" or automatically following a critical signal.*

1. **Orchestration**: The `ExecutionEngine` receives the Signal and the Company Context.
2. **Parallel Ideation (Round 1)**: The engine clones the signal and sends it simultaneously to up to 4 configured Agents (e.g., Marketing, Sales). Each agent uses its unique persona prompt to analyze the signal.
3. **Cross-Review (Round 2)**: The engine compiles the output from Round 1 into a transcript. It sends this transcript back to the same agents. Agents are instructed to challenge weak assumptions made by their peers and reinforce strong ideas.
4. **Executive Verdict**: Once the rounds are complete, the `Reviewer` agent receives the massive combined transcript. It ignores the fluff and outputs a concise, executive-level summary and recommended action plan.
5. **Persistence**: The final transcript is logged to `DiscussionMemory` and saved to local storage for historical reference.
