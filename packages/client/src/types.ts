/** Structured prep pack result from generate or stored in DB */
export interface PrepPackResult {
  startupSummary: string[];
  fitScore: number;
  fitReasons: string[];
  questions: string[];
  agenda: {
    min0_2: string[];
    min2_7: string[];
    min7_12: string[];
    min12_15: string[];
  };
}

export interface GenerateRequest {
  startupProfileText: string;
  investorProfileText: string;
  startupName?: string;
  investorName?: string;
}

export interface GenerateResponse {
  prepPack: PrepPackResult;
  meta?: {
    model?: string;
    repaired?: boolean;
    tokensUsed?: number;
  };
}

export interface SavePrepPackRequest {
  title: string;
  startupName?: string;
  investorName?: string;
  startupProfileText: string;
  investorProfileText: string;
  resultJson: PrepPackResult;
  model?: string;
  tokensUsed?: number;
}

export interface PrepPackListItem {
  id: string;
  createdAt: string;
  title: string;
  startupName?: string | null;
  investorName?: string | null;
  fitScore?: number | null;
}

export interface PrepPackDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  startupName?: string | null;
  investorName?: string | null;
  startupProfileText: string;
  investorProfileText: string;
  resultJson: PrepPackResult;
  model?: string | null;
  tokensUsed?: number | null;
}
