import React from 'react';
import {
  Target,
  Plane,
  Car,
  Home,
  Laptop,
  GraduationCap,
  Heart,
  ShieldCheck,
  PiggyBank,
  Gift,
  Sparkles,
  Umbrella,
  ShoppingBag,
  Landmark,
  Briefcase,
  Dumbbell,
  Compass,
  Palmtree,
  Smartphone,
  Coffee,
  Coins,
  Wallet,
  Building,
  Watch,
  LucideIcon,
} from 'lucide-react';

export interface IconOption {
  name: string;
  label: string;
  icon: LucideIcon;
}

export const GOAL_ICONS: IconOption[] = [
  { name: 'Target', label: 'General Goal', icon: Target },
  { name: 'PiggyBank', label: 'Savings Reserve', icon: PiggyBank },
  { name: 'ShieldCheck', label: 'Emergency Fund', icon: ShieldCheck },
  { name: 'Plane', label: 'Travel & Vacation', icon: Plane },
  { name: 'Car', label: 'Vehicle & Transport', icon: Car },
  { name: 'Home', label: 'Home & Housing', icon: Home },
  { name: 'Laptop', label: 'Tech & Electronics', icon: Laptop },
  { name: 'GraduationCap', label: 'Education & Learning', icon: GraduationCap },
  { name: 'Heart', label: 'Health & Wellness', icon: Heart },
  { name: 'Gift', label: 'Gift & Celebration', icon: Gift },
  { name: 'Umbrella', label: 'Insurance & Safety', icon: Umbrella },
  { name: 'ShoppingBag', label: 'Personal Purchases', icon: ShoppingBag },
  { name: 'Landmark', label: 'Investments', icon: Landmark },
  { name: 'Briefcase', label: 'Career & Business', icon: Briefcase },
  { name: 'Dumbbell', label: 'Fitness & Sports', icon: Dumbbell },
  { name: 'Palmtree', label: 'Holiday & Retreat', icon: Palmtree },
  { name: 'Smartphone', label: 'Mobile Devices', icon: Smartphone },
  { name: 'Watch', label: 'Luxury & Accessories', icon: Watch },
  { name: 'Coins', label: 'Cash Buffer', icon: Coins },
  { name: 'Wallet', label: 'Personal Spending', icon: Wallet },
  { name: 'Building', label: 'Real Estate', icon: Building },
  { name: 'Sparkles', label: 'Special Occasion', icon: Sparkles },
  { name: 'Compass', label: 'Adventure', icon: Compass },
  { name: 'Coffee', label: 'Lifestyle', icon: Coffee },
];

export const GOAL_COLORS = [
  { hex: '#3b82f6', label: 'Blue' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#8b5cf6', label: 'Purple' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#6366f1', label: 'Indigo' },
  { hex: '#14b8a6', label: 'Teal' },
  { hex: '#64748b', label: 'Slate' },
];

const ICON_MAP: Record<string, LucideIcon> = {
  Target,
  Plane,
  Car,
  Home,
  Laptop,
  GraduationCap,
  Heart,
  ShieldCheck,
  PiggyBank,
  Gift,
  Sparkles,
  Umbrella,
  ShoppingBag,
  Landmark,
  Briefcase,
  Dumbbell,
  Compass,
  Palmtree,
  Smartphone,
  Coffee,
  Coins,
  Wallet,
  Building,
  Watch,
};

export function GoalIcon({ name, className = 'h-5 w-5', style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const IconComponent = ICON_MAP[name] || Target;
  return <IconComponent className={className} style={style} />;
}
