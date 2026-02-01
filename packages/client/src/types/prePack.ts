export interface PrepPackViewProps {
  result: PrepPackResult;
}

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

/** Partial update for PATCH /api/prep-packs/:id */
export interface UpdatePrepPackRequest {
  title?: string;
  startupName?: string;
  investorName?: string;
  startupProfileText?: string;
  investorProfileText?: string;
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

export interface PrepPackListItem {
  id: string;
  createdAt: string;
  title: string;
  startupName?: string | null;
  investorName?: string | null;
  fitScore?: number | null;
}
