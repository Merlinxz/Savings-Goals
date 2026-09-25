export interface EssentialExpenses {
  housing: number; // Rent / Mortgage / HOA / property maintenance
  utilities: number; // Water, electricity, heating, internet, phone bills
  food: number; // Groceries & daily essential household supplies
  transport: number; // Gas, public transit, insurance, essential commuting
  insuranceHealth: number; // Health/life insurance premiums & essential medications
  debtMinimums: number; // Minimum required monthly loan & debt payments
  dependentsFamily: number; // Childcare, elderly care, dependent support, pet essentials
  otherEssentials: number; // Miscellaneous non-negotiable living expenses
}

export type EmploymentType = 'salaried_stable' | 'salaried_variable' | 'freelance_business';
export type HouseholdEarnerType = 'dual_earner' | 'single_earner' | 'sole_provider';
export type DependentsType = 'none' | 'moderate' | 'high';
export type InsuranceCoverage = 'comprehensive' | 'basic_employer' | 'none';

export interface EmergencyRiskProfile {
  employmentType: EmploymentType;
  earnerType: HouseholdEarnerType;
  dependents: DependentsType;
  insuranceCoverage: InsuranceCoverage;
}

export interface EmergencyFundAnalysis {
  monthlyEssentialExpenses: number;
  recommendedMonths: number;
  minimumMonths: number;
  maximumMonths: number;
  recommendedTarget: number;
  minimumTarget: number;
  maximumTarget: number;
  riskScore: number; // 1 to 5 (1 = lowest risk, 5 = highest risk)
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  riskDescription: string;
  rationalePoints: string[];
  ruleOfThumbSummary: string;
  tiers: {
    months: number;
    amount: number;
    label: string;
    description: string;
    recommended?: boolean;
  }[];
}

export const DEFAULT_ESSENTIAL_EXPENSES: EssentialExpenses = {
  housing: 1200,
  utilities: 250,
  food: 800,
  transport: 350,
  insuranceHealth: 200,
  debtMinimums: 400,
  dependentsFamily: 300,
  otherEssentials: 100,
};

export const DEFAULT_RISK_PROFILE: EmergencyRiskProfile = {
  employmentType: 'salaried_stable',
  earnerType: 'dual_earner',
  dependents: 'none',
  insuranceCoverage: 'comprehensive',
};

export function calculateEmergencyFundAnalysis(
  expenses: EssentialExpenses,
  profile: EmergencyRiskProfile
): EmergencyFundAnalysis {
  const monthlyEssential = Object.values(expenses).reduce(
    (acc, val) => acc + (isNaN(val) || val < 0 ? 0 : val),
    0
  );

  let baseMonths = 3;
  let riskScore = 1;
  const rationale: string[] = [];

  // 1. Employment factor
  if (profile.employmentType === 'salaried_stable') {
    baseMonths += 1;
    riskScore += 0.5;
    rationale.push('Stable salaried employment: Predictable income stream with low immediate disruption risk.');
  } else if (profile.employmentType === 'salaried_variable') {
    baseMonths += 2;
    riskScore += 1.5;
    rationale.push('Variable salaried income (commission / bonuses): Buffer needed to smooth lower-earning months.');
  } else if (profile.employmentType === 'freelance_business') {
    baseMonths += 4;
    riskScore += 2.5;
    rationale.push('Freelancer / Small Business Owner: High income volatility; recommended 6–9 months runway buffer.');
  }

  // 2. Earner structure
  if (profile.earnerType === 'dual_earner') {
    rationale.push('Dual-earner household: Secondary income cushions the impact if one earner experiences job loss.');
  } else if (profile.earnerType === 'single_earner') {
    baseMonths += 1;
    riskScore += 1;
    rationale.push('Single earner household: Higher vulnerability to unexpected disruption requiring additional runway.');
  } else if (profile.earnerType === 'sole_provider') {
    baseMonths += 2;
    riskScore += 1.5;
    rationale.push('Sole household breadwinner: Substantial cushion required to safeguard family dependents.');
  }

  // 3. Dependents
  if (profile.dependents === 'none') {
    rationale.push('No dependents: High spending flexibility and agility to downscale costs in an emergency.');
  } else if (profile.dependents === 'moderate') {
    baseMonths += 1;
    riskScore += 0.5;
    rationale.push('1–2 dependents (children / elderly parents): Inflexible recurring commitments requiring buffer.');
  } else if (profile.dependents === 'high') {
    baseMonths += 2;
    riskScore += 1;
    rationale.push('3+ dependents (large family): High non-negotiable living costs require at least 1–2 extra months buffer.');
  }

  // 4. Insurance
  if (profile.insuranceCoverage === 'comprehensive') {
    rationale.push('Comprehensive medical/disability insurance: Protects emergency reserves from major healthcare shocks.');
  } else if (profile.insuranceCoverage === 'basic_employer') {
    baseMonths += 0.5;
    riskScore += 0.5;
    rationale.push('Basic employer coverage only: Recommended cushion for out-of-pocket deductibles and coinsurance.');
  } else if (profile.insuranceCoverage === 'none') {
    baseMonths += 1.5;
    riskScore += 1.5;
    rationale.push('No private health insurance: Emergency fund must also absorb potential healthcare outlays.');
  }

  // Final recommended months normalized (between 3 and 12)
  const recommendedMonths = Math.min(12, Math.max(3, Math.round(baseMonths)));
  const minimumMonths = Math.max(3, recommendedMonths - 2);
  const maximumMonths = Math.min(12, recommendedMonths + 3);

  const recommendedTarget = Math.round(monthlyEssential * recommendedMonths);
  const minimumTarget = Math.round(monthlyEssential * minimumMonths);
  const maximumTarget = Math.round(monthlyEssential * maximumMonths);

  let riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High' = 'Moderate';
  let riskDescription = 'Moderate risk exposure: Standard guideline recommends 4–6 months of essential living expenses.';

  if (riskScore <= 2) {
    riskLevel = 'Low';
    riskDescription = 'Low risk profile: Steady income and minimal dependents. A 3–4 month reserve is well-balanced.';
  } else if (riskScore <= 3.5) {
    riskLevel = 'Moderate';
    riskDescription = 'Moderate risk profile: Standard recommendation of 5–6 months ensures dependable resilience.';
  } else if (riskScore <= 4.5) {
    riskLevel = 'High';
    riskDescription = 'High risk profile: Variable income or dependents; recommended 6–9 months reserve.';
  } else {
    riskLevel = 'Very High';
    riskDescription = 'Very high risk profile: Freelancing/sole provider status requires 9–12 months defensive cushion.';
  }

  const tiers = [
    {
      months: 3,
      amount: Math.round(monthlyEssential * 3),
      label: '3 Months (Survival Tier)',
      description: 'Baseline emergency cushion to weather immediate short-term disruptions.',
      recommended: recommendedMonths === 3,
    },
    {
      months: 6,
      amount: Math.round(monthlyEssential * 6),
      label: '6 Months (Standard Tier)',
      description: 'Financial gold standard protecting against extended job hunts or unforeseen medical costs.',
      recommended: recommendedMonths >= 5 && recommendedMonths <= 7,
    },
    {
      months: recommendedMonths > 7 ? recommendedMonths : 9,
      amount: Math.round(monthlyEssential * (recommendedMonths > 7 ? recommendedMonths : 9)),
      label: `${recommendedMonths > 7 ? recommendedMonths : 9} Months (Peace of Mind)`,
      description: 'Maximum financial fortress optimal for entrepreneurs, freelancers, and large families.',
      recommended: recommendedMonths >= 8,
    },
  ];

  return {
    monthlyEssentialExpenses: monthlyEssential,
    recommendedMonths,
    minimumMonths,
    maximumMonths,
    recommendedTarget,
    minimumTarget,
    maximumTarget,
    riskScore: Math.min(5, Math.max(1, Math.round(riskScore * 10) / 10)),
    riskLevel,
    riskDescription,
    rationalePoints: rationale,
    ruleOfThumbSummary: `Based on your risk profile, we recommend a ${recommendedMonths}-month emergency reserve (approx. ${recommendedTarget.toLocaleString()}) to cover essential expenses of ${monthlyEssential.toLocaleString()}/month.`,
    tiers,
  };
}
