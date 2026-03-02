import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function RecentBar({ onPin }) {
    const { settings, updateSettings } = useSettings();
    const [recentHistory, setRecentHistory] = useState([]);
    const [collapsed, setCollapsed] = useState(settings.recentBarCollapsed);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('recentHistory');
            if (stored) setRecentHistory(JSON.parse(stored));
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'recentHistory') {
                try { setRecentHistory(JSON.parse(e.newValue) || []); } catch { /* ignore */ }
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    const removeItem = useCallback((index) => {
        setRecentHistory(prev => {
            const next = [...prev];
            next.splice(index, 1);
            localStorage.setItem('recentHistory', JSON.stringify(next));
            return next;
        });
    }, []);

    const clearAll = useCallback(() => {
        setRecentHistory([]);
        localStorage.setItem('recentHistory', JSON.stringify([]));
    }, []);

    const toggleCollapse = useCallback(() => {
        setCollapsed(prev => {
            const next = !prev;
            updateSettings({ recentBarCollapsed: next });
            return next;
        });
    }, [updateSettings]);

    const pinItem = useCallback((item) => {
        onPin?.(item.url, item.title);
    }, [onPin]);

    if (!settings.showRecentBar) return null;

    return (
        <section className={`recent-bar ${collapsed ? 'collapsed' : ''}`}>
            <div className="recent-bar-header">
                <div className="recent-header-left">
                    <button className="recent-collapse-btn" onClick={toggleCollapse} title="Collapse">
                        <span className="material-icons">expand_more</span>
                    </button>
                    <span className="recent-title">Recent &amp; Pinned</span>
                    <span className="recent-count">{recentHistory.length}</span>
                </div>
                <button className="recent-clear-btn" onClick={clearAll} title="Clear All">
                    <span className="material-icons" style={{ fontSize: '16px' }}>delete_sweep</span>
                    <span>Clear All</span>
                </button>
            </div>
            <div className="recent-items-wrapper">
                <div className="recent-items">
                    {recentHistory.length === 0 ? (
                        <div style={{ color: 'var(--text-soft)', fontSize: '13px' }}>No recent items</div>
                    ) : (
                        recentHistory.map((item, index) => (
                            <a key={item.url + index} href={item.url} className="recent-item" target="_blank" rel="noopener noreferrer">
                                <button className="recent-item-pin" title="Pin" onClick={(e) => { e.preventDefault(); e.stopPropagation(); pinItem(item); }}>
                                    <span className="material-icons" style={{ fontSize: '14px' }}>push_pin</span>
                                </button>
                                <span className="material-icons" style={{ fontSize: '18px' }}>history</span>
                                <span>{item.title}</span>
                                <button className="recent-item-remove" title="Remove" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(index); }}>×</button>
                            </a>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
