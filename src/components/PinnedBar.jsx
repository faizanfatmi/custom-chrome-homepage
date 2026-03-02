import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function PinnedBar({ onEditPin }) {
    const { settings } = useSettings();
    const [pinnedItems, setPinnedItems] = useState([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('pinnedItems');
            if (stored) setPinnedItems(JSON.parse(stored));
        } catch { /* ignore */ }
    }, []);

    // Listen for external changes
    useEffect(() => {
        const handler = () => {
            try {
                const stored = localStorage.getItem('pinnedItems');
                if (stored) setPinnedItems(JSON.parse(stored));
                else setPinnedItems([]);
            } catch { /* ignore */ }
        };
        window.addEventListener('pinnedItemsUpdated', handler);
        return () => window.removeEventListener('pinnedItemsUpdated', handler);
    }, []);

    const unpin = useCallback((index) => {
        setPinnedItems(prev => {
            const next = [...prev];
            next.splice(index, 1);
            localStorage.setItem('pinnedItems', JSON.stringify(next));
            return next;
        });
    }, []);

    const handleDrop = useCallback((fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;
        setPinnedItems(prev => {
            const next = [...prev];
            const [item] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, item);
            localStorage.setItem('pinnedItems', JSON.stringify(next));
            return next;
        });
    }, []);

    if (pinnedItems.length === 0) return null;

    return (
        <section className="pinned-bar">
            <div className="pinned-bar-header">
                <span className="pinned-title">Pinned</span>
            </div>
            <div className={`pinned-items ${settings.pinnedItemsCompact ? 'compact' : ''}`}>
                {pinnedItems.map((item, index) => (
                    <div key={item.url + index} className="pinned-item" draggable
                        style={item.bgColor ? { backgroundColor: item.bgColor } : {}}
                        onClick={() => window.location.href = item.url}
                        onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', index); e.currentTarget.classList.add('dragging'); }}
                        onDragEnd={e => e.currentTarget.classList.remove('dragging')}
                        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDrop={e => { e.preventDefault(); handleDrop(parseInt(e.dataTransfer.getData('text/plain')), index); }}>
                        <div className="pinned-item-icon" style={item.iconColor ? { color: item.iconColor } : {}}>
                            <span className="material-icons">push_pin</span>
                        </div>
                        <span>{item.label || item.title}</span>
                        <div className="pinned-item-actions">
                            <button className="pinned-item-btn edit" onClick={e => { e.stopPropagation(); onEditPin?.(index, item); }} title="Edit">
                                <span className="material-icons" style={{ fontSize: '14px' }}>edit</span>
                            </button>
                            <button className="pinned-item-btn unpin" onClick={e => { e.stopPropagation(); unpin(index); }} title="Unpin">
                                <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
