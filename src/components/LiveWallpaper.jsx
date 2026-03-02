import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';

// IndexedDB helpers
function openLiveWallpaperDB() {
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

function getLiveWallpaperVideo() {
    return openLiveWallpaperDB().then(db =>
        new Promise((resolve, reject) => {
            const tx = db.transaction('videos', 'readonly');
            const req = tx.objectStore('videos').get('customVideo');
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        })
    );
}

export default function LiveWallpaper() {
    const { settings } = useSettings();
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const animIdRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        function stop() {
            if (animIdRef.current) { cancelAnimationFrame(animIdRef.current); animIdRef.current = null; }
            canvas.classList.remove('active');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (video) { video.classList.remove('active'); video.pause(); video.removeAttribute('src'); video.load(); }
        }

        function startParticles() {
            const particles = [];
            for (let i = 0; i < 80; i++) {
                particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, r: Math.random() * 2.5 + 1, alpha: Math.random() * 0.5 + 0.2 });
            }
            function draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(p => {
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
                    if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(59, 130, 246, ${p.alpha})`; ctx.fill();
                });
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 120) {
                            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - dist / 120)})`; ctx.lineWidth = 0.8; ctx.stroke();
                        }
                    }
                }
                animIdRef.current = requestAnimationFrame(draw);
            }
            draw();
        }

        function startGradientWave() {
            let t = 0;
            function draw() {
                const w = canvas.width, h = canvas.height;
                ctx.clearRect(0, 0, w, h);
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    const amp = 40 + i * 15, yOff = h * 0.35 + i * (h * 0.12), freq = 0.003 + i * 0.001, speed = t * (0.8 + i * 0.3);
                    ctx.moveTo(0, yOff);
                    for (let x = 0; x <= w; x += 4) {
                        ctx.lineTo(x, yOff + Math.sin(x * freq + speed) * amp + Math.sin(x * freq * 1.5 + speed * 0.7) * (amp * 0.4));
                    }
                    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
                    const colors = [`rgba(59, 130, 246, ${0.08 + i * 0.03})`, `rgba(100, 116, 139, ${0.06 + i * 0.02})`, `rgba(96, 165, 250, ${0.04 + i * 0.015})`, `rgba(241, 245, 249, ${0.03 + i * 0.01})`];
                    ctx.fillStyle = colors[i]; ctx.fill();
                }
                t += 0.015;
                animIdRef.current = requestAnimationFrame(draw);
            }
            draw();
        }

        function startStarfield() {
            const stars = [];
            for (let i = 0; i < 250; i++) {
                stars.push({ x: Math.random() * canvas.width - canvas.width / 2, y: Math.random() * canvas.height - canvas.height / 2, z: Math.random() * canvas.width, pz: 0 });
            }
            function draw() {
                const w = canvas.width, h = canvas.height;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fillRect(0, 0, w, h);
                const cx = w / 2, cy = h / 2;
                stars.forEach(star => {
                    star.pz = star.z; star.z -= 2;
                    if (star.z <= 0) { star.x = Math.random() * w - cx; star.y = Math.random() * h - cy; star.z = w; star.pz = star.z; }
                    const sx = (star.x / star.z) * w * 0.4 + cx, sy = (star.y / star.z) * h * 0.4 + cy;
                    const px = (star.x / star.pz) * w * 0.4 + cx, py = (star.y / star.pz) * h * 0.4 + cy;
                    const size = Math.max(0, (1 - star.z / w) * 3), alpha = Math.max(0, (1 - star.z / w));
                    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy);
                    ctx.strokeStyle = `rgba(203, 213, 225, ${alpha * 0.7})`; ctx.lineWidth = size; ctx.stroke();
                    ctx.beginPath(); ctx.arc(sx, sy, size * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`; ctx.fill();
                });
                animIdRef.current = requestAnimationFrame(draw);
            }
            draw();
        }

        function loadCustomVideo() {
            if (!video) return;
            getLiveWallpaperVideo().then(blob => {
                if (blob) {
                    video.src = URL.createObjectURL(blob);
                    video.classList.add('active');
                    video.play().catch(() => { });
                    canvas.classList.remove('active');
                }
            }).catch(err => console.warn('Failed to load custom live wallpaper', err));
        }

        stop();
        const type = settings.liveWallpaper;
        if (type === 'none') { return () => { stop(); window.removeEventListener('resize', resize); }; }
        if (type === 'custom') { loadCustomVideo(); return () => { stop(); window.removeEventListener('resize', resize); }; }

        canvas.classList.add('active');
        resize();
        if (type === 'particles') startParticles();
        else if (type === 'gradient-wave') startGradientWave();
        else if (type === 'starfield') startStarfield();

        return () => { stop(); window.removeEventListener('resize', resize); };
    }, [settings.liveWallpaper]);

    return (
        <>
            <canvas ref={canvasRef} className="live-wallpaper-canvas" />
            <video ref={videoRef} className="live-wallpaper-video" muted loop playsInline />
        </>
    );
}
