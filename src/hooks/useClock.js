import { useState, useEffect } from 'react';

export function useClock() {
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        function update() {
            const now = new Date();
            let hours = now.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            const hh = String(hours).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            setTime(`${hh}:${mm} ${ampm}`);
            const opts = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
            setDate(now.toLocaleDateString(undefined, opts));
        }
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    return { time, date };
}
