import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

export default function Greeting() {
    const { settings } = useSettings();
    const [greeting, setGreeting] = useState('');
    const [emoji, setEmoji] = useState('🌤️');

    useEffect(() => {
        function update() {
            const now = new Date();
            const hour = now.getHours();
            const month = now.getMonth();
            const day = now.getDate();
            const name = settings.userName ? `, ${settings.userName}` : '';

            let g, e;
            if (month === 0 && day === 1) { g = `Happy New Year${name}!`; e = '🎉'; }
            else if (month === 11 && day === 25) { g = `Merry Christmas${name}!`; e = '🎄'; }
            else if (month === 9 && day === 31) { g = `Happy Halloween${name}!`; e = '🎃'; }
            else if (hour >= 5 && hour < 12) { g = `Good morning${name}`; e = '🌤️'; }
            else if (hour >= 12 && hour < 17) { g = `Good afternoon${name}`; e = '☀️'; }
            else if (hour >= 17 && hour < 21) { g = `Good evening${name}`; e = '🌅'; }
            else { g = `Good night${name}`; e = '🌙'; }

            setGreeting(g);
            setEmoji(e);
        }
        update();
        const id = setInterval(update, 60000);
        return () => clearInterval(id);
    }, [settings.userName]);

    if (settings.showGreeting === false) return null;

    return (
        <div className="greeting-section">
            <span className="greeting-emoji">{emoji}</span>
            <span className="greeting-text">{greeting}</span>
        </div>
    );
}
