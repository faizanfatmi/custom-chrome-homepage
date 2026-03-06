import { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

// Preinstalled Unsplash wallpapers
const preinstalledWallpapers = [
    { id: 'mountain-lake', name: 'Mountain Lake', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', credit: 'Samuel Ferrara' },
    { id: 'northern-lights', name: 'Northern Lights', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7', credit: 'Jonatan Pie' },
    { id: 'ocean-sunset', name: 'Ocean Sunset', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', credit: 'Sean Oulashin' },
    { id: 'dark-forest', name: 'Dark Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b', credit: 'Sebastian Unrau' },
    { id: 'night-sky', name: 'Night Sky', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba', credit: 'Benjamin Voros' },
    { id: 'purple-nebula', name: 'Purple Nebula', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564', credit: 'NASA' },
    { id: 'cherry-blossom', name: 'Cherry Blossom', url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951', credit: 'AJ' },
    { id: 'desert-dunes', name: 'Desert Dunes', url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35', credit: 'Keith Hardy' },
    { id: 'city-night', name: 'City Night', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390', credit: 'Pedro Lastra' },
    { id: 'misty-mountains', name: 'Misty Mountains', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', credit: 'Kalen Emsley' },
    { id: 'abstract-gradient', name: 'Abstract Gradient', url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85', credit: 'Codioful' },
    { id: 'rainy-window', name: 'Rainy Window', url: 'https://images.unsplash.com/photo-1501999635878-71cb5379c2d8', credit: 'Chandler Cruttenden' },
];

const colorPresets = {
    default: { primaryBg: '#1a2332', secondaryBg: '#3b82f6', cardBg: '#1e293b', primaryText: '#f1f5f9', secondaryText: '#94a3b8', accent: '#3b82f6', buttonPrimary: '#3b82f6', buttonSecondary: '#64748b' },
    warm: { primaryBg: '#451a03', secondaryBg: '#ea580c', cardBg: '#7c2d12', primaryText: '#fef3c7', secondaryText: '#fdba74', accent: '#f97316', buttonPrimary: '#ea580c', buttonSecondary: '#c2410c' },
    cool: { primaryBg: '#0c1929', secondaryBg: '#2563eb', cardBg: '#172554', primaryText: '#dbeafe', secondaryText: '#93c5fd', accent: '#60a5fa', buttonPrimary: '#2563eb', buttonSecondary: '#1d4ed8' },
    dark: { primaryBg: '#09090b', secondaryBg: '#18181b', cardBg: '#0f0f12', primaryText: '#fafafa', secondaryText: '#71717a', accent: '#a1a1aa', buttonPrimary: '#27272a', buttonSecondary: '#18181b' }
};

// IndexedDB helpers for wallpaper storage (no 5MB localStorage limit)
function openWallpaperDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('WallpaperDB', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('wallpapers')) db.createObjectStore('wallpapers');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function saveWallpaperToDB(blob) {
    return openWallpaperDB().then(db =>
        new Promise((resolve, reject) => {
            const tx = db.transaction('wallpapers', 'readwrite');
            tx.objectStore('wallpapers').put(blob, 'customWallpaper');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        })
    );
}

function getWallpaperFromDB() {
    return openWallpaperDB().then(db =>
        new Promise((resolve, reject) => {
            const tx = db.transaction('wallpapers', 'readonly');
            const req = tx.objectStore('wallpapers').get('customWallpaper');
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        })
    );
}

function deleteWallpaperFromDB() {
    return openWallpaperDB().then(db =>
        new Promise((resolve, reject) => {
            const tx = db.transaction('wallpapers', 'readwrite');
            tx.objectStore('wallpapers').delete('customWallpaper');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        })
    );
}

// Apply wallpaper to body
export function applyWallpaper(dataUrl) {
    if (!dataUrl) return;
    document.body.style.backgroundImage = `url('${dataUrl}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.classList.add('custom-wallpaper');
}

export function clearWallpaperFromBody() {
    document.body.style.backgroundImage = '';
    document.body.classList.remove('custom-wallpaper');
}

// Load wallpaper on app start (called from App.jsx)
export function loadSavedWallpaper() {
    // Try IndexedDB first, fallback to localStorage
    getWallpaperFromDB().then(blob => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            applyWallpaper(url);
        } else {
            const saved = localStorage.getItem('customWallpaper');
            if (saved) applyWallpaper(saved);
        }
    }).catch(() => {
        const saved = localStorage.getItem('customWallpaper');
        if (saved) applyWallpaper(saved);
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function SettingsModal({ open, onClose }) {
    const { settings, updateSettings } = useSettings();
    const [showColorPanel, setShowColorPanel] = useState(false);
    const [locationStatus, setLocationStatus] = useState(
        settings.weatherLocation ? 'Location Saved' : 'Using Default (Karachi)'
    );
    const [wallpaperPreview, setWallpaperPreview] = useState(null);
    const [wallpaperStatus, setWallpaperStatus] = useState('');
    const [wallpaperUrl, setWallpaperUrl] = useState('');
    const [videoStatus, setVideoStatus] = useState('');
    const [videoSize, setVideoSize] = useState('');
    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);

    // Load current wallpaper preview on open
    useEffect(() => {
        if (!open) return;
        getWallpaperFromDB().then(blob => {
            if (blob) {
                setWallpaperPreview(URL.createObjectURL(blob));
                setWallpaperStatus(`Saved (${formatFileSize(blob.size)})`);
            } else {
                const saved = localStorage.getItem('customWallpaper');
                if (saved && saved !== 'indexeddb') {
                    setWallpaperPreview(saved);
                    setWallpaperStatus('Saved (localStorage)');
                }
            }
        }).catch(() => { });
        // Check for saved video
        openVideoDB().then(db => {
            const tx = db.transaction('videos', 'readonly');
            const req = tx.objectStore('videos').get('customVideo');
            req.onsuccess = () => {
                if (req.result) {
                    setVideoStatus('Saved');
                    setVideoSize(formatFileSize(req.result.size));
                } else {
                    setVideoStatus('');
                    setVideoSize('');
                }
            };
        }).catch(() => { });
    }, [open]);

    if (!open) return null;

    function applyCustomColors(colors) {
        const root = document.documentElement;
        root.style.setProperty('--dark-teal', colors.primaryBg);
        root.style.setProperty('--teal', colors.secondaryBg);
        root.style.setProperty('--surface', `${colors.cardBg}cc`);
        root.style.setProperty('--text', colors.primaryText);
        root.style.setProperty('--text-soft', `${colors.secondaryText}b3`);
        root.style.setProperty('--primary', colors.accent);
        root.style.setProperty('--muted', colors.secondaryText);
    }

    function handleColorChange(key, value) {
        const colors = { ...(settings.customColors || colorPresets.default), [key]: value };
        applyCustomColors(colors);
        updateSettings({ customColors: colors });
    }

    function handlePreset(name) {
        const colors = colorPresets[name];
        applyCustomColors(colors);
        updateSettings({ customColors: name === 'default' ? null : colors });
    }

    function detectLocation() {
        setLocationStatus('Detecting...');
        if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                updateSettings({ weatherLocation: { lat: pos.coords.latitude, lon: pos.coords.longitude } });
                setLocationStatus('Location Saved');
            },
            () => { setLocationStatus('Failed to detect'); alert('Could not detect location.'); },
            { timeout: 10000 }
        );
    }

    function handleWallpaperUrl(val) {
        setWallpaperUrl(val);
        if (!val.trim()) return;
        applyWallpaper(val);
        localStorage.setItem('customWallpaper', val);
        setWallpaperPreview(val);
        setWallpaperStatus('URL applied');
    }

    function handleWallpaperUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        setWallpaperStatus(`Uploading... (${formatFileSize(file.size)})`);

        // Store as Blob in IndexedDB (no size limit unlike localStorage)
        saveWallpaperToDB(file).then(() => {
            const url = URL.createObjectURL(file);
            applyWallpaper(url);
            setWallpaperPreview(url);
            setWallpaperStatus(`Saved (${formatFileSize(file.size)})`);
            localStorage.setItem('customWallpaper', 'indexeddb'); // marker
        }).catch(err => {
            console.error('Failed to save wallpaper to IndexedDB:', err);
            // Fallback to localStorage with data URL
            const reader = new FileReader();
            reader.onload = (evt) => {
                const res = evt.target.result;
                applyWallpaper(res);
                setWallpaperPreview(res);
                try {
                    localStorage.setItem('customWallpaper', res);
                    setWallpaperStatus(`Saved (${formatFileSize(file.size)})`);
                } catch {
                    alert('Image too large for localStorage. Try a smaller image.');
                    setWallpaperStatus('Failed — image too large');
                }
            };
            reader.readAsDataURL(file);
        });

        // Reset file input so same file can be re-uploaded
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function clearWallpaper() {
        deleteWallpaperFromDB().catch(() => { });
        localStorage.removeItem('customWallpaper');
        clearWallpaperFromBody();
        setWallpaperPreview(null);
        setWallpaperStatus('');
        setWallpaperUrl('');
    }

    // --- Video upload for live wallpaper ---
    function openVideoDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('LiveWallpaperDB', 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos');
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    function handleVideoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('video/')) {
            alert('Please select a video file (MP4, WebM, OGG).');
            return;
        }
        setVideoStatus('Uploading...');
        openVideoDB().then(db => {
            const tx = db.transaction('videos', 'readwrite');
            tx.objectStore('videos').put(file, 'customVideo');
            tx.oncomplete = () => {
                setVideoStatus('Saved');
                setVideoSize(formatFileSize(file.size));
                // Trigger live wallpaper reload
                updateSettings({ liveWallpaper: 'none' });
                setTimeout(() => updateSettings({ liveWallpaper: 'custom' }), 100);
            };
            tx.onerror = () => {
                setVideoStatus('Failed');
                alert('Failed to save video. It may be too large.');
            };
        }).catch(() => {
            setVideoStatus('Failed');
            alert('IndexedDB not available.');
        });
        if (videoInputRef.current) videoInputRef.current.value = '';
    }

    function clearVideo() {
        openVideoDB().then(db => {
            const tx = db.transaction('videos', 'readwrite');
            tx.objectStore('videos').delete('customVideo');
            tx.oncomplete = () => {
                setVideoStatus('');
                setVideoSize('');
                updateSettings({ liveWallpaper: 'none' });
            };
        }).catch(() => { });
    }

    const cc = settings.customColors || colorPresets.default;

    return (
        <div className={`modal-overlay ${open ? 'active' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Settings</h2>
                    <button className="modal-close" onClick={onClose}><span className="material-icons">close</span></button>
                </div>
                <div className="modal-body">
                    {/* Theme */}
                    <div className="setting-group">
                        <label className="setting-label">Theme</label>
                        <div className="theme-options">
                            {['dark', 'light', 'colorful'].map(t => (
                                <button key={t} className={`theme-btn ${settings.theme === t ? 'active' : ''}`}
                                    onClick={() => updateSettings({ theme: t })}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                            ))}
                        </div>
                    </div>

                    {/* Opacity */}
                    <div className="setting-group">
                        <label className="setting-label">Background Opacity</label>
                        <div className="slider-container">
                            <input type="range" className="slider" min="0" max="100" value={settings.opacity}
                                onChange={e => { updateSettings({ opacity: +e.target.value }); document.body.style.opacity = (+e.target.value / 100).toString(); }} />
                            <span className="slider-value">{settings.opacity}%</span>
                        </div>
                    </div>

                    {/* Blur */}
                    <div className="setting-group">
                        <label className="setting-label">Blur Intensity</label>
                        <div className="slider-container">
                            <input type="range" className="slider" min="0" max="50" value={settings.blur}
                                onChange={e => { updateSettings({ blur: +e.target.value }); document.documentElement.style.setProperty('--blur-strong', `${e.target.value}px`); }} />
                            <span className="slider-value">{settings.blur}px</span>
                        </div>
                    </div>

                    {/* Card Size */}
                    <div className="setting-group">
                        <label className="setting-label">Card Size</label>
                        <div className="slider-container">
                            <input type="range" className="slider" min="80" max="160" value={settings.cardSize}
                                onChange={e => { const v = +e.target.value; updateSettings({ cardSize: v }); document.documentElement.style.setProperty('--card-min-height', `${Math.round(140 * v / 100)}px`); }} />
                            <span className="slider-value">{settings.cardSize}%</span>
                        </div>
                    </div>

                    {/* Color Customization */}
                    <div className="setting-group">
                        <label className="setting-label">Customize Colors</label>
                        <button className="btn secondary" onClick={() => setShowColorPanel(!showColorPanel)}>
                            {showColorPanel ? 'Hide Color Options' : 'Show Color Options'}
                        </button>
                    </div>
                    {showColorPanel && (
                        <div className="setting-group color-customization-panel">
                            <div className="color-grid">
                                {[['primaryBg', 'Primary Background'], ['secondaryBg', 'Secondary Background'], ['cardBg', 'Card Background'],
                                ['primaryText', 'Primary Text'], ['secondaryText', 'Secondary Text'], ['accent', 'Accent/Border'],
                                ['buttonPrimary', 'Button Primary'], ['buttonSecondary', 'Button Secondary']].map(([key, label]) => (
                                    <div key={key} className="color-picker-item">
                                        <label>{label}</label>
                                        <input type="color" value={cc[key] || '#000000'} onChange={e => handleColorChange(key, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                            <div className="color-presets">
                                {Object.keys(colorPresets).map(p => (
                                    <button key={p} className="preset-btn" onClick={() => handlePreset(p)}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Custom Wallpaper */}
                    <div className="setting-group">
                        <label className="setting-label">
                            <span className="material-icons" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>wallpaper</span>
                            Custom Wallpaper
                        </label>

                        {/* Preview */}
                        {wallpaperPreview && (
                            <div className="wallpaper-preview">
                                <img src={wallpaperPreview} alt="Current wallpaper" />
                                <span className="wallpaper-status">{wallpaperStatus}</span>
                            </div>
                        )}

                        {/* Preinstalled Wallpapers */}
                        <div className="preinstalled-wallpapers">
                            <label className="setting-sublabel">Choose a Wallpaper</label>
                            <div className="wallpaper-gallery">
                                {preinstalledWallpapers.map(wp => (
                                    <button key={wp.id} className="wallpaper-gallery-item"
                                        title={`${wp.name} — by ${wp.credit}`}
                                        onClick={() => {
                                            const fullUrl = `${wp.url}?w=1920&q=80&auto=format&fit=crop`;
                                            applyWallpaper(fullUrl);
                                            localStorage.setItem('customWallpaper', fullUrl);
                                            setWallpaperPreview(fullUrl);
                                            setWallpaperStatus(`${wp.name}`);
                                        }}>
                                        <img src={`${wp.url}?w=400&q=60&auto=format&fit=crop`} alt={wp.name} loading="lazy" />
                                        <span className="wallpaper-gallery-name">{wp.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* URL Input */}
                        <div className="wallpaper-controls">
                            <input type="text" placeholder="Paste image URL..." value={wallpaperUrl}
                                className="wallpaper-url-input"
                                onChange={e => setWallpaperUrl(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleWallpaperUrl(wallpaperUrl); }} />
                            <button className="btn secondary wallpaper-url-apply" onClick={() => handleWallpaperUrl(wallpaperUrl)} disabled={!wallpaperUrl.trim()}>
                                Apply
                            </button>
                        </div>

                        {/* Upload & Clear */}
                        <div className="wallpaper-actions">
                            <label className="btn secondary wallpaper-upload-btn">
                                <span className="material-icons" style={{ fontSize: '16px', marginRight: '6px' }}>upload</span>
                                Upload Image
                                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" style={{ display: 'none' }} onChange={handleWallpaperUpload} />
                            </label>
                            <button className="btn wallpaper-clear-btn" onClick={clearWallpaper} disabled={!wallpaperPreview}>
                                <span className="material-icons" style={{ fontSize: '16px', marginRight: '4px' }}>delete</span>
                                Clear
                            </button>
                        </div>

                        {!wallpaperPreview && (
                            <div className="wallpaper-hint">Supports PNG, JPG, WebP, GIF, SVG. Stored locally in your browser.</div>
                        )}
                    </div>

                    {/* Live Wallpaper */}
                    <div className="setting-group">
                        <label className="setting-label">
                            <span className="material-icons" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>play_circle</span>
                            Live Wallpaper
                        </label>
                        <select className="search-engine-select" style={{ width: '100%' }} value={settings.liveWallpaper}
                            onChange={e => updateSettings({ liveWallpaper: e.target.value })}>
                            <option value="none">None</option>
                            <option value="particles">✨ Particles</option>
                            <option value="gradient-wave">🌊 Gradient Wave</option>
                            <option value="starfield">🌌 Starfield</option>
                            <option value="custom">🎬 Custom Video</option>
                        </select>
                    </div>

                    {/* Custom Video Upload — shown when 'custom' is selected */}
                    {settings.liveWallpaper === 'custom' && (
                        <div className="setting-group">
                            <label className="setting-label">
                                <span className="material-icons" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }}>videocam</span>
                                Custom Video File
                            </label>

                            {videoStatus && (
                                <div className="video-status-bar">
                                    <span className="material-icons" style={{ fontSize: '18px', color: 'var(--success)' }}>check_circle</span>
                                    <span>Video {videoStatus} ({videoSize})</span>
                                </div>
                            )}

                            <div className="wallpaper-actions">
                                <label className="btn secondary wallpaper-upload-btn">
                                    <span className="material-icons" style={{ fontSize: '16px', marginRight: '6px' }}>upload</span>
                                    {videoStatus ? 'Replace Video' : 'Upload Video'}
                                    <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg" style={{ display: 'none' }}
                                        onChange={handleVideoUpload} />
                                </label>
                                <button className="btn wallpaper-clear-btn" onClick={clearVideo} disabled={!videoStatus}>
                                    <span className="material-icons" style={{ fontSize: '16px', marginRight: '4px' }}>delete</span>
                                    Clear
                                </button>
                            </div>

                            <div className="wallpaper-hint">Supports MP4, WebM, OGG. Stored locally via IndexedDB.</div>
                        </div>
                    )}

                    {/* Toggles */}
                    {[
                        ['wallpaperSync', 'Sync with Wallpaper (Overrides Custom)'],
                        ['fullScreen', 'Full Screen Mode'],
                        ['gameEnabled', 'Game'],
                        ['ghostBotClickThrough', 'Ghost Bot Click Through'],
                        ['showGreeting', 'Show Greeting'],
                        ['showRecentBar', 'Show Recent Bar'],
                        ['pinnedItemsCompact', 'Compact Pinned Items']
                    ].map(([key, label]) => (
                        <div key={key} className="setting-group">
                            <label className="setting-label toggle-label">
                                <span>{label}</span>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={settings[key] ?? false} onChange={e => updateSettings({ [key]: e.target.checked })} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </label>
                        </div>
                    ))}

                    {/* Ghost Bot Size */}
                    <div className="setting-group">
                        <label className="setting-label">Ghost Bot Size: {settings.ghostBotSize || 30}px</label>
                        <input type="range" className="setting-slider" min="20" max="80" value={settings.ghostBotSize || 30}
                            onChange={e => { updateSettings({ ghostBotSize: +e.target.value }); document.documentElement.style.setProperty('--ghost-bot-size', `${e.target.value}px`); }} />
                    </div>

                    {/* Username */}
                    <div className="setting-group">
                        <label className="setting-label">Your Name</label>
                        <input type="text" placeholder="Enter your name" value={settings.userName || ''}
                            onChange={e => updateSettings({ userName: e.target.value.trim() })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', outline: 'none' }} />
                    </div>

                    {/* Weather Location */}
                    <div className="setting-group">
                        <label className="setting-label">Weather Location</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button className="btn secondary" style={{ flex: 1 }} onClick={detectLocation}>
                                <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}>my_location</span>
                                Detect My Location
                            </button>
                            <span style={{ fontSize: '12px', color: settings.weatherLocation ? 'var(--success)' : 'var(--text-soft)' }}>{locationStatus}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
