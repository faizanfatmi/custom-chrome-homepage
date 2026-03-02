import { createContext, useContext, useState, useCallback } from 'react';

const SettingsContext = createContext(null);

const defaultSettings = {
    theme: 'dark',
    opacity: 100,
    blur: 22,
    wallpaperSync: false,
    fullScreen: false,
    searchEngine: 'google',
    shortcuts: [],
    cardSize: 100,
    ghostBotClickThrough: false,
    customColors: null,
    showRecentBar: true,
    showGreeting: true,
    pinnedItemsCompact: false,
    weatherLocation: null,
    recentBarCollapsed: false,
    liveWallpaper: 'none',
    userName: '',
    ghostBotSize: 30
};

function loadSettings() {
    try {
        const stored = localStorage.getItem('homepageSettings');
        return stored ? { ...defaultSettings, ...JSON.parse(stored) } : { ...defaultSettings };
    } catch (e) {
        console.warn('Settings corrupted, resetting to defaults', e);
        localStorage.removeItem('homepageSettings');
        return { ...defaultSettings };
    }
}

export function SettingsProvider({ children }) {
    const [settings, setSettingsState] = useState(loadSettings);

    const updateSettings = useCallback((partial) => {
        setSettingsState(prev => {
            const next = typeof partial === 'function' ? partial(prev) : { ...prev, ...partial };
            localStorage.setItem('homepageSettings', JSON.stringify(next));
            return next;
        });
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
    return ctx;
}
