// ─────────────────────────────────────────────
// OODA — Reusable hooks
// useCompanyProfile() | useCompetitors()
// ─────────────────────────────────────────────

import { useCompany } from '@/store/CompanyContext';
import type { Competitor, CompanyProfile } from '@/types';

// ── useCompanyProfile ─────────────────────────
export function useCompanyProfile(): CompanyProfile | null {
  const { company } = useCompany();
  return company;
}

// ── useCompetitors ────────────────────────────
export function useCompetitors(): Competitor[] {
  const { competitors } = useCompany();
  return competitors;
}
