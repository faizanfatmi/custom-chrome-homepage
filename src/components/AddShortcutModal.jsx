import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function AddShortcutModal({ open, onClose }) {
    const { settings, updateSettings } = useSettings();
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [icon, setIcon] = useState('');

    if (!open) return null;

    function handleSave() {
        if (!name.trim() || !url.trim()) { alert('Please provide name and URL'); return; }
        let finalUrl = url.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) finalUrl = 'https://' + finalUrl;
        const shortcuts = [...(settings.shortcuts || []), { name: name.trim(), url: finalUrl, icon: icon.trim() }];
        updateSettings({ shortcuts });
        setName(''); setUrl(''); setIcon('');
        onClose();
    }

    return (
        <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Add Website Shortcut</h2>
                    <button className="modal-close" onClick={onClose}><span className="material-icons">close</span></button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Website Name</label>
                        <input type="text" placeholder="e.g., YouTube" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Website URL</label>
                        <input type="url" placeholder="https://www.youtube.com" value={url} onChange={e => setUrl(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Icon URL (optional)</label>
                        <input type="url" placeholder="https://www.youtube.com/favicon.ico" value={icon} onChange={e => setIcon(e.target.value)} />
                    </div>
                    <button className="btn primary" onClick={handleSave}>Add Shortcut</button>
                </div>
            </div>
        </div>
    );
}
