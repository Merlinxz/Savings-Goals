import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/lib/theme-provider';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage }))
);
const GoalsPage = lazy(() =>
  import('@/pages/GoalsPage').then((module) => ({ default: module.GoalsPage }))
);
const GoalDetailPage = lazy(() =>
  import('@/pages/GoalDetailPage').then((module) => ({ default: module.GoalDetailPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage }))
);
const SavingsCalculatorPage = lazy(() =>
  import('@/pages/SavingsCalculatorPage').then((module) => ({ default: module.SavingsCalculatorPage }))
);
const AnalyticsPage = lazy(() =>
  import('@/pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage }))
);
const ActivityPage = lazy(() =>
  import('@/pages/ActivityPage').then((module) => ({ default: module.ActivityPage }))
);
const AchievementsPage = lazy(() =>
  import('@/pages/AchievementsPage').then((module) => ({ default: module.AchievementsPage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage }))
);

function RouteLoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'goals',
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <GoalsPage />
          </Suspense>
        ),
      },
      {
        path: 'goals/:id',
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <GoalDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: 'calculator',
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <SavingsCalculatorPage />
          </Suspense>
        ),
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <AnalyticsPage />
          </Suspense>
        ),
      },
      {
        path: 'activity',
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ActivityPage />
          </Suspense>
        ),
      },
      {
        path: 'achievements',
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <AchievementsPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="savings-theme"
    >
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
