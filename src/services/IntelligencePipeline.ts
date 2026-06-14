import { loadCompanyProfile, loadCompetitors, loadReports, saveReports, saveActivityLogs, loadActivityLogs } from '@/store/storage';
import { ScraperService } from './scraper/ScraperService';
import { ReportService } from './ReportService';
import { ComparisonService } from './ComparisonService';
import { SignalService } from './SignalService';
import { engine } from './execution/ExecutionEngine';
import { RAGService } from './rag/RAGService';
import { PipelineState, usePipelineStore } from '@/store/PipelineStore';
import type { ActivityLog } from '@/types';

export class IntelligencePipeline {
  /**
   * Log an activity to the timeline.
   */
  static async logActivity(type: ActivityLog['type'], title: string, description: string, competitorId?: string, signalId?: string) {
    const logs = await loadActivityLogs();
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
      competitorId,
      signalId,
    };
    await saveActivityLogs([newLog, ...logs].slice(0, 100)); // Keep last 100
  }

  /**
   * Initial flow run immediately after onboarding.
   * Does NOT trigger multi-agent discussion or comparisons. Just establishes baselines.
   */
  static async runInitialOnboarding(): Promise<void> {
    console.log('[Pipeline] Running Initial Onboarding Scrape...');
    const company = await loadCompanyProfile();
    const competitors = await loadCompetitors();
    
    if (!company) return;

    const allUrls = [
      { id: 'own', url: company.website, name: company.name },
      ...competitors.map(c => ({ id: c.id, url: c.url, name: c.name }))
    ];

    const reports = await loadReports();

    const store = usePipelineStore.getState();
    store.setStatus(PipelineState.SCRAPING, `Preparing to analyze ${allUrls.length} websites...`);

    // 1. Scrape all URLs sequentially to preserve processing order
    for (const target of allUrls) {
      try {
        console.log(`\n======================================================`);
        console.log(`[IntelligencePipeline] STARTING INITIAL PROCESSING FOR: ${target.name}`);
        console.log(`======================================================`);
        
        console.log(`[IntelligencePipeline] [${target.name}] -> Sending request to scraper for URL: ${target.url}...`);
        store.setStatus(PipelineState.SCRAPING, `Scraping website: ${target.name}`);
        const result = await ScraperService.scrapeUrl(target.url);
        console.log(`[IntelligencePipeline] [${target.name}] -> Received scraper response. Size: ${(result.markdown.length / 1024).toFixed(2)} KB.`);
        
        // 2. RAG Processing (Chunk, Index, Retrieve)
        console.log(`\n[IntelligencePipeline] [${target.name}] -> Starting RAG Processing...`);
        const context = await RAGService.processAndRetrieve(target.name, target.id, result.markdown);
        console.log(`[IntelligencePipeline] [${target.name}] -> RAG Processing Complete. Context ready for analysis.`);

        // 3. Generate Baseline AI Report
        store.setStatus(PipelineState.ANALYZING, `Generating baseline intelligence for ${target.name}`);
        console.log(`[IntelligencePipeline] [${target.name}] -> Sending context to Ollama model for Baseline Report generation...`);
        const report = await ReportService.generateReport(target.id, target.url, context);
        console.log(`[IntelligencePipeline] [${target.name}] -> Ollama Analysis Complete! Report generated successfully.`);
        reports[target.id] = report;

        store.setStatus(PipelineState.SAVING, `Saving report for ${target.name}`);
        await this.logActivity('report_generated', `Baseline Report Generated`, `Successfully generated baseline intelligence for ${target.name}.`, target.id);
      } catch (err) {
        console.error(`[Pipeline] Failed to scrape/analyze ${target.url}:`, err);
      }
    }
    
    // 4. Store Baseline Reports
    await saveReports(reports);
    store.setStatus(PipelineState.COMPLETED, `Initial baseline generation complete.`);
    console.log('[Pipeline] Initial Onboarding Complete. Baseline reports saved.');
  }

  /**
   * Scheduled flow run on a timer.
   * Scrapes -> Generates Report -> Compares -> If changed -> Creates Signal -> Multi-Agent Exec.
   */
  static async runScheduled(): Promise<void> {
    console.log('[Pipeline] Running Scheduled Scrape...');
    const company = await loadCompanyProfile();
    const competitors = await loadCompetitors();
    if (!company) return;

    const allTargets = [
      { id: 'own', url: company.website, name: company.name },
      ...competitors.map(c => ({ id: c.id, url: c.url, name: c.name }))
    ];

    const reports = await loadReports();

    const store = usePipelineStore.getState();
    store.setStatus(PipelineState.SCRAPING, `Starting scheduled scan...`);

    // Scrape all sites sequentially
    for (const target of allTargets) {
      try {
        console.log(`\n======================================================`);
        console.log(`[IntelligencePipeline] STARTING SCHEDULED PROCESSING FOR: ${target.name}`);
        console.log(`======================================================`);

        store.setStatus(PipelineState.SCRAPING, `Scraping competitor: ${target.name}`);
        console.log(`[IntelligencePipeline] [${target.name}] -> Sending request to scraper for URL: ${target.url}...`);
        const result = await ScraperService.scrapeUrl(target.url);
        console.log(`[IntelligencePipeline] [${target.name}] -> Received scraper response. Size: ${(result.markdown.length / 1024).toFixed(2)} KB.`);
        
        console.log(`[IntelligencePipeline] [${target.name}] -> Passing raw data to RAG Storage layer...`);
        const context = await RAGService.processAndRetrieve(target.name, target.id, result.markdown);
        console.log(`[IntelligencePipeline] [${target.name}] -> RAG retrieval complete. Preparing to analyze data using Ollama...`);
        
        store.setStatus(PipelineState.ANALYZING, `Analyzing new data for ${target.name}`);
        const newReport = await ReportService.generateReport(target.id, target.url, context);
        
        const oldReport = reports[target.id];
        
        console.log(`[IntelligencePipeline] [${target.name}] -> Ollama Analysis Complete! Report generated successfully.`);

        if (oldReport) {
          console.log(`[IntelligencePipeline] [${target.name}] -> Preparing to compare new report against previous report...`);
          // Compare
          const comparison = await ComparisonService.compare(oldReport, newReport);
          
          if (comparison.changed && comparison.changes.length > 0) {
            console.log(`[IntelligencePipeline] [${target.name}] -> Changes detected! ${comparison.changes.length} significant updates found.`);
            // Found a change! Create Signal.
            const competitorObj = competitors.find(c => c.id === target.id)!;
            const signal = await SignalService.createSignalFromChanges(competitorObj, comparison);
            
            if (signal) {
              await this.logActivity('signal_created', `Signal Detected: ${target.name}`, signal.description, target.id, signal.id);
              
              // Trigger multi-agent engine
              await this.logActivity('discussion_completed', `AI Analysis Initiated`, `Starting multi-agent war-room for ${target.name} signal.`, target.id, signal.id);
              // Fire and forget (will stream to UI and save verdict)
              engine.run(signal.description, signal).catch(console.error);
            }
          }
        }
        
        // Update the stored report
        console.log(`[IntelligencePipeline] [${target.name}] -> Saving updated report to storage...`);
        reports[target.id] = newReport;
        await saveReports(reports);
        console.log(`[IntelligencePipeline] [${target.name}] -> Processing complete. Moving to next competitor...`);

      } catch (err) {
        console.error(`[Pipeline] Failed scheduled run for ${target.url}:`, err);
      }
    }

    store.setStatus(PipelineState.COMPLETED, `Scheduled scan complete.`);
    console.log('[Pipeline] Scheduled Run Complete.');
  }
}
