import { useState, useEffect, useCallback, useRef } from 'react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import TopBar from './components/TopBar';
import Greeting from './components/Greeting';
import SearchBar from './components/SearchBar';
import RecentBar from './components/RecentBar';
import PinnedBar from './components/PinnedBar';
import ShortcutsGrid from './components/ShortcutsGrid';
import GhostBot from './components/GhostBot';
import GhostBotGame from './components/GhostBotGame';
import SettingsModal, { loadSavedWallpaper } from './components/SettingsModal';
import AddShortcutModal from './components/AddShortcutModal';
import CustomPinModal from './components/CustomPinModal';
import LiveWallpaper from './components/LiveWallpaper';
import RippleEffect from './components/RippleEffect';
import MusicVisualizer from './components/MusicVisualizer';
import { useWeather } from './hooks/useWeather';

function AppContent() {
  const { settings, updateSettings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addShortcutOpen, setAddShortcutOpen] = useState(false);
  const [customPinData, setCustomPinData] = useState(null);
  const [fullscreenInfo, setFullscreenInfo] = useState({ network: '--', battery: '--' });
  const [gameMode, setGameMode] = useState(false);
  const ghostBotRef = useRef(null);
  const weather = useWeather(settings.weatherLocation);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = `theme-${settings.theme}`;
    if (settings.wallpaperSync) document.body.classList.add('wallpaper-sync');
    if (settings.fullScreen) document.body.classList.add('fullscreen');
  }, [settings.theme, settings.wallpaperSync, settings.fullScreen]);

  // Apply opacity
  useEffect(() => {
    document.body.style.opacity = (settings.opacity / 100).toString();
  }, [settings.opacity]);

  // Apply blur
  useEffect(() => {
    document.documentElement.style.setProperty('--blur-strong', `${settings.blur}px`);
  }, [settings.blur]);

  // Apply card size
  useEffect(() => {
    const minHeight = Math.round(140 * (settings.cardSize / 100));
    document.documentElement.style.setProperty('--card-min-height', `${minHeight}px`);
  }, [settings.cardSize]);

  // Apply custom colors
  useEffect(() => {
    if (settings.customColors) {
      const root = document.documentElement;
      const c = settings.customColors;
      root.style.setProperty('--dark-teal', c.primaryBg);
      root.style.setProperty('--teal', c.secondaryBg);
      root.style.setProperty('--surface', `${c.cardBg}cc`);
      root.style.setProperty('--text', c.primaryText);
      root.style.setProperty('--text-soft', `${c.secondaryText}b3`);
      root.style.setProperty('--primary', c.accent);
      root.style.setProperty('--muted', c.secondaryText);
    }
  }, [settings.customColors]);

  // Apply ghost bot size
  useEffect(() => {
    document.documentElement.style.setProperty('--ghost-bot-size', `${settings.ghostBotSize || 30}px`);
  }, [settings.ghostBotSize]);

  // Load saved wallpaper from IndexedDB/localStorage on mount
  useEffect(() => {
    loadSavedWallpaper();
  }, []);

  // Battery & network updates for fullscreen mode
  useEffect(() => {
    if (!settings.fullScreen) return;
    // Battery
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const update = () => {
          const pct = Math.round(battery.level * 100);
          setFullscreenInfo(prev => ({ ...prev, battery: `${pct}%` }));
        };
        update();
        battery.addEventListener('chargingchange', update);
        battery.addEventListener('levelchange', update);
      }).catch(() => setFullscreenInfo(prev => ({ ...prev, battery: 'N/A' })));
    }
    // Network
    if ('connection' in navigator) {
      const conn = navigator.connection;
      if (conn) {
        const update = () => {
          const speed = conn.downlink || 0;
          setFullscreenInfo(prev => ({ ...prev, network: `${speed.toFixed(1)} Mbps` }));
        };
        update();
        conn.addEventListener('change', update);
      }
    }
  }, [settings.fullScreen]);

  // ESC to close modals
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setAddShortcutOpen(false);
        setCustomPinData(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = useCallback((url, title) => {
    try {
      const stored = localStorage.getItem('recentHistory');
      let history = stored ? JSON.parse(stored) : [];
      history = history.filter(item => item.url !== url);
      history.unshift({ url, title, timestamp: Date.now() });
      if (history.length > 10) history = history.slice(0, 10);
      localStorage.setItem('recentHistory', JSON.stringify(history));
    } catch { /* ignore */ }
  }, []);

  const handlePin = useCallback((url, title) => {
    try {
      const stored = localStorage.getItem('pinnedItems');
      const items = stored ? JSON.parse(stored) : [];
      if (items.find(item => item.url === url)) return;
      items.push({ url, title, label: title, timestamp: Date.now() });
      localStorage.setItem('pinnedItems', JSON.stringify(items));
      window.dispatchEvent(new Event('pinnedItemsUpdated'));
    } catch { /* ignore */ }
  }, []);

  return (
    <>
      <LiveWallpaper />
      <TopBar onOpenSettings={() => setSettingsOpen(true)} fullscreenInfo={fullscreenInfo} />
      <div className="app">
        <main className="container">
          <Greeting />
          <SearchBar onSearch={handleSearch} />
          <PinnedBar onEditPin={(index, item) => setCustomPinData({ index, item })} />
          <RecentBar onPin={handlePin} />
          <ShortcutsGrid onAddShortcut={() => setAddShortcutOpen(true)} />
          <MusicVisualizer />
          <footer className="help">
            Tip: Press <kbd>/</kbd> to focus the search box.
          </footer>
        </main>
        <GhostBot ref={ghostBotRef} weatherCode={weather.code} gameMode={gameMode} />
        <GhostBotGame botRef={ghostBotRef} gameMode={gameMode} setGameMode={setGameMode} />
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AddShortcutModal open={addShortcutOpen} onClose={() => setAddShortcutOpen(false)} />
      <CustomPinModal open={!!customPinData} onClose={() => setCustomPinData(null)} pinData={customPinData} />
      <RippleEffect />
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
