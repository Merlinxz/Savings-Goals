import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { GoalFormDialog } from '@/features/goals/GoalFormDialog';
import { ProactivePlanAdjustmentDialog } from '@/features/goals/ProactivePlanAdjustmentDialog';
import { TransactionDialog } from '@/features/goals/TransactionDialog';
import { WelcomeModal } from '@/features/onboarding/WelcomeModal';
import { Toaster } from '@/components/ui/sonner';
import { Goal } from '@/types';
import { PacingAlert } from '@/lib/pacingAlerts';
import { useGoalsStore } from '@/store/useGoalsStore';

export function AppLayout() {
  const { goals } = useGoalsStore();
  const navigate = useNavigate();
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [welcomeTourOpen, setWelcomeTourOpen] = useState<boolean | undefined>(undefined);

  // Proactive Plan Adjustment modal state
  const [adjustPlanOpen, setAdjustPlanOpen] = useState(false);
  const [targetAdjustGoal, setTargetAdjustGoal] = useState<Goal | null>(null);
  const [targetAdjustAlert, setTargetAdjustAlert] = useState<PacingAlert | null>(null);

  // Catch-up / Quick deposit modal state
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositDefaultAmount, setDepositDefaultAmount] = useState<number | undefined>(undefined);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('savings-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('savings-sidebar-collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const handleAdjustPlan = (goal: Goal, alert?: PacingAlert) => {
    setTargetAdjustGoal(goal);
    setTargetAdjustAlert(alert || null);
    setAdjustPlanOpen(true);
  };

  const handleOpenDeposit = (goalId: string, suggestedAmount?: number) => {
    const target = goals.find((g) => g.id === goalId);
    if (target) {
      setDepositGoal(target);
      setDepositDefaultAmount(suggestedAmount);
      setDepositOpen(true);
    }
  };

  const handleSelectGoal = (goalId: string) => {
    navigate(`/goals/${goalId}`);
  };

  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Desktop Sidebar */}
      <Sidebar
        onNewGoal={() => setCreateGoalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <div className="flex flex-1 flex-col min-w-0 pb-16 md:pb-0 w-full">
        {/* Top Navbar */}
        <Navbar
          onNewGoal={() => setCreateGoalOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onAdjustPlan={handleAdjustPlan}
          onOpenDeposit={handleOpenDeposit}
          onSelectGoal={handleSelectGoal}
        />

        {/* Main Content with Route Transition (Full Screen Edge-to-Edge) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 w-full min-w-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full"
          >
            <Outlet
              context={{
                openCreateGoal: () => setCreateGoalOpen(true),
                openWelcomeTour: () => setWelcomeTourOpen(true),
                onAdjustPlan: handleAdjustPlan,
                onOpenDeposit: handleOpenDeposit,
              }}
            />
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onNewGoal={() => setCreateGoalOpen(true)} />

      {/* Welcome & Notification Onboarding Modal for First Open */}
      <WelcomeModal
        forceOpen={welcomeTourOpen}
        onOpenChange={setWelcomeTourOpen}
      />

      {/* Global Goal Creation Dialog */}
      <GoalFormDialog open={createGoalOpen} onOpenChange={setCreateGoalOpen} />

      {/* Global Proactive Plan Adjustment Dialog */}
      <ProactivePlanAdjustmentDialog
        open={adjustPlanOpen}
        onOpenChange={setAdjustPlanOpen}
        goal={targetAdjustGoal}
        alert={targetAdjustAlert}
        onOpenDeposit={handleOpenDeposit}
      />

      {/* Global Quick/Catch-up Deposit Dialog */}
      <TransactionDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        goal={depositGoal}
        defaultType="deposit"
        defaultAmount={depositDefaultAmount}
      />

      {/* Sonner Toaster */}
      <Toaster position="bottom-right" />
    </div>
  );
}

