import type { PrepPackResult } from "./prePack";

export interface GeneratorFormProps {
  startupProfileText: string;
  setStartupProfileText: (v: string) => void;
  investorProfileText: string;
  setInvestorProfileText: (v: string) => void;
  startupName: string;
  setStartupName: (v: string) => void;
  investorName: string;
  setInvestorName: (v: string) => void;
  canGenerate: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  onGenerate: () => void;
  onClear: () => void;
}

export interface GenerateResponse {
  prepPack: PrepPackResult;
  meta?: {
    model?: string;
    repaired?: boolean;
    tokensUsed?: number;
  };
}

export interface GenerateRequest {
  startupProfileText: string;
  investorProfileText: string;
  startupName?: string;
  investorName?: string;
}
