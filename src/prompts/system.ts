import type { AgentRole } from '@/constants/agentData';
import { MARKETING_PROMPT } from './marketing';
import { PRODUCT_PROMPT } from './product';
import { SALES_PROMPT } from './sales';
import { STRATEGY_PROMPT } from './strategy';
import { REVIEWER_PROMPT } from './reviewer';

export function getAgentPrompt(role: AgentRole | 'reviewer'): string {
  switch (role) {
    case 'marketing':
      return MARKETING_PROMPT;
    case 'product':
      return PRODUCT_PROMPT;
    case 'sales':
      return SALES_PROMPT;
    case 'strategy':
      return STRATEGY_PROMPT;
    case 'reviewer':
      return REVIEWER_PROMPT;
    default:
      return 'You are an AI assistant analyzing competitive intelligence signals.';
  }
}

export function buildSystemPrompt(
  role: AgentRole | 'reviewer',
  companyContext: string,
  transcript?: string
): string {
  const basePrompt = getAgentPrompt(role);

  let prompt = `${basePrompt}

--- COMPANY CONTEXT ---
${companyContext}
-----------------------
`;

  if (transcript) {
    prompt += `
--- DISCUSSION TRANSCRIPT SO FAR ---
${transcript}
------------------------------------
You must read the transcript above. Acknowledge good points made by other agents, challenge weak assumptions, and add your unique perspective.
`;
  } else {
    prompt += `\nSince this is the first round, provide your initial analysis and pose at least one critical question to another department to guide the upcoming discussion.\n`;
  }

  prompt += `
CRITICAL FORMATTING RULES:
1. Write in a conversational, debating style. You are in a war room with the other agents.
2. Provide deep reasoning for your perspective. 
3. Ask direct, probing questions to other specific departments (e.g. "Product, how quickly can we ship a counter-feature?", "Strategy, does this align with our goals?").
4. Do NOT output a generic list of points. Frame your output as a cohesive argument and discussion.
`;

  return prompt;
}
