import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Goal,
  GoalFormData,
  Transaction,
  TransactionType,
  UserSettings,
  NotificationSettings,
  CurrencyCode,
  ViewMode,
  FilterStatus,
  SortField,
  SortOrder,
} from '@/types';
import { INITIAL_GOALS, INITIAL_TRANSACTIONS } from '@/lib/seed-data';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/notifications';

interface GoalsState {
  goals: Goal[];
  transactions: Transaction[];
  settings: UserSettings;
  viewMode: ViewMode;
  searchQuery: string;
  filterStatus: FilterStatus;
  filterCategory: string;
  filterTag: string;
  sortBy: SortField;
  sortOrder: SortOrder;
  dismissedAlertGoalIds: string[];

  // Actions
  addGoal: (data: GoalFormData) => Goal;
  updateGoal: (id: string, data: Partial<GoalFormData>) => void;
  deleteGoal: (id: string) => void;
  addTagToGoal: (goalId: string, tag: string) => void;
  removeTagFromGoal: (goalId: string, tag: string) => void;
  addTransaction: (goalId: string, type: TransactionType, amount: number, note?: string) => Transaction;
  deleteTransaction: (transactionId: string) => void;
  importTransactions: (
    items: Array<{
      goalId: string;
      type: TransactionType;
      amount: number;
      note?: string;
      date: string;
    }>
  ) => { importedCount: number; updatedGoalsCount: number };
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateNotificationSettings: (notifications: Partial<NotificationSettings>) => void;
  dismissAlert: (goalId: string) => void;
  resetDismissedAlerts: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setFilterCategory: (category: string) => void;
  setFilterTag: (tag: string) => void;
  setSorting: (field: SortField, order: SortOrder) => void;
  resetToDefaults: () => void;
  loadSampleData: () => void;
  clearAllData: () => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: INITIAL_GOALS,
      transactions: INITIAL_TRANSACTIONS,
      settings: {
        currency: 'USD',
        theme: 'system',
        pacingAlertsEnabled: true,
        notifications: DEFAULT_NOTIFICATION_SETTINGS,
      },
      viewMode: 'grid',
      searchQuery: '',
      filterStatus: 'all',
      filterCategory: 'all',
      filterTag: 'all',
      sortBy: 'deadline',
      sortOrder: 'asc',
      dismissedAlertGoalIds: [],

      addGoal: (data: GoalFormData) => {
        const id = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();
        const newGoal: Goal = {
          ...data,
          tags: data.tags || [],
          id,
          createdAt: now,
          updatedAt: now,
        };

        const newTransactions: Transaction[] = [];
        if (data.currentAmount > 0) {
          const initialTx: Transaction = {
            id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            goalId: id,
            type: 'deposit',
            amount: data.currentAmount,
            note: 'Initial balance',
            date: now,
            createdAt: now,
          };
          newTransactions.push(initialTx);
        }

        set((state) => ({
          goals: [newGoal, ...state.goals],
          transactions: [...newTransactions, ...state.transactions],
        }));

        return newGoal;
      },

      updateGoal: (id: string, data: Partial<GoalFormData>) => {
        const now = new Date().toISOString();
        set((state) => {
          const targetGoal = state.goals.find((g) => g.id === id);
          if (!targetGoal) return state;

          const updatedGoals = state.goals.map((g) => {
            if (g.id !== id) return g;
            return {
              ...g,
              ...data,
              updatedAt: now,
            };
          });

          let newTransactions = state.transactions;
          if (
            typeof data.currentAmount === 'number' &&
            data.currentAmount !== targetGoal.currentAmount
          ) {
            const diff = data.currentAmount - targetGoal.currentAmount;
            const adjustmentTx: Transaction = {
              id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              goalId: id,
              type: diff > 0 ? 'deposit' : 'withdrawal',
              amount: Math.abs(diff),
              note: 'Balance adjustment',
              date: now,
              createdAt: now,
            };
            newTransactions = [adjustmentTx, ...state.transactions];
          }

          return {
            goals: updatedGoals,
            transactions: newTransactions,
          };
        });
      },

      deleteGoal: (id: string) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          transactions: state.transactions.filter((t) => t.goalId !== id),
        }));
      },

      addTagToGoal: (goalId: string, tag: string) => {
        const trimmed = tag.trim().replace(/^#/, '');
        if (!trimmed) return;
        const now = new Date().toISOString();
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            const currentTags = g.tags || [];
            if (currentTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return g;
            return {
              ...g,
              tags: [...currentTags, trimmed],
              updatedAt: now,
            };
          }),
        }));
      },

      removeTagFromGoal: (goalId: string, tag: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g;
            const currentTags = g.tags || [];
            return {
              ...g,
              tags: currentTags.filter((t) => t.toLowerCase() !== tag.toLowerCase()),
              updatedAt: now,
            };
          }),
        }));
      },

      addTransaction: (goalId: string, type: TransactionType, amount: number, note?: string) => {
        const now = new Date().toISOString();
        const tx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          goalId,
          type,
          amount,
          note: note?.trim() || undefined,
          date: now,
          createdAt: now,
        };

        set((state) => {
          const updatedGoals = state.goals.map((goal) => {
            if (goal.id !== goalId) return goal;
            const delta = type === 'deposit' ? amount : -amount;
            const newCurrent = Math.max(0, goal.currentAmount + delta);
            return {
              ...goal,
              currentAmount: newCurrent,
              updatedAt: now,
            };
          });

          return {
            goals: updatedGoals,
            transactions: [tx, ...state.transactions],
          };
        });

        return tx;
      },

      deleteTransaction: (transactionId: string) => {
        const tx = get().transactions.find((t) => t.id === transactionId);
        if (!tx) return;

        set((state) => {
          const updatedGoals = state.goals.map((goal) => {
            if (goal.id !== tx.goalId) return goal;
            // Reverse transaction effect
            const reverseDelta = tx.type === 'deposit' ? -tx.amount : tx.amount;
            const newCurrent = Math.max(0, goal.currentAmount + reverseDelta);
            return {
              ...goal,
              currentAmount: newCurrent,
              updatedAt: new Date().toISOString(),
            };
          });

          return {
            goals: updatedGoals,
            transactions: state.transactions.filter((t) => t.id !== transactionId),
          };
        });
      },

      importTransactions: (items) => {
        if (!items || items.length === 0) return { importedCount: 0, updatedGoalsCount: 0 };
        const now = new Date().toISOString();

        const goalDeltas = new Map<string, number>();
        const newTxs: Transaction[] = [];

        items.forEach((item, index) => {
          const delta = item.type === 'deposit' ? item.amount : -item.amount;
          goalDeltas.set(item.goalId, (goalDeltas.get(item.goalId) || 0) + delta);

          newTxs.push({
            id: `tx-import-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
            goalId: item.goalId,
            type: item.type,
            amount: item.amount,
            note: item.note?.trim() || undefined,
            date: item.date || now,
            createdAt: now,
          });
        });

        let updatedGoalsCount = 0;
        set((state) => {
          const updatedGoals = state.goals.map((goal) => {
            const delta = goalDeltas.get(goal.id);
            if (delta === undefined) return goal;
            updatedGoalsCount++;
            const newCurrent = Math.max(0, goal.currentAmount + delta);
            return {
              ...goal,
              currentAmount: newCurrent,
              updatedAt: now,
            };
          });

          return {
            goals: updatedGoals,
            transactions: [...newTxs, ...state.transactions],
          };
        });

        return {
          importedCount: newTxs.length,
          updatedGoalsCount,
        };
      },

      updateSettings: (newSettings: Partial<UserSettings>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        }));
      },

      updateNotificationSettings: (newNotifs: Partial<NotificationSettings>) => {
        set((state) => {
          const currentNotifs = state.settings.notifications || DEFAULT_NOTIFICATION_SETTINGS;
          const mergedNotifs = {
            ...currentNotifs,
            ...newNotifs,
          };
          return {
            settings: {
              ...state.settings,
              pacingAlertsEnabled: mergedNotifs.pacingAlerts && mergedNotifs.masterEnabled,
              notifications: mergedNotifs,
            },
          };
        });
      },

      dismissAlert: (goalId: string) => {
        set((state) => ({
          dismissedAlertGoalIds: state.dismissedAlertGoalIds.includes(goalId)
            ? state.dismissedAlertGoalIds
            : [...state.dismissedAlertGoalIds, goalId],
        }));
      },

      resetDismissedAlerts: () => {
        set({ dismissedAlertGoalIds: [] });
      },

      setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setFilterStatus: (status: FilterStatus) => set({ filterStatus: status }),
      setFilterCategory: (category: string) => set({ filterCategory: category }),
      setFilterTag: (tag: string) => set({ filterTag: tag }),
      setSorting: (sortBy: SortField, sortOrder: SortOrder) => set({ sortBy, sortOrder }),

      resetToDefaults: () => {
        set({
          goals: INITIAL_GOALS,
          transactions: INITIAL_TRANSACTIONS,
          settings: {
            currency: 'USD',
            theme: 'system',
          },
          searchQuery: '',
          filterStatus: 'all',
          filterCategory: 'all',
          filterTag: 'all',
          sortBy: 'deadline',
          sortOrder: 'asc',
        });
      },

      loadSampleData: () => {
        set({
          goals: INITIAL_GOALS,
          transactions: INITIAL_TRANSACTIONS,
          searchQuery: '',
          filterStatus: 'all',
          filterCategory: 'all',
          filterTag: 'all',
          sortBy: 'deadline',
          sortOrder: 'asc',
        });
      },

      clearAllData: () => {
        set({
          goals: [],
          transactions: [],
        });
      },
    }),
    {
      name: 'savings-goals-storage',
      version: 5,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as {
          goals?: Goal[];
          transactions?: Transaction[];
          settings?: UserSettings;
          viewMode?: ViewMode;
        };
        if (version < 5) {
          return {
            ...state,
            goals: INITIAL_GOALS,
            transactions: INITIAL_TRANSACTIONS,
          };
        }
        return state;
      },
      partialize: (state) => ({
        goals: state.goals,
        transactions: state.transactions,
        settings: state.settings,
        viewMode: state.viewMode,
      }),
    }
  )
);
