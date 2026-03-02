import { useEffect, useRef } from 'react';

export default function RippleEffect() {
    const canvasRef = useRef(null);
    const ripplesRef = useRef([]);
    const animIdRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const ripples = ripplesRef.current;
            for (let i = ripples.length - 1; i >= 0; i--) {
                const r = ripples[i];
                r.radius += r.speed;
                r.alpha -= 0.008;
                if (r.alpha <= 0 || r.radius >= r.maxRadius) { ripples.splice(i, 1); continue; }
                ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(59, 130, 246, ${r.alpha})`;
                ctx.lineWidth = r.lineWidth * (1 - r.radius / r.maxRadius) + 0.5;
                ctx.stroke();
                if (r.radius < r.maxRadius * 0.6) {
                    const grad = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.radius);
                    grad.addColorStop(0, `rgba(59, 130, 246, ${r.alpha * 0.08})`);
                    grad.addColorStop(0.7, `rgba(96, 165, 250, ${r.alpha * 0.04})`);
                    grad.addColorStop(1, 'transparent');
                    ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                    ctx.fillStyle = grad; ctx.fill();
                }
            }
            if (ripples.length > 0) {
                animIdRef.current = requestAnimationFrame(animate);
            } else {
                animIdRef.current = null;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        function handleClick(e) {
            if (e.target.closest('a, button, input, select, textarea, .card, .modal, .settings, .icon-btn, .recent-item, .pinned-item, .search')) return;
            const ripples = ripplesRef.current;
            ripples.push({ x: e.clientX, y: e.clientY, radius: 0, maxRadius: 280, alpha: 0.5, lineWidth: 3, speed: 4 });
            setTimeout(() => ripples.push({ x: e.clientX, y: e.clientY, radius: 0, maxRadius: 200, alpha: 0.3, lineWidth: 2, speed: 3 }), 80);
            setTimeout(() => ripples.push({ x: e.clientX, y: e.clientY, radius: 0, maxRadius: 140, alpha: 0.2, lineWidth: 1.5, speed: 2.5 }), 180);
            if (!animIdRef.current) animate();
        }

        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
            window.removeEventListener('resize', resize);
            if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />;
}
