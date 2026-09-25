import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Info,
  HeartHandshake,
  DollarSign,
  Home,
  Utensils,
  Car,
  Briefcase,
  Users,
  Shield,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGoalsStore } from '@/store/useGoalsStore';
import { formatCurrency } from '@/lib/currencies';
import {
  EssentialExpenses,
  EmergencyRiskProfile,
  DEFAULT_ESSENTIAL_EXPENSES,
  DEFAULT_RISK_PROFILE,
  calculateEmergencyFundAnalysis,
  EmploymentType,
  HouseholdEarnerType,
  DependentsType,
  InsuranceCoverage,
} from '@/lib/emergencyFundPlanner';
import { cn } from '@/lib/utils';

interface EmergencyFundPlannerProps {
  onCreateGoal?: (data: {
    name: string;
    targetAmount: number;
    category: 'Emergency Fund';
    icon: string;
    notes?: string;
  }) => void;
}

export function EmergencyFundPlanner({ onCreateGoal }: EmergencyFundPlannerProps) {
  const { settings, goals, updateGoal } = useGoalsStore();

  const [expenses, setExpenses] = useState<EssentialExpenses>(DEFAULT_ESSENTIAL_EXPENSES);
  const [profile, setProfile] = useState<EmergencyRiskProfile>(DEFAULT_RISK_PROFILE);

  // Analysis result
  const analysis = useMemo(() => {
    return calculateEmergencyFundAnalysis(expenses, profile);
  }, [expenses, profile]);

  // Check if an existing Emergency Fund goal exists in the user's goals
  const existingEmergencyGoal = useMemo(() => {
    return goals.find(
      (g) =>
        g.category === 'Emergency Fund' ||
        g.name.toLowerCase().includes('emergency') ||
        g.name.toLowerCase().includes('rainy day') ||
        g.name.toLowerCase().includes('safety net')
    );
  }, [goals]);

  const handleExpenseChange = (key: keyof EssentialExpenses, value: string) => {
    const num = parseFloat(value);
    setExpenses((prev) => ({
      ...prev,
      [key]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  const handleReset = () => {
    setExpenses(DEFAULT_ESSENTIAL_EXPENSES);
    setProfile(DEFAULT_RISK_PROFILE);
    toast.success('Planner reset to defaults');
  };

  const handleCreateOrUpdateGoal = (targetAmount: number) => {
    if (existingEmergencyGoal) {
      updateGoal(existingEmergencyGoal.id, {
        targetAmount,
        notes: `${existingEmergencyGoal.notes || ''}\n(Updated to ${analysis.recommendedMonths}-month emergency reserve on ${new Date().toLocaleDateString('en-US')})`.trim(),
      });
      toast.success(
        `Updated "${existingEmergencyGoal.name}" target to ${formatCurrency(targetAmount, settings.currency)}`
      );
    } else if (onCreateGoal) {
      onCreateGoal({
        name: 'Emergency Fund',
        targetAmount,
        category: 'Emergency Fund',
        icon: 'Shield',
        notes: `Calculated from recommended ${analysis.recommendedMonths}-month runway (essential monthly living costs: ${formatCurrency(analysis.monthlyEssentialExpenses, settings.currency)})`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 via-background to-sky-500/5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Rule-of-Thumb Assessment
              </span>
              <span className="text-xs text-muted-foreground">
                Global Financial Benchmark (3–6+ Months)
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Emergency Fund Runway Planner
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Calculate an emergency reserve sized specifically to your essential living expenses and career stability risk profile, ensuring true peace of mind.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs h-8 gap-1.5 self-start md:self-auto shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Expenses & Risk Profile Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Essential Monthly Expenses Breakdown */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-primary" />
                    Section 1: Essential Monthly Living Expenses
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Only include non-negotiable survival expenses (exclude luxuries, travel, and dining out)
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-primary block">
                    {formatCurrency(analysis.monthlyEssentialExpenses, settings.currency)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">per month</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Housing */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-muted-foreground" />
                    Rent / Mortgage / HOA
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={expenses.housing || ''}
                    onChange={(e) => handleExpenseChange('housing', e.target.value)}
                    className="h-8 font-mono text-xs"
                    placeholder="1,200"
                  />
                </div>

                {/* Utilities */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    Utilities (Water, Power, Phone, Net)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={expenses.utilities || ''}
                    onChange={(e) => handleExpenseChange('utilities', e.target.value)}
                    className="h-8 font-mono text-xs"
                    placeholder="250"
                  />
                </div>

                {/* Food */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <Utensils className="h-3.5 w-3.5 text-muted-foreground" />
                    Groceries & Household Supplies
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={expenses.food || ''}
                    onChange={(e) => handleExpenseChange('food', e.target.value)}
                    className="h-8 font-mono text-xs"
                    placeholder="800"
                  />
                </div>

                {/* Transport */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-muted-foreground" />
                    Transportation / Fuel / Transit
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={expenses.transport || ''}
                    onChange={(e) => handleExpenseChange('transport', e.target.value)}
                    className="h-8 font-mono text-xs"
                    placeholder="350"
                  />
                </div>

                {/* Insurance / Health */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    Health Insurance & Essential Meds
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={expenses.insuranceHealth || ''}
                    onChange={(e) => handleExpenseChange('insuranceHealth', e.target.value)}
                    className="h-8 font-mono text-xs"
                    placeholder="200"
                  />
                </div>

                {/* Debt Minimums */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    Minimum Debt Payments
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={expenses.debtMinimums || ''}
                    onChange={(e) => handleExpenseChange('debtMinimums', e.target.value)}
                    className="h-8 font-mono text-xs"
                    placeholder="400"
                  />
                </div>

                {/* Dependents */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Dependents, Childcare & Pet Care
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={expenses.dependentsFamily || ''}
                    onChange={(e) => handleExpenseChange('dependentsFamily', e.target.value)}
                    className="h-8 font-mono text-xs"
                    placeholder="300"
                  />
                </div>

                {/* Other essentials */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                    <HeartHandshake className="h-3.5 w-3.5 text-muted-foreground" />
                    Other Non-Negotiables
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={expenses.otherEssentials || ''}
                    onChange={(e) => handleExpenseChange('otherEssentials', e.target.value)}
                    className="h-8 font-mono text-xs"
                    placeholder="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Risk & Stability Profile */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-sky-500" />
                Section 2: Career Stability & Risk Profile
              </CardTitle>
              <CardDescription className="text-xs">
                These factors calibrate whether 3, 6, or 9–12 months of runway is ideal
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-1 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Employment Type */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Employment Type & Income Stability
                  </label>
                  <Select
                    value={profile.employmentType}
                    onValueChange={(val) =>
                      setProfile((p) => ({ ...p, employmentType: val as EmploymentType }))
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salaried_stable" className="text-xs">
                        Stable Salaried (Corporate / Public Sector)
                      </SelectItem>
                      <SelectItem value="salaried_variable" className="text-xs">
                        Variable Salaried (Sales / Commission / Bonuses)
                      </SelectItem>
                      <SelectItem value="freelance_business" className="text-xs">
                        Freelancer / Contractor / Business Owner
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Earner Structure */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Household Income Structure
                  </label>
                  <Select
                    value={profile.earnerType}
                    onValueChange={(val) =>
                      setProfile((p) => ({ ...p, earnerType: val as HouseholdEarnerType }))
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dual_earner" className="text-xs">
                        Dual / Multi-Earner Household (Shared bills)
                      </SelectItem>
                      <SelectItem value="single_earner" className="text-xs">
                        Single Earner (Solo household)
                      </SelectItem>
                      <SelectItem value="sole_provider" className="text-xs">
                        Sole Breadwinner (Supporting multiple dependents)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dependents */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Dependents (Children / Aging Parents)
                  </label>
                  <Select
                    value={profile.dependents}
                    onValueChange={(val) =>
                      setProfile((p) => ({ ...p, dependents: val as DependentsType }))
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">
                        No Dependents (Self-reliant)
                      </SelectItem>
                      <SelectItem value="moderate" className="text-xs">
                        1–2 Dependents
                      </SelectItem>
                      <SelectItem value="high" className="text-xs">
                        3+ Dependents (Large family)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Insurance Coverage */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground">
                    Healthcare & Insurance Protection
                  </label>
                  <Select
                    value={profile.insuranceCoverage}
                    onValueChange={(val) =>
                      setProfile((p) => ({ ...p, insuranceCoverage: val as InsuranceCoverage }))
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive" className="text-xs">
                        Comprehensive Health & Accident Insurance
                      </SelectItem>
                      <SelectItem value="basic_employer" className="text-xs">
                        Basic Employer or Public Coverage Only
                      </SelectItem>
                      <SelectItem value="none" className="text-xs">
                        No Private Coverage (Self-pay out of pocket)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recommendation, Tiers, Action to Goal (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Recommendation Card */}
          <Card className="border-border bg-card shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 bg-linear-to-b from-primary/10 to-transparent">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Emergency Reserve Assessment
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider',
                    analysis.riskLevel === 'Low'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : analysis.riskLevel === 'Moderate'
                      ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                      : analysis.riskLevel === 'High'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                  )}
                >
                  {analysis.riskLevel} Risk (Score {analysis.riskScore}/5)
                </span>
              </div>

              <div className="mt-2">
                <div className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                  {formatCurrency(analysis.recommendedTarget, settings.currency)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recommended target: <strong>{analysis.recommendedMonths} Months</strong> of essential expenses
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-3 space-y-4">
              {/* Tiers Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground block">
                  Safety Tiers Breakdown:
                </span>

                <div className="space-y-1.5">
                  {analysis.tiers.map((tier) => (
                    <div
                      key={tier.months}
                      className={cn(
                        'p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-3',
                        tier.recommended
                          ? 'border-primary bg-primary/5 shadow-2xs'
                          : 'border-border/70 bg-card hover:border-border'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          {tier.label}
                          {tier.recommended && (
                            <span className="text-[9px] bg-primary text-primary-foreground font-bold px-1.5 py-0.2 rounded-full uppercase">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {tier.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-foreground">
                          {formatCurrency(tier.amount, settings.currency)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCreateOrUpdateGoal(tier.amount)}
                          className="text-[10px] text-primary hover:underline font-medium"
                        >
                          Use this tier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rationale Points */}
              <div className="space-y-1.5 pt-1 border-t border-border/60">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Assessment Rationale:
                </span>
                <ul className="space-y-1 text-[11px] text-muted-foreground list-disc pl-4 leading-relaxed">
                  {analysis.rationalePoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>

              {/* Existing Goal Integration Box */}
              {existingEmergencyGoal ? (
                <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sky-950 dark:text-sky-100 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                      Existing Emergency Goal Found
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {existingEmergencyGoal.name}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-muted-foreground">Current Target:</span>
                    <strong className="text-foreground font-mono">
                      {formatCurrency(existingEmergencyGoal.targetAmount, settings.currency)}
                    </strong>
                  </div>

                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-muted-foreground">Current Saved:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(existingEmergencyGoal.currentAmount, settings.currency)}
                    </strong>
                  </div>

                  <Button
                    size="sm"
                    className="w-full h-8 text-xs gap-1.5 font-medium mt-1"
                    onClick={() => handleCreateOrUpdateGoal(analysis.recommendedTarget)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Update Goal Target to {formatCurrency(analysis.recommendedTarget, settings.currency)}
                  </Button>
                </div>
              ) : (
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="w-full h-9 text-xs gap-2 font-semibold shadow-xs"
                    onClick={() => handleCreateOrUpdateGoal(analysis.recommendedTarget)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Create Emergency Fund Goal ({formatCurrency(analysis.recommendedTarget, settings.currency)})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
