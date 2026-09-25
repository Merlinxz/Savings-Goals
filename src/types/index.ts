import { z } from 'zod';

export const goalCategorySchema = z.enum([
  'Emergency Fund',
  'Travel & Vacation',
  'Vehicle',
  'Home & Living',
  'Technology',
  'Education',
  'Retirement & Future',
  'Celebration',
  'Health & Fitness',
  'Other',
]);

export type GoalCategory = z.infer<typeof goalCategorySchema>;

export const transactionTypeSchema = z.enum(['deposit', 'withdrawal']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const transactionSchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1),
  type: transactionTypeSchema,
  amount: z.number().positive('Amount must be greater than 0'),
  note: z.string().max(200).optional(),
  date: z.string(),
  createdAt: z.string(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const goalStatusSchema = z.enum(['on_track', 'behind', 'urgent', 'completed']);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

export const recurringFrequencySchema = z.enum(['weekly', 'monthly']);
export type RecurringFrequency = z.infer<typeof recurringFrequencySchema>;

export const recurringContributionSchema = z.object({
  enabled: z.boolean(),
  frequency: recurringFrequencySchema,
  amount: z.number().min(0, 'Contribution amount must be non-negative'),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0 = Sunday, 1 = Monday, ...
  dayOfMonth: z.number().min(1).max(31).optional(), // 1 - 31
  startDate: z.string().optional(),
});
export type RecurringContribution = z.infer<typeof recurringContributionSchema>;

export const timeHorizonBucketSchema = z.enum(['auto', 'short', 'medium', 'long']);
export type TimeHorizonBucket = z.infer<typeof timeHorizonBucketSchema>;
export type ResolvedTimeHorizon = 'short' | 'medium' | 'long';

export const goalFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters'),
  targetAmount: z.number().min(1, 'Target amount must be at least 1'),
  currentAmount: z.number().min(0, 'Initial amount cannot be negative'),
  deadline: z.string().min(1, 'Deadline date is required'),
  category: goalCategorySchema,
  icon: z.string().min(1, 'Icon selection is required'),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Valid hex color required'),
  notes: z.string().max(500).optional(),
  imageUrl: z.string().optional(),
  recurringContribution: recurringContributionSchema.optional(),
  tags: z.array(z.string()).default([]).optional(),
  currency: z.string().optional(),
  timeHorizonBucket: timeHorizonBucketSchema.default('auto').optional(),
});

export type GoalFormData = z.infer<typeof goalFormSchema>;

export interface Goal extends GoalFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  currency?: CurrencyCode;
  timeHorizonBucket?: TimeHorizonBucket;
}

export type CurrencyCode =
  | 'THB'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CNY'
  | 'SGD'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'HKD'
  | 'NZD'
  | 'KRW'
  | 'INR'
  | 'TWD'
  | 'MYR'
  | 'IDR'
  | 'PHP'
  | 'VND'
  | 'BRL'
  | 'MXN'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'PLN'
  | 'TRY'
  | 'ZAR'
  | 'AED'
  | 'SAR'
  | 'QAR'
  | 'KWD'
  | 'BHD'
  | 'OMR'
  | 'ILS'
  | 'CZK'
  | 'HUF'
  | 'RON'
  | 'BGN'
  | 'CLP'
  | 'COP'
  | 'ARS'
  | 'PEN'
  | 'EGP'
  | 'NGN'
  | 'KES'
  | 'PKR'
  | 'BDT'
  | 'LKR'
  | 'KZT'
  | 'UAH'
  | 'MAD'
  | 'CRC'
  | 'UYU'
  | 'ISK'
  | 'RSD'
  | 'GHS'
  | (string & {});

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  decimalDigits: number;
  region?: string;
}

export interface NotificationSettings {
  masterEnabled: boolean;
  pacingAlerts: boolean;
  recurringReminders: boolean;
  milestoneAlerts: boolean;
  inactivityReminders: boolean;
  weeklyDigest: boolean;
  showNavbarBadge: boolean;
  showDashboardBanner: boolean;
  soundEnabled: boolean;
  browserNotifications: boolean;
}

export interface UserSettings {
  currency: CurrencyCode;
  theme: 'light' | 'dark' | 'system';
  pacingAlertsEnabled?: boolean;
  notifications?: Partial<NotificationSettings>;
  hasCompletedWelcome?: boolean;
}

export type SortField = 'deadline' | 'progress' | 'amount' | 'name';
export type SortOrder = 'asc' | 'desc';
export type FilterStatus = 'all' | 'on_track' | 'urgent' | 'behind' | 'completed';
export type ViewMode = 'grid' | 'list' | 'buckets';
