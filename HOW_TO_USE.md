# How to Use OODA

This guide explains how to configure, run, and use the OODA competitive intelligence application.

## 1. Environment Configuration

OODA relies on a central `.env` file to manage URLs and execution rules. 
In the root directory of the project, edit the `.env` file (or create it if it doesn't exist) with your specific local IP addresses.

```env
# AI Provider (Ollama)
# IMPORTANT: Use your computer's actual LAN IP if testing on a physical Android device!
# e.g., 192.168.1.5 instead of 10.0.2.2 or 127.0.0.1
EXPO_PUBLIC_OLLAMA_BASE_URL=http://10.0.2.2:11434
EXPO_PUBLIC_OLLAMA_GENERATE_ENDPOINT=/api/generate
EXPO_PUBLIC_OLLAMA_TAGS_ENDPOINT=/api/tags

# Scraper Service
EXPO_PUBLIC_SCRAPER_BASE_URL=http://10.0.2.2:8000
EXPO_PUBLIC_SCRAPER_ENDPOINT=/api/web-scrapper
EXPO_PUBLIC_SCRAPER_INTERVAL_HOURS=12
EXPO_PUBLIC_ENABLE_AUTO_SCRAPER=true

# Engine Rules
EXPO_PUBLIC_MAX_DISCUSSION_ROUNDS=2
EXPO_PUBLIC_MAX_ACTIVE_AGENTS=4
EXPO_PUBLIC_DEFAULT_TIMEOUT=60000
EXPO_PUBLIC_ENABLE_DEBUG=true
```

## 2. Setting Up Ollama (Local AI)

OODA is designed to run locally using Ollama for maximum privacy.

1. Download and install [Ollama](https://ollama.com/).
2. Open your terminal and pull a lightweight model suitable for mobile endpoints:
   ```bash
   ollama run llama3.2
   ```
3. Ensure Ollama is binding to your network so your phone/emulator can reach it. By default, Ollama only binds to `127.0.0.1`. You must start Ollama with:
   ```bash
   OLLAMA_HOST=0.0.0.0 ollama serve
   ```

## 3. Setting Up the Scraper Backend

OODA expects a web scraper running to feed it data.
1. Navigate to your scraper project.
2. Start the scraper server (e.g., FastAPI on port 8000). Ensure it is also bound to `0.0.0.0` if using a physical device.

## 4. Running the Mobile App

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Expo development server:
   ```bash
   npx expo start
   ```
3. Press `a` to open in an Android Emulator, `i` to open in iOS Simulator, or scan the QR code with the Expo Go app on your physical device.

## 5. Using the Application

### The Assistant Screen
1. Navigate to the **Ask OODA AI** tab.
2. You will see the Multi-Agent engine interface.
3. Type a manual competitive signal (e.g., "Our main competitor just released an AI feature") and press **Start Discussion**.
4. The app will spawn the Marketing, Product, Sales, and Strategy agents in parallel, generating a multi-round debate.
5. The UI will stream the discussion until the Reviewer provides a final executive verdict.

### The Models Screen
1. Navigate to **Profile** > **AI Models**.
2. If your `.env` URL is correct and Ollama is running, the app will automatically fetch and list your downloaded models.
3. You can enable or disable specific AI Agents here, or change the default execution model. 
4. Changes made here are saved instantly and apply to the very next discussion.
