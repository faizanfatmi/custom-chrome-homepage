(() => {
  const q = document.getElementById('q');
  const clockTime = document.getElementById('clockTime');
  const clockDate = document.getElementById('clockDate');
  const weatherTemp = document.getElementById('weatherTemp');
  const weatherCond = document.getElementById('weatherCond');
  const weatherIcon = document.getElementById('weatherIcon');
  const weatherLoc = document.getElementById('weatherLoc');

  let latestWeatherCode = null;

  // focus input on load
  q && q.focus();

  // press / to focus search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== q) {
      e.preventDefault();
      q.focus();
      q.select();
    }
  });

  // Clock
  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    clockTime && (clockTime.textContent = `${hh}:${mm}:${ss}`);
    const opts = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    clockDate && (clockDate.textContent = now.toLocaleDateString(undefined, opts));
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Weather (Open-Meteo, no API key)
  function weatherCodeToIcon(code) {
    // simplified mapping
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 99) return '🌩️';
    return '☁️';
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
      weatherIcon && (weatherIcon.textContent = weatherCodeToIcon(code));
      weatherLoc && (weatherLoc.textContent = `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`);
    } catch (err) {
      weatherCond && (weatherCond.textContent = 'Unable to load weather');
      weatherTemp && (weatherTemp.textContent = '--°C');
      weatherIcon && (weatherIcon.textContent = '❓');
      latestWeatherCode = null;
      console.warn('Weather error', err);
    }
  }

  function getAndFetchWeather() {
    if (!navigator.geolocation) {
      // fallback coordinates (Karachi)
      fetchWeather(24.86, 67.01);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(24.86, 67.01),
      { timeout: 5000 }
    );
  }

  // init
  getAndFetchWeather();

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
    let lastClickTime = 0;

    function updateGhostBot(e) {
      if (!isFollowing || isFalling) return;
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        ghostBot.style.opacity = '1';
      }
    }

    function animateGhostBot() {
      if (isFollowing && !isFalling) {
        // Smooth following with easing
        ghostX += (targetX - ghostX) * 0.15;
        ghostY += (targetY - ghostY) * 0.15;
      } else if (isFalling) {
        // Fall down with fear effect (slower)
        ghostY += 2; // slower fall speed
        // Add shaking effect
        ghostX += (Math.random() - 0.5) * 4;
        
        // Check if reached bottom (near bottom of viewport)
        if (ghostY > window.innerHeight - 50) {
          isFalling = false;
          ghostY = window.innerHeight - 50;
          ghostBot.classList.remove('ghost-bot--fear');
          ghostBot.classList.remove('ghost-bot--falling');
        }
      }
      
      // Position ghost bot centered on cursor (transform handles centering)
      ghostBot.style.left = `${ghostX}px`;
      ghostBot.style.top = `${ghostY}px`;
      
      requestAnimationFrame(animateGhostBot);
    }

    // Double-click handler
    ghostBot.addEventListener('dblclick', (e) => {
      e.preventDefault();
      const now = Date.now();
      
      // Check if at bottom (within 100px of bottom)
      const isAtBottom = ghostY > window.innerHeight - 100;
      
      if (isAtBottom && !isFollowing) {
        // Resume following cursor
        isFollowing = true;
        isFalling = false;
        ghostBot.classList.remove('ghost-bot--fear');
        ghostBot.classList.remove('ghost-bot--falling');
        targetX = e.clientX;
        targetY = e.clientY;
      } else if (!isFalling) {
        // Start fear effect and fall down
        isFollowing = false;
        isFalling = true;
        ghostBot.classList.add('ghost-bot--fear');
        ghostBot.classList.add('ghost-bot--falling');
      }
      
      lastClickTime = now;
    });

    window.addEventListener('mousemove', updateGhostBot);
    window.addEventListener('mouseleave', () => {
      if (isFollowing) {
        isVisible = false;
        ghostBot.style.opacity = '0';
      }
    });

    // Start animation loop
    animateGhostBot();
  }

})(); 
