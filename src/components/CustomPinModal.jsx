import { useState, useEffect } from 'react';

export default function CustomPinModal({ open, onClose, pinData }) {
    const [label, setLabel] = useState('');
    const [iconColor, setIconColor] = useState('#028090');
    const [bgColor, setBgColor] = useState('#114b5f');

    useEffect(() => {
        if (pinData) {
            setLabel(pinData.item.label || pinData.item.title || '');
            setIconColor(pinData.item.iconColor || '#028090');
            setBgColor(pinData.item.bgColor || '#114b5f');
        }
    }, [pinData]);

    if (!open || !pinData) return null;

    function handleSave() {
        try {
            const stored = localStorage.getItem('pinnedItems');
            const items = stored ? JSON.parse(stored) : [];
            if (items[pinData.index]) {
                items[pinData.index].label = label || items[pinData.index].title;
                items[pinData.index].iconColor = iconColor;
                items[pinData.index].bgColor = bgColor;
                localStorage.setItem('pinnedItems', JSON.stringify(items));
                window.dispatchEvent(new Event('pinnedItemsUpdated'));
            }
        } catch { /* ignore */ }
        onClose();
    }

    return (
        <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Customize Pin</h2>
                    <button className="modal-close" onClick={onClose}><span className="material-icons">close</span></button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Label</label>
                        <input type="text" placeholder="Custom label" value={label} onChange={e => setLabel(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Icon Color</label>
                        <input type="color" value={iconColor} onChange={e => setIconColor(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Background Color</label>
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} />
                    </div>
                    <button className="btn primary" onClick={handleSave}>Save Pin</button>
                </div>
            </div>
        </div>
    );
}
