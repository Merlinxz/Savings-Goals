import { GoalCategory } from '@/types';
import {
  ShieldCheck,
  Plane,
  Car,
  Home,
  Laptop,
  GraduationCap,
  Landmark,
  Gift,
  Heart,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export interface CategoryMetadata {
  name: GoalCategory;
  label: string;
  icon: LucideIcon;
  iconName: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  suggestedTags: string[];
}

export const CATEGORY_CONFIG: Record<GoalCategory, CategoryMetadata> = {
  'Emergency Fund': {
    name: 'Emergency Fund',
    label: 'Emergency Fund',
    icon: ShieldCheck,
    iconName: 'ShieldCheck',
    color: '#10b981', // Emerald
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    description: 'Rainy day cash buffers, health reserves, and unexpected expense protection',
    suggestedTags: ['Emergency', 'Essential', 'Liquid Reserve', 'High-Priority'],
  },
  'Travel & Vacation': {
    name: 'Travel & Vacation',
    label: 'Travel & Vacation',
    icon: Plane,
    iconName: 'Plane',
    color: '#3b82f6', // Blue
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    badgeText: 'text-blue-700 dark:text-blue-300',
    description: 'Flights, accommodations, adventures, and seasonal holiday getaways',
    suggestedTags: ['Travel', 'Vacation', 'Adventure', 'Holiday'],
  },
  'Vehicle': {
    name: 'Vehicle',
    label: 'Vehicle',
    icon: Car,
    iconName: 'Car',
    color: '#8b5cf6', // Violet
    badgeBg: 'bg-violet-500/10 dark:bg-violet-500/20',
    badgeText: 'text-violet-700 dark:text-violet-300',
    description: 'Down payments, repairs, insurance, modifications, and vehicle upgrades',
    suggestedTags: ['Vehicle', 'Car', 'Transport', 'Medium-Term'],
  },
  'Home & Living': {
    name: 'Home & Living',
    label: 'Home & Living',
    icon: Home,
    iconName: 'Home',
    color: '#f59e0b', // Amber
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeText: 'text-amber-700 dark:text-amber-300',
    description: 'Mortgage down payment, renovation, furniture, and living improvements',
    suggestedTags: ['Home', 'Living', 'Renovation', 'Long-Term'],
  },
  'Technology': {
    name: 'Technology',
    label: 'Technology',
    icon: Laptop,
    iconName: 'Laptop',
    color: '#06b6d4', // Cyan
    badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    description: 'Workstations, creative gear, laptops, hardware, and mobile gadgets',
    suggestedTags: ['Technology', 'Gadgets', 'Workstation', 'Hardware'],
  },
  'Education': {
    name: 'Education',
    label: 'Education',
    icon: GraduationCap,
    iconName: 'GraduationCap',
    color: '#ec4899', // Pink
    badgeBg: 'bg-pink-500/10 dark:bg-pink-500/20',
    badgeText: 'text-pink-700 dark:text-pink-300',
    description: 'Certifications, university tuition, courses, books, and skill mastery',
    suggestedTags: ['Education', 'Career', 'Learning', 'Skills'],
  },
  'Retirement & Future': {
    name: 'Retirement & Future',
    label: 'Retirement & Future',
    icon: Landmark,
    iconName: 'Landmark',
    color: '#6366f1', // Indigo
    badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    description: 'Index investing, retirement plans, long-term wealth, and financial freedom',
    suggestedTags: ['Investment', 'Retirement', 'Future', 'Long-Term'],
  },
  'Celebration': {
    name: 'Celebration',
    label: 'Celebration',
    icon: Gift,
    iconName: 'Gift',
    color: '#e11d48', // Rose
    badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    badgeText: 'text-rose-700 dark:text-rose-300',
    description: 'Weddings, anniversaries, birthdays, family events, and holiday gifts',
    suggestedTags: ['Celebration', 'Family', 'Gift', 'Special Event'],
  },
  'Health & Fitness': {
    name: 'Health & Fitness',
    label: 'Health & Fitness',
    icon: Heart,
    iconName: 'Heart',
    color: '#14b8a6', // Teal
    badgeBg: 'bg-teal-500/10 dark:bg-teal-500/20',
    badgeText: 'text-teal-700 dark:text-teal-300',
    description: 'Wellness retreats, medical reserves, sports equipment, and healthy lifestyle',
    suggestedTags: ['Health', 'Wellness', 'Fitness', 'Lifestyle'],
  },
  'Other': {
    name: 'Other',
    label: 'Other',
    icon: Sparkles,
    iconName: 'Sparkles',
    color: '#64748b', // Slate
    badgeBg: 'bg-slate-500/10 dark:bg-slate-500/20',
    badgeText: 'text-slate-700 dark:text-slate-300',
    description: 'Special projects, personal hobbies, collectors items, and bespoke targets',
    suggestedTags: ['Personal', 'Hobby', 'Custom', 'Other'],
  },
};

export const POPULAR_TAGS = [
  'Emergency',
  'Travel',
  'Education',
  'High-Priority',
  'Essential',
  'Technology',
  'Home',
  'Vehicle',
  'Investment',
  'Long-Term',
  'Short-Term',
  'Health',
  'Family',
  'Lifestyle',
  'Celebration',
];
