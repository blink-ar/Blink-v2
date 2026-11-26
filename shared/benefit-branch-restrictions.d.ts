export interface BenefitBranchRestriction {
  readonly payment: string;
  readonly branches: readonly string[];
  readonly sourceUrl: string;
}

export function getBenefitBranchRestriction(
  benefit: { id?: string | null } | null | undefined
): BenefitBranchRestriction | null;
