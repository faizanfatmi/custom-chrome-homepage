import { useState, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

const keywordSites = {
    youtube: 'https://www.youtube.com', chatgpt: 'https://chat.openai.com',
    google: 'https://www.google.com', duckduckgo: 'https://duckduckgo.com',
    bing: 'https://www.bing.com', github: 'https://github.com',
    twitter: 'https://twitter.com', facebook: 'https://www.facebook.com',
    instagram: 'https://www.instagram.com', linkedin: 'https://www.linkedin.com',
    reddit: 'https://www.reddit.com', amazon: 'https://www.amazon.com',
    netflix: 'https://www.netflix.com', spotify: 'https://open.spotify.com',
    gmail: 'https://mail.google.com', drive: 'https://drive.google.com',
    docs: 'https://docs.google.com', maps: 'https://maps.google.com'
};

const siteSearchEngines = {
    youtube: q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    github: q => `https://github.com/search?q=${encodeURIComponent(q)}`,
    reddit: q => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}`,
    amazon: q => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
    twitter: q => `https://twitter.com/search?q=${encodeURIComponent(q)}`,
    stackoverflow: q => `https://stackoverflow.com/search?q=${encodeURIComponent(q)}`,
};

const searchEngines = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    bing: 'https://www.bing.com/search?q=',
    yahoo: 'https://search.yahoo.com/search?p=',
    brave: 'https://search.brave.com/search?q='
};

const commonSearches = [
    'Weather today', 'News', 'Sports', 'Movies', 'Music', 'Games',
    'Technology', 'Science', 'History', 'Education', 'Travel', 'Food'
];

export default function SearchBar({ onSearch }) {
    const { settings, updateSettings } = useSettings();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        const handler = (e) => {
            if (e.key === '/' && document.activeElement !== inputRef.current) {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && e.target !== inputRef.current) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    function handleInput(val) {
        setQuery(val);
        if (!val.trim()) { setShowSuggestions(false); return; }
        const filtered = commonSearches.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSuggestionIndex(filtered.length > 0 ? 0 : -1);
    }

    function handleKeyDown(e) {
        if (!showSuggestions || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSuggestionIndex(i => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSuggestionIndex(i => i <= 0 ? suggestions.length - 1 : i - 1);
        } else if (e.key === 'Enter' && suggestionIndex >= 0) {
            e.preventDefault();
            submitQuery(suggestions[suggestionIndex]);
        }
    }

    function submitQuery(q) {
        const trimmed = (q || query).trim();
        if (!trimmed) return;
        setShowSuggestions(false);

        if (trimmed.startsWith('@')) {
            const parts = trimmed.substring(1).split(' ');
            const keyword = parts[0].toLowerCase();
            const searchQuery = parts.slice(1).join(' ');
            if (searchQuery && siteSearchEngines[keyword]) {
                onSearch?.(siteSearchEngines[keyword](searchQuery), `${keyword}: ${searchQuery}`);
                window.location.href = siteSearchEngines[keyword](searchQuery);
                return;
            }
            if (keywordSites[keyword]) {
                onSearch?.(keywordSites[keyword], keyword);
                window.location.href = keywordSites[keyword];
                return;
            }
        }

        if (trimmed.includes('.') && !trimmed.includes(' ')) {
            let url = trimmed;
            if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
            onSearch?.(url, trimmed);
            window.location.href = url;
            return;
        }

        const engine = searchEngines[settings.searchEngine] || searchEngines.google;
        onSearch?.(engine + encodeURIComponent(trimmed), trimmed);
        window.location.href = engine + encodeURIComponent(trimmed);
    }

    function handleSubmit(e) {
        e.preventDefault();
        submitQuery(query);
    }

    return (
        <form className="search" role="search" onSubmit={handleSubmit}>
            <div className="search-input-wrapper">
                <div className="search-input">
                    <span className="material-icons search-icon">search</span>
                    <input
                        ref={inputRef}
                        type="search"
                        placeholder="Search or type a URL"
                        autoComplete="off"
                        required
                        value={query}
                        onChange={e => handleInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div ref={suggestionsRef} className={`search-suggestions ${showSuggestions ? 'active' : ''}`}>
                        {suggestions.map((s, i) => (
                            <div key={s} className={`suggestion-item ${i === suggestionIndex ? 'selected' : ''}`}
                                onClick={() => submitQuery(s)}>
                                <span className="material-icons suggestion-icon">search</span>
                                <span className="suggestion-text">{s}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <select className="search-engine-select" value={settings.searchEngine}
                    onChange={e => updateSettings({ searchEngine: e.target.value })}>
                    <option value="google">Google</option>
                    <option value="duckduckgo">DuckDuckGo</option>
                    <option value="bing">Bing</option>
                    <option value="yahoo">Yahoo</option>
                    <option value="brave">Brave</option>
                </select>
            </div>
            <button type="submit" className="btn primary">Search</button>
        </form>
    );
}
