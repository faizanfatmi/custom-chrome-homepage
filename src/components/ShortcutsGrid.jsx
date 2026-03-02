import { useSettings } from '../context/SettingsContext';
import ClockCard from './ClockCard';
import WeatherCard from './WeatherCard';

export default function ShortcutsGrid({ onAddShortcut }) {
    const { settings, updateSettings } = useSettings();
    const shortcuts = settings.shortcuts || [];

    function removeShortcut(index) {
        const next = [...shortcuts];
        next.splice(index, 1);
        updateSettings({ shortcuts: next });
    }

    return (
        <section className="grid">
            <ClockCard />
            <WeatherCard />

            {shortcuts.map((shortcut, index) => (
                <div key={shortcut.url + index} className="card shortcut-card">
                    <button className="shortcut-remove" onClick={() => removeShortcut(index)} title="Remove">×</button>
                    <a href={shortcut.url} className="shortcut-link" target="_blank" rel="noopener noreferrer">
                        <img
                            src={shortcut.icon || `https://www.google.com/s2/favicons?domain=${new URL(shortcut.url).hostname}&sz=64`}
                            alt={shortcut.name}
                            className="shortcut-icon"
                            onError={e => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23fff%27 d=%27M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z%27/%3E%3C/svg%3E'; }}
                        />
                        <span className="shortcut-name">{shortcut.name}</span>
                    </a>
                </div>
            ))}

            <div className="card add-shortcut-card" onClick={onAddShortcut}>
                <div className="card-body add-shortcut-body">
                    <span className="material-icons add-icon">add</span>
                    <span className="add-text">Add Shortcut</span>
                </div>
            </div>
        </section>
    );
}
