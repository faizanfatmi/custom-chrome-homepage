import { useState, useEffect, useCallback } from 'react';

function weatherCodeToIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 99) return '🌩️';
    return '☁️';
}

export function isRainyWeather(code) {
    if (code == null) return false;
    return (code >= 51 && code <= 67) || (code >= 80 && code <= 99);
}

export function useWeather(weatherLocation) {
    const [weather, setWeather] = useState({
        temp: '--°C',
        cond: 'Loading…',
        icon: '☁️',
        loc: '',
        code: null
    });

    const fetchWeather = useCallback(async (lat, lon) => {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Weather fetch failed');
            const data = await res.json();
            const cw = data.current_weather;
            if (!cw) throw new Error('No current weather');
            setWeather({
                temp: `${Math.round(cw.temperature)}°C`,
                cond: `Winds ${Math.round(cw.windspeed)} km/h`,
                icon: weatherCodeToIcon(cw.weathercode),
                loc: `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`,
                code: cw.weathercode
            });
        } catch (err) {
            setWeather({
                temp: '--°C',
                cond: 'Unable to load weather',
                icon: '❓',
                loc: '',
                code: null
            });
            console.warn('Weather error', err);
        }
    }, []);

    useEffect(() => {
        const lat = weatherLocation?.lat ?? 24.86;
        const lon = weatherLocation?.lon ?? 67.01;
        fetchWeather(lat, lon);
        const id = setInterval(() => fetchWeather(lat, lon), 300000);
        return () => clearInterval(id);
    }, [weatherLocation, fetchWeather]);

    return weather;
}
