import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'auto';
export type FontType = 'inter' | 'mono' | 'serif' | 'classic';
export type FontSize = 'small' | 'medium' | 'large' | 'huge';

interface Settings {
  theme: Theme;
  vibrate: boolean;
  fontSize: FontSize;
  fontType: FontType;
}

interface SettingsContextType extends Settings {
  setTheme: (theme: Theme) => void;
  setVibrate: (vibrate: boolean) => void;
  setFontSize: (size: FontSize) => void;
  setFontType: (type: FontType) => void;
  triggerVibration: (duration?: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('livechord_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      vibrate: true,
      fontSize: 'medium',
      fontType: 'inter',
    };
  });

  useEffect(() => {
    localStorage.setItem('livechord_settings', JSON.stringify(settings));
    
    const root = window.document.documentElement;
    const body = window.document.body;
    const isDark = settings.theme === 'dark' || (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Theme
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Font Type
    const fontClasses = ['font-inter', 'font-mono', 'font-serif', 'font-classic'];
    body.classList.remove(...fontClasses);
    body.classList.add(`font-${settings.fontType}`);
  }, [settings]);

  const triggerVibration = (duration = 50) => {
    if (settings.vibrate && 'vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  const value = {
    ...settings,
    setTheme: (theme: Theme) => setSettings(s => ({ ...s, theme })),
    setVibrate: (vibrate: boolean) => setSettings(s => ({ ...s, vibrate })),
    setFontSize: (fontSize: FontSize) => setSettings(s => ({ ...s, fontSize })),
    setFontType: (fontType: FontType) => setSettings(s => ({ ...s, fontType })),
    triggerVibration,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
