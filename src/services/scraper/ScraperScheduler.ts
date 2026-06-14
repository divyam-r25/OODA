import * as Network from 'expo-network';
import { Config } from '@/config/constants';
import { ScraperService, type ScrapeResult } from './ScraperService';
import {
  saveScraperLastRun,
  saveScraperLastSuccess,
  saveScraperResults,
  setScraperFailedUrls,
  loadScraperResults,
  loadCompanyProfile,
  loadCompetitors,
} from '@/store/storage';

import { IntelligencePipeline } from '../IntelligencePipeline';

class ScraperSchedulerService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  /**
   * Starts the background scheduler loop.
   */
  start() {
    if (!Config.ENABLE_AUTO_SCRAPER) {
      if (Config.DEBUG) console.log('[ScraperScheduler] Auto-scraper is disabled via Config.');
      return;
    }

    if (this.timer) {
      if (Config.DEBUG) console.log('[ScraperScheduler] Scheduler is already running.');
      return;
    }

    if (Config.DEBUG) console.log('[ScraperScheduler] Starting scheduler loop...');

    // Calculate interval in milliseconds
    const intervalMs = Config.SCRAPER_INTERVAL_HOURS * 60 * 60 * 1000;

    this.timer = setInterval(() => {
      this.fetchLatestSignals();
    }, intervalMs);

    // Initial check (non-blocking)
    // In a real production app, we might check last successful run timestamp before running immediately
    this.fetchLatestSignals();
  }

  /**
   * Stops the scheduler.
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      if (Config.DEBUG) console.log('[ScraperScheduler] Scheduler stopped.');
    }
  }

  /**
   * Manual override to execute a scrape right now.
   */
  async runNow() {
    if (Config.DEBUG) console.log('[ScraperScheduler] Manual run triggered.');
    await this.fetchLatestSignals();
  }

  /**
   * Core fetching logic.
   */
  private async fetchLatestSignals() {
    if (this.isRunning) {
      if (Config.DEBUG) console.log('[ScraperScheduler] Scrape already in progress. Ignoring trigger.');
      return;
    }

    this.isRunning = true;
    const now = Date.now();
    await saveScraperLastRun(now);

    try {
      // 1. Network Awareness check
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        if (Config.DEBUG) console.log('[ScraperScheduler] Device offline. Skipping scan.');
        return;
      }

      if (Config.DEBUG) console.log('[ScraperScheduler] Triggering IntelligencePipeline.runScheduled()...');
      
      // Pass control directly to the fully-integrated Intelligence Pipeline
      // The Pipeline will handle Scrape -> RAG -> Ollama -> Comparison -> Signals -> Agents
      await IntelligencePipeline.runScheduled();
      
      await saveScraperLastSuccess(Date.now());

      if (Config.DEBUG) {
        console.log(`[ScraperScheduler] Scheduled run completed successfully.`);
      }

    } catch (err) {
      if (Config.DEBUG) console.error('[ScraperScheduler] Unexpected error during scheduled scan:', err);
    } finally {
      this.isRunning = false;
    }
  }


}

export const ScraperScheduler = new ScraperSchedulerService();
