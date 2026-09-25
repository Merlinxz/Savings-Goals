import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

export type Theme = 'dark' | 'light' | 'system' | string;

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  forcedTheme?: Theme;
  themes?: string[];
  disableTransitionOnChange?: boolean;
}

export interface UseThemeProps {
  theme: Theme | undefined;
  setTheme: (theme: Theme | ((prevTheme: Theme) => Theme)) => void;
  forcedTheme?: Theme;
  resolvedTheme: 'dark' | 'light' | undefined;
  themes: string[];
  systemTheme: 'dark' | 'light' | undefined;
}

const ThemeContext = createContext<UseThemeProps>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: undefined,
  themes: ['light', 'dark'],
  systemTheme: undefined,
});

const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  attribute = 'class',
  enableSystem = true,
  enableColorScheme = true,
  forcedTheme,
  themes = ['light', 'dark'],
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return stored;
    } catch {
      // Ignore localStorage access errors
    }
    return defaultTheme;
  });

  const [systemTheme, setSystemTheme] = useState<'dark' | 'light' | undefined>(() =>
    enableSystem ? getSystemTheme() : undefined
  );

  const resolvedTheme = useMemo<'dark' | 'light'>(() => {
    const active = forcedTheme || theme;
    if (active === 'system') {
      return systemTheme || 'light';
    }
    return active === 'dark' ? 'dark' : 'light';
  }, [forcedTheme, theme, systemTheme]);

  const applyTheme = useCallback(
    (targetTheme: 'dark' | 'light') => {
      const root = document.documentElement;

      if (disableTransitionOnChange) {
        const css = document.createElement('style');
        css.appendChild(
          document.createTextNode(
            '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
          )
        );
        document.head.appendChild(css);
        window.getComputedStyle(document.body);
        setTimeout(() => {
          document.head.removeChild(css);
        }, 1);
      }

      if (attribute === 'class') {
        root.classList.remove('light', 'dark');
        root.classList.add(targetTheme);
      } else {
        root.setAttribute(attribute, targetTheme);
      }

      if (enableColorScheme) {
        root.style.colorScheme = targetTheme;
      }
    },
    [attribute, disableTransitionOnChange, enableColorScheme]
  );

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme, applyTheme]);

  useEffect(() => {
    if (!enableSystem) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [enableSystem]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  const setTheme = useCallback(
    (newTheme: Theme | ((prevTheme: Theme) => Theme)) => {
      setThemeState((prev) => {
        const next = typeof newTheme === 'function' ? newTheme(prev) : newTheme;
        try {
          localStorage.setItem(storageKey, next);
        } catch {
          // Ignore localStorage write errors
        }
        return next;
      });
    },
    [storageKey]
  );

  const contextValue = useMemo<UseThemeProps>(
    () => ({
      theme,
      setTheme,
      forcedTheme,
      resolvedTheme,
      themes: enableSystem ? [...themes, 'system'] : themes,
      systemTheme,
    }),
    [theme, setTheme, forcedTheme, resolvedTheme, themes, enableSystem, systemTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme(): UseThemeProps {
  return useContext(ThemeContext);
}
