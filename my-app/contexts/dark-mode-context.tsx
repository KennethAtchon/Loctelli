'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface DarkModeContextType {
  isDark: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode preference is stored in localStorage
    const stored = localStorage.getItem('admin-dark-mode');
    if (stored) {
      const isDarkMode = JSON.parse(stored);
      setIsDark(isDarkMode);
      updateDocumentClass(isDarkMode);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      updateDocumentClass(prefersDark);
    }
  }, []);

  const updateDocumentClass = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    updateDocumentClass(newDarkMode);
    localStorage.setItem('admin-dark-mode', JSON.stringify(newDarkMode));
  };

  const setDarkMode = (dark: boolean) => {
    setIsDark(dark);
    updateDocumentClass(dark);
    localStorage.setItem('admin-dark-mode', JSON.stringify(dark));
  };

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}