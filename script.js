(() => {
  // DOM Elements
  const q = document.getElementById('q');
  const clockTime = document.getElementById('clockTime');
  const clockDate = document.getElementById('clockDate');
  const weatherTemp = document.getElementById('weatherTemp');
  const weatherCond = document.getElementById('weatherCond');
  const weatherIcon = document.getElementById('weatherIcon');
  const weatherLoc = document.getElementById('weatherLoc');
  const searchForm = document.getElementById('searchForm');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const searchEngine = document.getElementById('searchEngine');
  const shortcutsGrid = document.getElementById('shortcutsGrid');
  const addShortcutBtn = document.getElementById('addShortcutBtn');
  const addShortcutModal = document.getElementById('addShortcutModal');
  const closeShortcutModal = document.getElementById('closeShortcutModal');
  const saveShortcut = document.getElementById('saveShortcut');
  const settingsModal = document.getElementById('settingsModal');
  const settingsBtn = document.getElementById('settingsBtn');
  const closeSettings = document.getElementById('closeSettings');
  const opacitySlider = document.getElementById('opacitySlider');
  const opacityValue = document.getElementById('opacityValue');
  const blurSlider = document.getElementById('blurSlider');
  const blurValue = document.getElementById('blurValue');
  const wallpaperSync = document.getElementById('wallpaperSync');
  const fullScreenMode = document.getElementById('fullScreenMode');
  const fullscreenInfo = document.getElementById('fullscreenInfo');
  const ghostBotClickThrough = document.getElementById('ghostBotClickThrough');
  const networkSpeed = document.getElementById('networkSpeed');
  const batteryStatus = document.getElementById('batteryStatus');
  const recentItems = document.getElementById('recentItems');
  const themeBtns = document.querySelectorAll('.theme-btn');
  const cardSizeSlider = document.getElementById('cardSizeSlider');
  const cardSizeValue = document.getElementById('cardSizeValue');
  const toggleColorCustomization = document.getElementById('toggleColorCustomization');
  const colorCustomizationPanel = document.getElementById('colorCustomizationPanel');
  const pinnedBar = document.getElementById('pinnedBar');
  const pinnedItems = document.getElementById('pinnedItems');
  const customPinModal = document.getElementById('customPinModal');
  const closeCustomPinModal = document.getElementById('closeCustomPinModal');
  const saveCustomPin = document.getElementById('saveCustomPin');

  let latestWeatherCode = null;
  let suggestionIndex = -1;
  let shortcuts = [];
  let recentHistory = [];
  let pinnedItemsList = [];
  let currentEditingPin = null;

  // Settings with localStorage
  const defaultSettings = {
    theme: 'dark',
    opacity: 100,
    blur: 22,
    wallpaperSync: false,
    fullScreen: false,
    searchEngine: 'google',
    shortcuts: [],
    cardSize: 100,
    ghostBotClickThrough: false,
    customColors: null
  };

  function getSettings() {
    const stored = localStorage.getItem('homepageSettings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  }

  function saveSettings(settings) {
    localStorage.setItem('homepageSettings', JSON.stringify(settings));
  }

  function loadSettings() {
    const settings = getSettings();
    // Apply theme
    document.body.className = `theme-${settings.theme}`;
    if (settings.wallpaperSync) document.body.classList.add('wallpaper-sync');
    if (settings.fullScreen) document.body.classList.add('fullscreen');

    // Apply theme buttons
    themeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === settings.theme);
    });

    // Apply opacity
    document.body.style.opacity = (settings.opacity / 100).toString();
    if (opacitySlider) opacitySlider.value = settings.opacity;
    if (opacityValue) opacityValue.textContent = `${settings.opacity}%`;

    // Apply blur
    document.documentElement.style.setProperty('--blur-strong', `${settings.blur}px`);
    if (blurSlider) blurSlider.value = settings.blur;
    if (blurValue) blurValue.textContent = `${settings.blur}px`;

    // Apply wallpaper sync
    if (wallpaperSync) wallpaperSync.checked = settings.wallpaperSync;
    if (settings.wallpaperSync) {
      applyWallpaperSync();
    }

    // Apply fullscreen
    if (fullScreenMode) fullScreenMode.checked = settings.fullScreen;
    if (settings.fullScreen) {
      if (fullscreenInfo) fullscreenInfo.style.display = 'flex';
      updateBatteryStatus();
      updateNetworkSpeed();
    }

    // Apply ghost bot click through
    if (ghostBotClickThrough) ghostBotClickThrough.checked = settings.ghostBotClickThrough;
    const ghostBot = document.getElementById('ghostBot');
    if (ghostBot) {
      if (settings.ghostBotClickThrough) {
        ghostBot.classList.add('click-through-enabled');
      } else {
        ghostBot.classList.remove('click-through-enabled');
      }
    }

    // Apply search engine
    if (searchEngine) searchEngine.value = settings.searchEngine;

    // Apply card size
    if (settings.cardSize && cardSizeSlider) {
      cardSizeSlider.value = settings.cardSize;
      cardSizeValue.textContent = `${settings.cardSize}%`;
      applyCardSize(settings.cardSize);
    }

    // Apply custom colors
    if (settings.customColors) {
      applyCustomColors(settings.customColors);
    }

    // Load shortcuts
    if (settings.shortcuts && settings.shortcuts.length > 0) {
      shortcuts = settings.shortcuts;
      renderShortcuts();
    }

    // Load recent history
    const stored = localStorage.getItem('recentHistory');
    if (stored) {
      recentHistory = JSON.parse(stored);
      renderRecentItems();
    }

    // Load pinned items
    const pinnedStored = localStorage.getItem('pinnedItems');
    if (pinnedStored) {
      pinnedItemsList = JSON.parse(pinnedStored);
      renderPinnedItems();
    }

    return settings;
  }

  function applyWallpaperSync() {
    if (navigator.wallpaper) {
      navigator.wallpaper.setWallpaper().then(() => {
        // Wallpaper API available
      }).catch(() => {
        // Fallback: try to get desktop wallpaper
        try {
          if (window.chrome && window.chrome.system && window.chrome.system.display) {
            // Chrome extension API
          }
        } catch (e) {
          console.log('Wallpaper sync not available');
        }
      });
    }
    // For now, we'll use a fallback gradient effect
    document.body.classList.add('wallpaper-sync');
  }

  // @ Keyword mappings
  const keywordSites = {
    youtube: 'https://www.youtube.com',
    chatgpt: 'https://chat.openai.com',
    google: 'https://www.google.com',
    duckduckgo: 'https://duckduckgo.com',
    bing: 'https://www.bing.com',
    github: 'https://github.com',
    twitter: 'https://twitter.com',
    facebook: 'https://www.facebook.com',
    instagram: 'https://www.instagram.com',
    linkedin: 'https://www.linkedin.com',
    reddit: 'https://www.reddit.com',
    amazon: 'https://www.amazon.com',
    netflix: 'https://www.netflix.com',
    spotify: 'https://open.spotify.com',
    gmail: 'https://mail.google.com',
    drive: 'https://drive.google.com',
    docs: 'https://docs.google.com',
    maps: 'https://maps.google.com'
  };

  // Site-specific search engines
  const siteSearchEngines = {
    youtube: (query) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    github: (query) => `https://github.com/search?q=${encodeURIComponent(query)}`,
    reddit: (query) => `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
    amazon: (query) => `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
    twitter: (query) => `https://twitter.com/search?q=${encodeURIComponent(query)}`,
    stackoverflow: (query) => `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`,
    google: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    bing: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    duckduckgo: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
  };

  // Search engines
  const searchEngines = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    bing: 'https://www.bing.com/search?q=',
    yahoo: 'https://search.yahoo.com/search?p=',
    brave: 'https://search.brave.com/search?q='
  };

  // Initialize
  loadSettings();
  q && q.focus();

  // Press / to focus search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== q) {
      e.preventDefault();
      q.focus();
      q.select();
    }
    // ESC to close modals
    if (e.key === 'Escape') {
      if (settingsModal.classList.contains('active')) {
        settingsModal.classList.remove('active');
      }
      if (addShortcutModal.classList.contains('active')) {
        addShortcutModal.classList.remove('active');
      }
    }
  });

  // Clock - 12 hour format
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hh = String(hours).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    clockTime && (clockTime.textContent = `${hh}:${mm}:${ss} ${ampm}`);
    const opts = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    clockDate && (clockDate.textContent = now.toLocaleDateString(undefined, opts));
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Weather
  function weatherCodeToIcon(code) {
    // simplified mapping - return emojis
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 99) return '🌩️';
    return '☁️';
  }

  function isRainyWeather(code) {
    if (code == null) return false;
    return (code >= 51 && code <= 67) || (code >= 80 && code <= 99);
  }

  async function fetchWeather(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      const cw = data.current_weather;
      if (!cw) throw new Error('No current weather');
      const tempC = Math.round(cw.temperature);
      const code = cw.weathercode;
      latestWeatherCode = code;
      weatherTemp && (weatherTemp.textContent = `${tempC}°C`);
      weatherCond && (weatherCond.textContent = `Winds ${Math.round(cw.windspeed)} km/h`);
      if (weatherIcon) {
        weatherIcon.textContent = weatherCodeToIcon(code);
        weatherIcon.classList.remove('material-icons');
      }
      weatherLoc && (weatherLoc.textContent = `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`);

      const ghostBot = document.getElementById('ghostBot');
      if (ghostBot) {
        if (isRainyWeather(code)) {
          ghostBot.classList.add('ghost-bot--rainy');
        } else {
          ghostBot.classList.remove('ghost-bot--rainy');
        }
      }
    } catch (err) {
      weatherCond && (weatherCond.textContent = 'Unable to load weather');
      weatherTemp && (weatherTemp.textContent = '--°C');
      if (weatherIcon) {
        weatherIcon.textContent = '❓';
        weatherIcon.classList.remove('material-icons');
      }
      latestWeatherCode = null;
      console.warn('Weather error', err);
    }
  }

  function getAndFetchWeather() {
    if (!navigator.geolocation) {
      fetchWeather(24.86, 67.01);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(24.86, 67.01),
      { timeout: 5000 }
    );
  }

  getAndFetchWeather();
  setInterval(() => {
    getAndFetchWeather();
  }, 300000);

  // Search suggestions
  const commonSearches = [
    'Weather today', 'News', 'Sports', 'Movies', 'Music', 'Games',
    'Technology', 'Science', 'History', 'Education', 'Travel', 'Food'
  ];

  function showSuggestions(query) {
    if (!query || query.trim().length === 0) {
      searchSuggestions.classList.remove('active');
      return;
    }

    const filtered = commonSearches.filter(s =>
      s.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    if (filtered.length === 0) {
      searchSuggestions.classList.remove('active');
      return;
    }

    searchSuggestions.innerHTML = filtered.map((s, i) => `
      <div class="suggestion-item ${i === 0 ? 'selected' : ''}" data-suggestion="${s}">
        <span class="material-icons suggestion-icon">search</span>
        <span class="suggestion-text">${s}</span>
      </div>
    `).join('');

    searchSuggestions.classList.add('active');
    suggestionIndex = 0;

    // Add click handlers
    searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        q.value = item.dataset.suggestion;
        searchSuggestions.classList.remove('active');
        searchForm.requestSubmit();
      });
    });
  }

  q && q.addEventListener('input', (e) => {
    showSuggestions(e.target.value);
    suggestionIndex = -1;
  });

  q && q.addEventListener('keydown', (e) => {
    const items = searchSuggestions.querySelectorAll('.suggestion-item');
    if (!searchSuggestions.classList.contains('active') || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      suggestionIndex = (suggestionIndex + 1) % items.length;
      items.forEach((item, i) => {
        item.classList.toggle('selected', i === suggestionIndex);
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      suggestionIndex = suggestionIndex <= 0 ? items.length - 1 : suggestionIndex - 1;
      items.forEach((item, i) => {
        item.classList.toggle('selected', i === suggestionIndex);
      });
    } else if (e.key === 'Enter' && suggestionIndex >= 0) {
      e.preventDefault();
      q.value = items[suggestionIndex].dataset.suggestion;
      searchSuggestions.classList.remove('active');
      searchForm.requestSubmit();
    }
  });

  // Click outside to close suggestions
  document.addEventListener('click', (e) => {
    if (!searchSuggestions.contains(e.target) && e.target !== q) {
      searchSuggestions.classList.remove('active');
    }
  });

  // Search form handler
  searchForm && searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let query = q.value.trim();

    // Check for @ keyword with optional search query
    if (query.startsWith('@')) {
      const parts = query.substring(1).split(' ');
      const keyword = parts[0].toLowerCase();
      const searchQuery = parts.slice(1).join(' ');

      // If there's a search query after @website
      if (searchQuery && siteSearchEngines[keyword]) {
        const searchUrl = siteSearchEngines[keyword](searchQuery);
        addToRecent(searchUrl, `${keyword}: ${searchQuery}`);
        window.location.href = searchUrl;
        return;
      }

      // Just navigate to the website if no query or not in siteSearchEngines
      if (keywordSites[keyword]) {
        addToRecent(keywordSites[keyword], keyword);
        window.location.href = keywordSites[keyword];
        return;
      }
    }

    // Check if it's a URL
    if (query.includes('.') && !query.includes(' ')) {
      let url = query;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      addToRecent(url, query);
      window.location.href = url;
      return;
    }

    // Normal search
    const settings = getSettings();
    const engine = searchEngines[settings.searchEngine] || searchEngines.google;
    addToRecent(engine + encodeURIComponent(query), query);
    window.location.href = engine + encodeURIComponent(query);
  });

  // Search engine change
  searchEngine && searchEngine.addEventListener('change', (e) => {
    const settings = getSettings();
    settings.searchEngine = e.target.value;
    saveSettings(settings);
  });

  // Add to recent history
  function addToRecent(url, title) {
    const item = { url, title, timestamp: Date.now() };
    recentHistory = recentHistory.filter(item => item.url !== url);
    recentHistory.unshift(item);
    if (recentHistory.length > 10) recentHistory = recentHistory.slice(0, 10);
    localStorage.setItem('recentHistory', JSON.stringify(recentHistory));
    renderRecentItems();
  }

  // Render recent items
  function renderRecentItems() {
    if (!recentItems) return;

    if (recentHistory.length === 0) {
      recentItems.innerHTML = '<div style="color: var(--text-soft); font-size: 13px;">No recent items</div>';
      return;
    }

    recentItems.innerHTML = recentHistory.map((item, index) => `
      <a href="${item.url}" class="recent-item" target="_blank" data-url-index="${index}">
        <span class="material-icons" style="font-size: 18px;">history</span>
        <span>${item.title}</span>
        <button class="recent-item-remove" data-url-index="${index}" title="Remove">Ã—</button>
      </a>
    `).join('');

    // Add event listeners for remove buttons
    recentItems.querySelectorAll('.recent-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(btn.dataset.urlIndex);
        recentHistory.splice(index, 1);
        localStorage.setItem('recentHistory', JSON.stringify(recentHistory));
        renderRecentItems();
      });
    });
  }

  // Shortcuts management
  function renderShortcuts() {
    if (!shortcutsGrid) return;

    const clockCard = shortcutsGrid.querySelector('.clock-card');
    const weatherCard = shortcutsGrid.querySelector('.weather-card');
    const addBtn = shortcutsGrid.querySelector('.add-shortcut-card');

    // Remove existing shortcut cards
    shortcutsGrid.querySelectorAll('.shortcut-card').forEach(card => card.remove());

    // Add shortcut cards before add button
    shortcuts.forEach((shortcut, index) => {
      const card = document.createElement('div');
      card.className = 'card shortcut-card';
      card.innerHTML = `
        <button class="shortcut-remove" onclick="removeShortcut(${index})" title="Remove">Ã—</button>
        <a href="${shortcut.url}" class="shortcut-link" target="_blank">
          <img src="${shortcut.icon || `https://www.google.com/s2/favicons?domain=${new URL(shortcut.url).hostname}&sz=64`}" 
               alt="${shortcut.name}" class="shortcut-icon" 
               onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\'%3E%3Cpath fill=\\'%23fff\\' d=\\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z\\'/%3E%3C/svg%3E'">
          <span class="shortcut-name">${shortcut.name}</span>
        </a>
      `;
      shortcutsGrid.insertBefore(card, addBtn);
    });
  }

  window.removeShortcut = function (index) {
    shortcuts.splice(index, 1);
    const settings = getSettings();
    settings.shortcuts = shortcuts;
    saveSettings(settings);
    renderShortcuts();
  };

  // Add shortcut modal
  addShortcutBtn && addShortcutBtn.addEventListener('click', () => {
    addShortcutModal.classList.add('active');
    document.getElementById('shortcutName').value = '';
    document.getElementById('shortcutUrl').value = '';
    document.getElementById('shortcutIcon').value = '';
  });

  closeShortcutModal && closeShortcutModal.addEventListener('click', () => {
    addShortcutModal.classList.remove('active');
  });

  saveShortcut && saveShortcut.addEventListener('click', () => {
    const name = document.getElementById('shortcutName').value.trim();
    const url = document.getElementById('shortcutUrl').value.trim();
    const icon = document.getElementById('shortcutIcon').value.trim();

    if (!name || !url) {
      alert('Please provide name and URL');
      return;
    }

    let finalUrl = url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    shortcuts.push({ name, url: finalUrl, icon });
    const settings = getSettings();
    settings.shortcuts = shortcuts;
    saveSettings(settings);
    renderShortcuts();
    addShortcutModal.classList.remove('active');
  });

  // Settings modal
  settingsBtn && settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
  });

  closeSettings && closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });

  settingsModal && settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('active');
    }
  });

  // Theme buttons
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      document.body.className = `theme-${theme}`;
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const settings = getSettings();
      settings.theme = theme;
      saveSettings(settings);
    });
  });

  // Opacity slider
  opacitySlider && opacitySlider.addEventListener('input', (e) => {
    const value = e.target.value;
    document.body.style.opacity = (value / 100).toString();
    opacityValue.textContent = `${value}%`;
    const settings = getSettings();
    settings.opacity = parseInt(value);
    saveSettings(settings);
  });

  // Blur slider
  blurSlider && blurSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    document.documentElement.style.setProperty('--blur-strong', `${value}px`);
    blurValue.textContent = `${value}px`;
    const settings = getSettings();
    settings.blur = parseInt(value);
    saveSettings(settings);
  });

  // Wallpaper sync
  wallpaperSync && wallpaperSync.addEventListener('change', (e) => {
    const settings = getSettings();
    settings.wallpaperSync = e.target.checked;
    saveSettings(settings);
    if (e.target.checked) {
      applyWallpaperSync();
    } else {
      document.body.classList.remove('wallpaper-sync');
    }
  });

  // Full screen mode
  fullScreenMode && fullScreenMode.addEventListener('change', (e) => {
    const settings = getSettings();
    settings.fullScreen = e.target.checked;
    saveSettings(settings);

    if (e.target.checked) {
      document.body.classList.add('fullscreen');
      if (fullscreenInfo) fullscreenInfo.style.display = 'flex';
      updateBatteryStatus();
      updateNetworkSpeed();
    } else {
      document.body.classList.remove('fullscreen');
      if (fullscreenInfo) fullscreenInfo.style.display = 'none';
    }
  });

  // Ghost bot click through
  ghostBotClickThrough && ghostBotClickThrough.addEventListener('change', (e) => {
    const settings = getSettings();
    settings.ghostBotClickThrough = e.target.checked;
    saveSettings(settings);

    const ghostBot = document.getElementById('ghostBot');
    if (ghostBot) {
      if (e.target.checked) {
        ghostBot.classList.add('click-through-enabled');
      } else {
        ghostBot.classList.remove('click-through-enabled');
      }
    }
  });

  // Battery status
  function updateBatteryStatus() {

    if (!batteryStatus) return;

    if ('getBattery' in navigator) {

      navigator.getBattery().then(battery => {

        const update = () => {

          const percentage = Math.round(battery.level * 100);

          const icon = battery.charging ? 'battery_charging_full' : 'battery_full';

          batteryStatus.innerHTML = `<span class="material-icons" style="font-size:16px; vertical-align:middle; margin-right:4px;">${icon}</span> ${percentage}%`;

        };

        update();

        battery.addEventListener('chargingchange', update);

        battery.addEventListener('levelchange', update);

      }).catch(() => {

        batteryStatus.textContent = 'N/A';

      });

    } else {

      batteryStatus.textContent = 'N/A';

    }

  }



  // Network speed

  let networkSpeedLastTime = Date.now();

  let networkSpeedLastLoaded = performance.memory ? performance.memory.usedJSHeapSize : 0;



  function updateNetworkSpeed() {

    if (!networkSpeed) return;

    const setSpeed = (text) => {

      networkSpeed.innerHTML = `<span class="material-icons" style="font-size:16px; vertical-align:middle; margin-right:4px;">speed</span> ${text}`;

    };



    if ('connection' in navigator) {

      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      if (conn) {

        const update = () => {

          const speed = conn.downlink || 0;

          const unit = conn.downlink && conn.downlink >= 1 ? 'Mbps' : 'Kbps';

          setSpeed(`${speed.toFixed(1)} ${unit}`);

        };

        update();

        conn.addEventListener('change', update);

      } else {

        setSpeed('N/A');

      }

    } else {

      const now = Date.now();

      const timeDiff = (now - networkSpeedLastTime) / 1000;

      if (timeDiff > 1) {

        setSpeed('Active');

        networkSpeedLastTime = now;

      } else {

        setSpeed('Active');

      }

    }

  }

  // Ghost bot that follows cursor
  const ghostBot = document.getElementById('ghostBot');
  if (ghostBot) {
    let ghostX = 0;
    let ghostY = 0;
    let targetX = 0;
    let targetY = 0;
    let isVisible = false;
    let isFollowing = true;
    let isFalling = false;
    let isAtBottom = false;

    const leftPupil = ghostBot.querySelector('.ghost-eye.left .ghost-pupil');
    const rightPupil = ghostBot.querySelector('.ghost-eye.right .ghost-pupil');
    const ghostHead = ghostBot.querySelector('.ghost-bot-head');

    function updateGhostBot(e) {
      if (!isFollowing || isFalling) return;
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        ghostBot.style.opacity = '1';
      }
    }

    function updatePupils(clientX, clientY) {
      if (!ghostHead || !leftPupil || !rightPupil) return;
      const rect = ghostHead.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const maxDist = 100;
      const dist = Math.hypot(dx, dy);
      const ratio = Math.min(dist / maxDist, 1);
      const nx = (dx / (dist || 1)) * ratio * 1.5;
      const ny = (dy / (dist || 1)) * ratio * 1.5;
      const t = `translate(${nx}px, ${ny}px)`;
      leftPupil.style.transform = t;
      rightPupil.style.transform = t;
    }

    function animateGhostBot() {
      if (isFollowing && !isFalling) {
        ghostX += (targetX - ghostX) * 0.15;
        ghostY += (targetY - ghostY) * 0.15;
      } else if (isFalling) {
        ghostY += 2;
        ghostX += (Math.random() - 0.5) * 4;

        if (ghostY > window.innerHeight - 50) {
          isFalling = false;
          isAtBottom = true;
          ghostY = window.innerHeight - 50;
          ghostBot.classList.remove('ghost-bot--fear');
          ghostBot.classList.remove('ghost-bot--falling');
        }
      }

      ghostBot.style.left = `${ghostX}px`;
      ghostBot.style.top = `${ghostY}px`;

      requestAnimationFrame(animateGhostBot);
    }

    window.addEventListener('mousemove', (e) => {
      updateGhostBot(e);
      if (isAtBottom && !isFalling) {
        updatePupils(e.clientX, e.clientY);
      }
    });

    ghostBot.addEventListener('dblclick', (e) => {
      e.preventDefault();
      const isAtBottom = ghostY > window.innerHeight - 100;

      if (isAtBottom && !isFollowing) {
        isFollowing = true;
        isFalling = false;
        isAtBottom = false;
        ghostBot.classList.remove('ghost-bot--fear');
        ghostBot.classList.remove('ghost-bot--falling');
        targetX = e.clientX;
        targetY = e.clientY;
        if (leftPupil) leftPupil.style.transform = 'translate(0,0)';
        if (rightPupil) rightPupil.style.transform = 'translate(0,0)';
      } else if (!isFalling) {
        isFollowing = false;
        isFalling = true;
        ghostBot.classList.add('ghost-bot--fear');
        ghostBot.classList.add('ghost-bot--falling');
      }
    });

    window.addEventListener('mouseleave', () => {
      if (isFollowing) {
        isVisible = false;
        ghostBot.style.opacity = '0';
      }
      if (leftPupil) leftPupil.style.transform = 'translate(0,0)';
      if (rightPupil) rightPupil.style.transform = 'translate(0,0)';
    });

    animateGhostBot();
  }

  // Initial render
  renderRecentItems();


  // Card size control
  function applyCardSize(size) {
    // Use min-height instead of transform scale for better layout
    const baseHeight = 140;
    const minHeight = Math.round(baseHeight * (size / 100));
    document.documentElement.style.setProperty('--card-min-height', `${minHeight}px`);
  }

  cardSizeSlider && cardSizeSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (cardSizeValue) cardSizeValue.textContent = `${value}%`;
    applyCardSize(value);
    const settings = getSettings();
    settings.cardSize = value;
    saveSettings(settings);
  });

  // Color customization
  const colorPresets = {
    default: {
      primaryBg: '#114b5f',
      secondaryBg: '#028090',
      cardBg: '#114b5f',
      primaryText: '#e4fde1',
      secondaryText: '#456990',
      accent: '#028090',
      buttonPrimary: '#028090',
      buttonSecondary: '#456990'
    },
    warm: {
      primaryBg: '#8B4513',
      secondaryBg: '#D2691E',
      cardBg: '#A0522D',
      primaryText: '#FFF8DC',
      secondaryText: '#DEB887',
      accent: '#FF6347',
      buttonPrimary: '#FF6347',
      buttonSecondary: '#D2691E'
    },
    cool: {
      primaryBg: '#1E3A8A',
      secondaryBg: '#3B82F6',
      cardBg: '#1E40AF',
      primaryText: '#DBEAFE',
      secondaryText: '#93C5FD',
      accent: '#60A5FA',
      buttonPrimary: '#3B82F6',
      buttonSecondary: '#2563EB'
    },
    dark: {
      primaryBg: '#0a0a0a',
      secondaryBg: '#1a1a1a',
      cardBg: '#0f0f0f',
      primaryText: '#ffffff',
      secondaryText: '#888888',
      accent: '#ffffff',
      buttonPrimary: '#333333',
      buttonSecondary: '#1a1a1a'
    }
  };

  function applyCustomColors(colors) {
    if (!colors) return;
    const root = document.documentElement;
    root.style.setProperty('--dark-teal', colors.primaryBg);
    root.style.setProperty('--teal', colors.secondaryBg);
    root.style.setProperty('--surface', `${colors.cardBg}cc`);
    root.style.setProperty('--text', colors.primaryText);
    root.style.setProperty('--text-soft', `${colors.secondaryText}b3`);
    root.style.setProperty('--primary', colors.accent);
    root.style.setProperty('--muted', colors.secondaryText);

    // Update color picker values
    if (document.getElementById('colorPrimaryBg')) document.getElementById('colorPrimaryBg').value = colors.primaryBg;
    if (document.getElementById('colorSecondaryBg')) document.getElementById('colorSecondaryBg').value = colors.secondaryBg;
    if (document.getElementById('colorCardBg')) document.getElementById('colorCardBg').value = colors.cardBg;
    if (document.getElementById('colorPrimaryText')) document.getElementById('colorPrimaryText').value = colors.primaryText;
    if (document.getElementById('colorSecondaryText')) document.getElementById('colorSecondaryText').value = colors.secondaryText;
    if (document.getElementById('colorAccent')) document.getElementById('colorAccent').value = colors.accent;
    if (document.getElementById('colorButtonPrimary')) document.getElementById('colorButtonPrimary').value = colors.buttonPrimary;
    if (document.getElementById('colorButtonSecondary')) document.getElementById('colorButtonSecondary').value = colors.buttonSecondary;
  }

  toggleColorCustomization && toggleColorCustomization.addEventListener('click', () => {
    if (colorCustomizationPanel.style.display === 'none') {
      colorCustomizationPanel.style.display = 'block';
      toggleColorCustomization.textContent = 'Hide Color Options';
    } else {
      colorCustomizationPanel.style.display = 'none';
      toggleColorCustomization.textContent = 'Show Color Options';
    }
  });

  // Color picker listeners
  const colorPickers = ['colorPrimaryBg', 'colorSecondaryBg', 'colorCardBg', 'colorPrimaryText', 'colorSecondaryText', 'colorAccent', 'colorButtonPrimary', 'colorButtonSecondary'];
  colorPickers.forEach(id => {
    const picker = document.getElementById(id);
    if (picker) {
      picker.addEventListener('input', () => {
        const colors = {
          primaryBg: document.getElementById('colorPrimaryBg').value,
          secondaryBg: document.getElementById('colorSecondaryBg').value,
          cardBg: document.getElementById('colorCardBg').value,
          primaryText: document.getElementById('colorPrimaryText').value,
          secondaryText: document.getElementById('colorSecondaryText').value,
          accent: document.getElementById('colorAccent').value,
          buttonPrimary: document.getElementById('colorButtonPrimary').value,
          buttonSecondary: document.getElementById('colorButtonSecondary').value
        };
        applyCustomColors(colors);
        const settings = getSettings();
        settings.customColors = colors;
        saveSettings(settings);
      });
    }
  });

  // Color presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      if (colorPresets[preset]) {
        applyCustomColors(colorPresets[preset]);
        const settings = getSettings();
        settings.customColors = preset === 'default' ? null : colorPresets[preset];
        saveSettings(settings);
      }
    });
  });

  // Pinned items management
  function renderPinnedItems() {
    if (!pinnedItems || !pinnedBar) return;

    if (pinnedItemsList.length === 0) {
      pinnedBar.style.display = 'none';
      return;
    }

    pinnedBar.style.display = 'block';
    pinnedItems.innerHTML = pinnedItemsList.map((item, index) => `
      <div class="pinned-item" draggable="true" data-index="${index}" style="${item.bgColor ? `background-color: ${item.bgColor};` : ''}">
        <div class="pinned-item-icon" style="${item.iconColor ? `color: ${item.iconColor};` : ''}">
          <span class="material-icons">push_pin</span>
        </div>
        <span>${item.label || item.title}</span>
        <div class="pinned-item-actions">
          <button class="pinned-item-btn edit" data-index="${index}" title="Edit">
            <span class="material-icons" style="font-size: 14px;">edit</span>
          </button>
          <button class="pinned-item-btn unpin" data-index="${index}" title="Unpin">
            <span class="material-icons" style="font-size: 14px;">close</span>
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners
    pinnedItems.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        openCustomPinModal(index);
      });
    });

    pinnedItems.querySelectorAll('.unpin').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        unpinItem(index);
      });
    });

    // Add click handlers to navigate
    pinnedItems.querySelectorAll('.pinned-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        window.location.href = pinnedItemsList[index].url;
      });

      // Drag and drop
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = index;
        if (fromIndex !== toIndex) {
          const item = pinnedItemsList.splice(fromIndex, 1)[0];
          pinnedItemsList.splice(toIndex, 0, item);
          localStorage.setItem('pinnedItems', JSON.stringify(pinnedItemsList));
          renderPinnedItems();
        }
      });
    });
  }

  function pinItem(url, title) {
    const existing = pinnedItemsList.find(item => item.url === url);
    if (existing) return;

    pinnedItemsList.push({ url, title, label: title, timestamp: Date.now() });
    localStorage.setItem('pinnedItems', JSON.stringify(pinnedItemsList));
    renderPinnedItems();
  }

  function unpinItem(index) {
    pinnedItemsList.splice(index, 1);
    localStorage.setItem('pinnedItems', JSON.stringify(pinnedItemsList));
    renderPinnedItems();
  }

  function openCustomPinModal(index) {
    currentEditingPin = index;
    const pin = pinnedItemsList[index];
    document.getElementById('pinLabel').value = pin.label || pin.title;
    document.getElementById('pinIconColor').value = pin.iconColor || '#028090';
    document.getElementById('pinBgColor').value = pin.bgColor || '#114b5f';
    customPinModal.classList.add('active');
  }

  closeCustomPinModal && closeCustomPinModal.addEventListener('click', () => {
    customPinModal.classList.remove('active');
  });

  saveCustomPin && saveCustomPin.addEventListener('click', () => {
    if (currentEditingPin !== null) {
      const label = document.getElementById('pinLabel').value.trim();
      const iconColor = document.getElementById('pinIconColor').value;
      const bgColor = document.getElementById('pinBgColor').value;

      pinnedItemsList[currentEditingPin].label = label || pinnedItemsList[currentEditingPin].title;
      pinnedItemsList[currentEditingPin].iconColor = iconColor;
      pinnedItemsList[currentEditingPin].bgColor = bgColor;

      localStorage.setItem('pinnedItems', JSON.stringify(pinnedItemsList));
      renderPinnedItems();
      customPinModal.classList.remove('active');
      currentEditingPin = null;
    }
  });

  // Update renderRecentItems to include pin button
  const originalRenderRecentItems = renderRecentItems;
  renderRecentItems = function () {
    if (!recentItems) return;

    if (recentHistory.length === 0) {
      recentItems.innerHTML = '<div style="color: var(--text-soft); font-size: 13px;">No recent items</div>';
      return;
    }

    recentItems.innerHTML = recentHistory.map((item, index) => `
      <a href="${item.url}" class="recent-item" target="_blank" data-url-index="${index}">
        <button class="recent-item-pin" data-url-index="${index}" title="Pin"><span class="material-icons" style="font-size: 14px;">push_pin</span></button>
        <span class="material-icons" style="font-size: 18px;">history</span>
        <span>${item.title}</span>
        <button class="recent-item-remove" data-url-index="${index}" title="Remove">×</button>
      </a>
    `).join('');

    // Add event listeners for pin buttons
    recentItems.querySelectorAll('.recent-item-pin').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(btn.dataset.urlIndex);
        const item = recentHistory[index];
        pinItem(item.url, item.title);
      });
    });

    // Add event listeners for remove buttons
    recentItems.querySelectorAll('.recent-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(btn.dataset.urlIndex);
        recentHistory.splice(index, 1);
        localStorage.setItem('recentHistory', JSON.stringify(recentHistory));
        renderRecentItems();
      });
    });
  };
  // --- New Features ---

  // Color Customization
  const colorInputs = {
    colorPrimaryBg: '--dark-teal',
    colorSecondaryBg: '--teal',
    colorCardBg: '--surface',
    colorPrimaryText: '--text',
    colorSecondaryText: '--baltic-blue',
    colorAccent: '--accent',
    colorButtonPrimary: '--primary',
    colorButtonSecondary: '--muted'
  };

  function initColorCustomization() {
    const panel = document.getElementById('colorCustomizationPanel');
    const toggle = document.getElementById('toggleColorCustomization');
    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'grid' : 'none';
        if (isHidden) panel.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
        toggle.textContent = isHidden ? 'Hide Color Options' : 'Show Color Options';
      });
    }

    Object.entries(colorInputs).forEach(([id, varName]) => {
      const input = document.getElementById(id);
      if (input) {
        const saved = localStorage.getItem('color_' + id);
        if (saved) {
          input.value = saved;
          document.documentElement.style.setProperty(varName, saved);
        }
        input.addEventListener('input', (e) => {
          const val = e.target.value;
          document.documentElement.style.setProperty(varName, val);
          localStorage.setItem('color_' + id, val);
        });
      }
    });
  }
  // Add new color inputs to map
  colorInputs.colorCardHoverBg = '--card-hover-bg';
  colorInputs.colorCardHoverBorder = '--card-hover-border';

  // Refresh inputs for new keys
  Object.entries(colorInputs).forEach(([id, varName]) => {
    const input = document.getElementById(id);
    if (input) {
      // Re-attach or attach new listeners
      const saved = localStorage.getItem('color_' + id);
      if (saved) {
        input.value = saved;
        document.documentElement.style.setProperty(varName, saved);
      }
      // Remove old listener to avoid dupes? specific implementation is idempotent enough here
      input.oninput = (e) => {
        const val = e.target.value;
        document.documentElement.style.setProperty(varName, val);
        localStorage.setItem('color_' + id, val);
      };
    }
  });

  // Wallpaper Upload Logic
  const wallUrlInfo = document.getElementById('wallpaperUrlInput');
  const wallUpload = document.getElementById('wallpaperUpload');
  const clearWall = document.getElementById('clearWallpaper');

  function applyCustomWallpaper(src) {
    if (src) {
      document.body.style.backgroundImage = `url('${src}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.classList.add('custom-wallpaper');
    } else {
      document.body.style.backgroundImage = '';
      document.body.classList.remove('custom-wallpaper');
    }
  }

  // Load saved wallpaper
  const savedWall = localStorage.getItem('customWallpaper');
  if (savedWall) {
    applyCustomWallpaper(savedWall);
    if (wallUrlInfo && savedWall.startsWith('http')) wallUrlInfo.value = savedWall;
  }

  if (wallUrlInfo) {
    wallUrlInfo.addEventListener('input', (e) => {
      const val = e.target.value;
      applyCustomWallpaper(val);
      localStorage.setItem('customWallpaper', val);
    });
  }

  if (wallUpload) {
    wallUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const res = evt.target.result;
          // Check size roughly
          if (res.length > 5000000) {
            alert('Image might be too large to save. Try a smaller image.');
          }
          applyCustomWallpaper(res);
          try {
            localStorage.setItem('customWallpaper', res);
            if (wallUrlInfo) wallUrlInfo.value = '[Uploaded Image]';
          } catch (err) {
            alert('Failed to save image locally (quota exceeded). It will reset on reload.');
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (clearWall) {
    clearWall.addEventListener('click', () => {
      localStorage.removeItem('customWallpaper');
      applyCustomWallpaper(null);
      if (wallUrlInfo) wallUrlInfo.value = '';
      if (wallUpload) wallUpload.value = '';
    });
  }
  initColorCustomization();

  // Fullscreen
  const fullScreenToggle = document.getElementById('fullScreenMode');
  if (fullScreenToggle) {
    fullScreenToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.documentElement.requestFullscreen().catch(err => console.error(err));
      } else if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    });
    document.addEventListener('fullscreenchange', () => {
      fullScreenToggle.checked = !!document.fullscreenElement;
    });
  }

  // Smart Search
  // const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      const query = document.getElementById('q').value;
      if (query.startsWith('@')) {
        e.preventDefault();
        const parts = query.trim().split(' ');
        const site = parts[0].substring(1).toLowerCase();
        const term = parts.slice(1).join(' ');
        const engines = {
          youtube: q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
          google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
          github: q => `https://github.com/search?q=${encodeURIComponent(q)}`,
          stackoverflow: q => `https://stackoverflow.com/search?q=${encodeURIComponent(q)}`,
          reddit: q => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}`
        };
        if (engines[site]) {
          window.location.href = engines[site](term);
        } else {
          window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
      }
    });
  }


  // Custom Pin Logic
  // const customPinModal = document.getElementById('customPinModal');
  const saveCustomPinBtn = document.getElementById('saveCustomPin');
  let currentPinIndex = -1;

  // Make available in scope
  window.openCustomPinModal = (item, index) => {
    currentPinIndex = index;
    if (customPinModal) {
      document.getElementById('pinLabel').value = item.title || '';
      document.getElementById('pinBgColor').value = item.customBg || '#114b5f';
      customPinModal.style.display = 'flex';
    }
  };

  if (document.getElementById('closeCustomPinModal')) {
    document.getElementById('closeCustomPinModal').addEventListener('click', () => {
      customPinModal.style.display = 'none';
    });
  }

  if (saveCustomPinBtn) {
    saveCustomPinBtn.addEventListener('click', () => {
      if (currentPinIndex > -1 && recentHistory[currentPinIndex]) {
        recentHistory[currentPinIndex].title = document.getElementById('pinLabel').value;
        recentHistory[currentPinIndex].customBg = document.getElementById('pinBgColor').value;
        localStorage.setItem('recentHistory', JSON.stringify(recentHistory));
        renderRecentItems();
        customPinModal.style.display = 'none';
      }
    });
  }
})();

