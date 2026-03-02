import { useSettings } from '../context/SettingsContext';

export default function TopBar({ onOpenSettings, fullscreenInfo }) {
    const { settings } = useSettings();

    return (
        <div className="top-bar">
            <div className="top-bar-left">
                <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="gmail-btn" title="Gmail">
                    <span className="material-icons">email</span>
                </a>
            </div>
            <div className="top-bar-right">
                {settings.fullScreen && (
                    <div className="fullscreen-info">
                        <span className="network-speed">{fullscreenInfo.network}</span>
                        <span className="battery-status">{fullscreenInfo.battery}</span>
                    </div>
                )}
                <button className="settings-btn icon-btn" onClick={onOpenSettings} title="Settings">
                    <span className="material-icons">settings</span>
                </button>
            </div>
        </div>
    );
}
