export interface DemoBranchConfig {
  enabled: boolean;
  submissionNumber: number | null;
  companyName: string | null;
  contactName: string | null;
  branchName: string | null;
  generatedAt: string | null;
}

export const demoBranchConfig = {
  enabled: false,
  submissionNumber: null,
  companyName: null,
  contactName: null,
  branchName: null,
  generatedAt: null,
} satisfies DemoBranchConfig;
