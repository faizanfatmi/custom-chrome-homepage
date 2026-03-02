import { useSettings } from '../context/SettingsContext';
import { useWeather } from '../hooks/useWeather';

export default function WeatherCard() {
    const { settings } = useSettings();
    const weather = useWeather(settings.weatherLocation);

    return (
        <div className="card weather-card">
            <div className="card-title">Weather</div>
            <div className="card-body">
                <div className="weather-content">
                    <div className="weather-icon">{weather.icon}</div>
                    <div className="weather-info">
                        <div className="temp">{weather.temp}</div>
                        <div className="cond">{weather.cond}</div>
                        <div className="loc">{weather.loc}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function useWeatherCode() {
    const { settings } = useSettings();
    const weather = useWeather(settings.weatherLocation);
    return weather.code;
}
