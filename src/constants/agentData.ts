// ─────────────────────────────────────────────
// OODA — Agent Data & Discussion Types
// UI-only. Architecture ready for backend swap.
// ─────────────────────────────────────────────

// ── Agent Definition ──────────────────────────
export type AgentRole = 'marketing' | 'product' | 'sales' | 'strategy' | 'reviewer';

export interface AgentConfig {
  id: AgentRole;
  name: string;
  shortName: string;
  focus: string;           // one-line area of expertise
  avatarColor: string;
  avatarBg: string;
  emoji: string;
  isReviewer?: boolean;
}

// ── All available agents ──────────────────────
export const AGENT_ROSTER: AgentConfig[] = [
  {
    id: 'marketing',
    name: 'Marketing AI',
    shortName: 'Marketing',
    focus: 'Brand positioning, messaging & market share',
    avatarColor: '#3B82F6',
    avatarBg: 'rgba(59,130,246,0.12)',
    emoji: '📣',
  },
  {
    id: 'product',
    name: 'Product AI',
    shortName: 'Product',
    focus: 'Feature analysis, UX & product differentiation',
    avatarColor: '#8B5CF6',
    avatarBg: 'rgba(139,92,246,0.12)',
    emoji: '🧩',
  },
  {
    id: 'sales',
    name: 'Sales AI',
    shortName: 'Sales',
    focus: 'Revenue impact, customer accounts & pipeline',
    avatarColor: '#F59E0B',
    avatarBg: 'rgba(245,158,11,0.12)',
    emoji: '📈',
  },
  {
    id: 'strategy',
    name: 'Strategy AI',
    shortName: 'Strategy',
    focus: 'Long-term positioning, risk & opportunity mapping',
    avatarColor: '#10B981',
    avatarBg: 'rgba(16,185,129,0.12)',
    emoji: '🎯',
  },
];

export const REVIEWER_AGENT: AgentConfig = {
  id: 'reviewer',
  name: 'Reviewer',
  shortName: 'Reviewer',
  focus: 'Synthesises all agent responses into a final verdict',
  avatarColor: '#73904E',
  avatarBg: 'rgba(115,144,78,0.12)',
  emoji: '🏛',
  isReviewer: true,
};

// ── Discussion Message ─────────────────────────
export interface DiscussionMessage {
  id: string;
  agentId: AgentRole | 'reviewer';
  round: number;           // 1, 2, or 0 for reviewer
  content: string;
  confidence?: number;     // 0–100, optional
  referencesAgent?: AgentRole; // who they're responding to
}

// ── Discussion State ──────────────────────────
export type DiscussionStatus =
  | 'idle'
  | 'round1'       // all agents generating independently
  | 'round2'       // all agents cross-reviewing
  | 'reviewing'    // Reviewer synthesising
  | 'done';

// ── Execution Mode ────────────────────────────
export type ExecutionMode = 'multi_agent' | 'single_agent';

// ── Mock signal that triggered the discussion ──
export const MOCK_SIGNAL_FOR_DISCUSSION = {
  id: 'sig-001',
  headline: 'RivalFlow reduced starter plan pricing by 20%',
  detail:
    'Our monitored competitor RivalFlow appears to have reduced their starter plan from ₹999/month to ₹749/month, effective this morning. This targets the same SMB customer segment we actively serve.',
};

// ── Mock discussion messages (Round 1 — parallel) ─
export const MOCK_ROUND_1: DiscussionMessage[] = [
  {
    id: 'r1-marketing',
    agentId: 'marketing',
    round: 1,
    content:
      "RivalFlow's price cut is a clear market-share grab targeting our core SMB segment. Their messaging has been shifting towards affordability for three months. This isn't opportunistic — it looks like a deliberate campaign to win our price-sensitive leads before they convert.",
    confidence: 74,
  },
  {
    id: 'r1-product',
    agentId: 'product',
    round: 1,
    content:
      "Pricing reductions of this scale (20%) usually accompany a feature freeze or cost-cutting cycle. I'd watch their product changelog closely. If they've deprioritised development, this could signal internal pressure rather than confidence — a reactive move, not a strategic one.",
    confidence: 62,
  },
  {
    id: 'r1-sales',
    agentId: 'sales',
    round: 1,
    content:
      "We have 14 open deals in the SMB bracket below ₹1,000/month. If prospects compare us directly to RivalFlow today, the price delta becomes a direct objection. Renewal accounts from Q1 are also at risk — 6 accounts have not yet signed off on annual contracts.",
    confidence: 81,
  },
  {
    id: 'r1-strategy',
    agentId: 'strategy',
    round: 1,
    content:
      "This is a commodity race signal. Companies that compete primarily on price rarely build durable moats. If RivalFlow is reducing price, they may be feeling margin pressure or venture pressure to show growth. Our response should be value-led, not price-led.",
    confidence: 70,
  },
];

// ── Mock discussion messages (Round 2 — cross-review) ─
export const MOCK_ROUND_2: DiscussionMessage[] = [
  {
    id: 'r2-marketing',
    agentId: 'marketing',
    round: 2,
    referencesAgent: 'strategy',
    content:
      "I agree with Strategy that we should avoid racing to the bottom on price. However, the narrative matters — our current messaging doesn't sufficiently emphasise value. I recommend a proactive content push: customer case studies, ROI calculators, and testimonials within the next 7 days.",
    confidence: 82,
  },
  {
    id: 'r2-product',
    agentId: 'product',
    round: 2,
    referencesAgent: 'sales',
    content:
      "Sales raises a critical point about the 6 at-risk renewal accounts. I'd suggest accelerating the release of our Automation 2.0 feature — currently in QA — as it directly addresses the top-requested SMB feature. A targeted preview for those 6 accounts would shift the conversation from price to capability.",
    confidence: 78,
  },
  {
    id: 'r2-sales',
    agentId: 'sales',
    round: 2,
    referencesAgent: 'marketing',
    content:
      "Marketing's suggestion on case studies is good. I'd add: our sales team should proactively reach out to the 14 open SMB deals within 48 hours with a concise value comparison — not a price match. Product's idea for a feature preview for renewals is excellent, I can coordinate that outreach.",
    confidence: 88,
  },
  {
    id: 'r2-strategy',
    agentId: 'strategy',
    round: 2,
    referencesAgent: 'product',
    content:
      "Aligning with the Product team — acceleration of a high-value feature is the right long-term counter. Additionally, if RivalFlow continues discounting, it may create an acquisition opportunity for their frustrated enterprise customers. We should brief our enterprise sales team to begin monitoring for RivalFlow churn signals.",
    confidence: 75,
  },
];

// ── Reviewer final verdict ─────────────────────
export const MOCK_REVIEWER_VERDICT: DiscussionMessage = {
  id: 'reviewer-final',
  agentId: 'reviewer',
  round: 0,
  content:
    "After reviewing all agent inputs across two discussion rounds, the consensus is clear: RivalFlow's price reduction is a deliberate, targeted move aimed at our SMB segment and warrants a coordinated response.\n\n**Recommended Action Plan:**\n• Sales: Contact 6 at-risk renewals and 14 open SMB deals within 48 hours\n• Product: Expedite Automation 2.0 preview for at-risk accounts\n• Marketing: Launch value-led content campaign (case studies, ROI tools) within 7 days\n• Strategy: Brief enterprise team to watch for RivalFlow customer churn\n\n**Do not compete on price.** Compete on value, capability, and trust.",
  confidence: 84,
};
