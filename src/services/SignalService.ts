import type { Signal, ComparisonResult, Competitor } from '@/types';
import { loadSignals, saveSignals } from '@/store/storage';

export class SignalService {
  /**
   * Generates a single composite Signal or multiple Signals from a ComparisonResult.
   * For simplicity, we bundle all changes for a competitor into one Signal.
   */
  static async createSignalFromChanges(
    competitor: Competitor,
    comparison: ComparisonResult
  ): Promise<Signal | null> {
    if (!comparison.changed || comparison.changes.length === 0) return null;

    // Find the highest severity among changes
    const severities = { low: 1, medium: 2, high: 3, critical: 4 };
    let highestSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    for (const change of comparison.changes) {
      if (severities[change.severity] > severities[highestSeverity]) {
        highestSeverity = change.severity;
      }
    }

    // Build description
    const description = comparison.changes
      .map((c) => `• [${c.category}] ${c.description}\n  Old: ${c.previousValue}\n  New: ${c.currentValue}`)
      .join('\n\n');

    const primaryChange = comparison.changes[0];

    const signal: Signal = {
      id: `sig-${Date.now()}-${competitor.id}`,
      type: `${primaryChange.category} Change${comparison.changes.length > 1 ? ' + Others' : ''}`,
      severity: highestSeverity,
      description,
      previousValue: primaryChange.previousValue,
      currentValue: primaryChange.currentValue,
      timestamp: new Date().toISOString(),
      competitorId: competitor.id,
      competitorName: competitor.name,
    };

    // Save to storage
    const currentSignals = await loadSignals();
    await saveSignals([signal, ...currentSignals].slice(0, 50)); // keep last 50

    return signal;
  }

  /**
   * Creates a manual signal for testing (does not require a scraper/comparison)
   */
  static async createManualSignal(text: string): Promise<Signal> {
    const signal: Signal = {
      id: `sig-manual-${Date.now()}`,
      type: 'Manual Injection',
      severity: 'high', // default to high for visibility
      description: text,
      previousValue: 'N/A',
      currentValue: 'N/A',
      timestamp: new Date().toISOString(),
      competitorId: 'manual',
      competitorName: 'Manual Entry',
    };

    const currentSignals = await loadSignals();
    await saveSignals([signal, ...currentSignals].slice(0, 50));

    return signal;
  }
}
