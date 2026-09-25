import React, { useState } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calculator,
  Target,
  Sparkles,
  ArrowLeft,
  PiggyBank,
  TrendingUp,
  Lightbulb,
  CreditCard,
  ShieldCheck,
  Zap,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SavingsCalculator } from '@/features/calculator/SavingsCalculator';
import { DebtPayoffCalculator } from '@/features/calculator/DebtPayoffCalculator';
import { EmergencyFundPlanner } from '@/features/calculator/EmergencyFundPlanner';
import { GoalFormDialog } from '@/features/goals/GoalFormDialog';
import { GoalFormData } from '@/types';
import { cn } from '@/lib/utils';

export function SavingsCalculatorPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'savings';

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [prefilledGoal, setPrefilledGoal] = useState<Partial<GoalFormData> | null>(null);

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  const handleCreateGoalWithData = (data: {
    targetAmount: number;
    currentAmount: number;
    monthlyContribution: number;
  }) => {
    setPrefilledGoal({
      name: 'New Savings Goal',
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || 0,
      recurringContribution: {
        enabled: true,
        frequency: 'monthly',
        amount: data.monthlyContribution || 100,
        dayOfWeek: 1,
        dayOfMonth: 1,
      },
    });
    setCreateDialogOpen(true);
  };

  const handleCreateGoalFromDebtCashflow = (freedMonthlyCashflow: number) => {
    setPrefilledGoal({
      name: 'Post-Debt Payoff Savings',
      targetAmount: Math.round(freedMonthlyCashflow * 24), // 2-year savings horizon default
      currentAmount: 0,
      category: 'Retirement & Future',
      icon: 'TrendingUp',
      notes: `Accelerated savings from unlocked debt payments (${freedMonthlyCashflow.toLocaleString()}/month)`,
      recurringContribution: {
        enabled: true,
        frequency: 'monthly',
        amount: Math.round(freedMonthlyCashflow),
        dayOfWeek: 1,
        dayOfMonth: 1,
      },
    });
    setCreateDialogOpen(true);
  };

  const handleCreateEmergencyGoal = (data: {
    name: string;
    targetAmount: number;
    category: 'Emergency Fund';
    icon: string;
    notes?: string;
  }) => {
    setPrefilledGoal({
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: 0,
      category: data.category,
      icon: data.icon as any,
      notes: data.notes,
      recurringContribution: {
        enabled: true,
        frequency: 'monthly',
        amount: Math.round(data.targetAmount / 12), // default 12-month accumulation pace
        dayOfWeek: 1,
        dayOfMonth: 1,
      },
    });
    setCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs font-medium text-muted-foreground">Financial Toolkit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Calculator className="h-7 w-7 text-primary shrink-0" />
            Financial Planning Toolkit
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Comprehensive financial planning toolkit: savings growth projections, debt payoff simulator (Snowball vs. Avalanche), and emergency runway planner.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/goals')}
            className="text-xs gap-1.5"
          >
            <Target className="h-3.5 w-3.5" />
            View My Goals
          </Button>
        </div>
      </div>

      {/* Main Tab Navigation for Toolkit */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 h-auto p-1 bg-muted/60 border border-border/80 rounded-xl gap-1">
          <TabsTrigger
            value="savings"
            className="py-2.5 px-3 text-xs gap-2 font-medium data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-lg transition-all"
          >
            <PiggyBank className="h-4 w-4 text-emerald-500" />
            <span>Savings & Growth</span>
          </TabsTrigger>

          <TabsTrigger
            value="debt"
            className="py-2.5 px-3 text-xs gap-2 font-medium data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-lg transition-all"
          >
            <TrendingDown className="h-4 w-4 text-rose-500" />
            <span>Debt Payoff (Snowball / Avalanche)</span>
          </TabsTrigger>

          <TabsTrigger
            value="emergency"
            className="py-2.5 px-3 text-xs gap-2 font-medium data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-lg transition-all"
          >
            <ShieldCheck className="h-4 w-4 text-sky-500" />
            <span>Emergency Fund Planner</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Savings Goal Calculator */}
        <TabsContent value="savings" className="space-y-6 mt-0">
          <SavingsCalculator onCreateGoal={handleCreateGoalWithData} />

          {/* Financial Strategy & Quick Tips Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Automate Your Contribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                Setting up automated transfers on payday (Pay Yourself First) ensures consistency and eliminates the risk of spending before saving.
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  High-Yield Savings Advantage
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                Storing savings in a high-yield account harnesses compound interest, significantly reducing the time needed to hit your targets.
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  The Micro-Savings Habit
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                Contributing an extra $20 to $50 each month from side gigs or cutbacks creates exponential long-term portfolio growth.
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Debt Payoff Calculator (Snowball vs Avalanche) */}
        <TabsContent value="debt" className="mt-0">
          <DebtPayoffCalculator
            onCreateGoalFromCashflow={handleCreateGoalFromDebtCashflow}
          />
        </TabsContent>

        {/* Tab 3: Emergency Fund Rule-of-Thumb Planner */}
        <TabsContent value="emergency" className="mt-0">
          <EmergencyFundPlanner
            onCreateGoal={handleCreateEmergencyGoal}
          />
        </TabsContent>
      </Tabs>

      {/* Goal creation dialog when user clicks 'Create New Goal from Calculation' */}
      {createDialogOpen && (
        <GoalFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          initialValues={prefilledGoal}
        />
      )}
    </div>
  );
}
