// ─────────────────────────────────────────────
// OODA — Company Context
// Holds company profile + competitors in memory,
// synced to AsyncStorage via storage layer.
// ─────────────────────────────────────────────

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { Competitor, CompanyProfile, OnboardingState } from '@/types';
import {
  clearCompanyProfile,
  clearCompetitors,
  clearOnboardingState,
  loadCompanyProfile,
  loadCompetitors,
  loadOnboardingState,
  saveCompanyProfile,
  saveCompetitors,
  saveOnboardingState,
} from './storage';

interface CompanyContextType {
  company: CompanyProfile | null;
  competitors: Competitor[];
  onboarding: OnboardingState;
  isLoading: boolean;
  // Setters
  updateCompany: (profile: CompanyProfile) => Promise<void>;
  updateCompetitors: (list: Competitor[]) => Promise<void>;
  updateOnboarding: (state: OnboardingState) => Promise<void>;
  clearAll: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingState>({ completed: false, currentStep: 1 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      loadCompanyProfile(),
      loadCompetitors(),
      loadOnboardingState(),
    ]).then(([profile, comps, ob]) => {
      setCompany(profile);
      setCompetitors(comps);
      setOnboarding(ob);
      setIsLoading(false);
    });
  }, []);

  const updateCompany = useCallback(async (profile: CompanyProfile) => {
    await saveCompanyProfile(profile);
    setCompany(profile);
  }, []);

  const updateCompetitors = useCallback(async (list: Competitor[]) => {
    await saveCompetitors(list);
    setCompetitors(list);
  }, []);

  const updateOnboarding = useCallback(async (state: OnboardingState) => {
    await saveOnboardingState(state);
    setOnboarding(state);
  }, []);

  const clearAll = useCallback(async () => {
    await Promise.all([
      clearCompanyProfile(),
      clearCompetitors(),
      clearOnboardingState(),
    ]);
    setCompany(null);
    setCompetitors([]);
    setOnboarding({ completed: false, currentStep: 1 });
  }, []);

  return (
    <CompanyContext.Provider
      value={{ company, competitors, onboarding, isLoading, updateCompany, updateCompetitors, updateOnboarding, clearAll }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextType {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used inside <CompanyProvider>');
  return ctx;
}
