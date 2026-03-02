import { useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { isRainyWeather } from '../hooks/useWeather';

export default function GhostBot({ weatherCode }) {
    const { settings } = useSettings();
    const botRef = useRef(null);
    const headRef = useRef(null);
    const leftPupilRef = useRef(null);
    const rightPupilRef = useRef(null);

    useEffect(() => {
        const bot = botRef.current;
        if (!bot) return;

        document.documentElement.style.setProperty('--ghost-bot-size', `${settings.ghostBotSize || 30}px`);

        if (settings.ghostBotClickThrough) {
            bot.classList.add('click-through-enabled');
        } else {
            bot.classList.remove('click-through-enabled');
        }
    }, [settings.ghostBotClickThrough, settings.ghostBotSize]);

    useEffect(() => {
        const bot = botRef.current;
        if (!bot) return;
        if (isRainyWeather(weatherCode)) {
            bot.classList.add('ghost-bot--rainy');
        } else {
            bot.classList.remove('ghost-bot--rainy');
        }
    }, [weatherCode]);

    useEffect(() => {
        const bot = botRef.current;
        const head = headRef.current;
        const leftPupil = leftPupilRef.current;
        const rightPupil = rightPupilRef.current;
        if (!bot) return;

        let ghostX = 0, ghostY = 0, targetX = 0, targetY = 0;
        let isVisible = false, isFollowing = true, isFalling = false, isAtBottom = false;
        let animId;

        function updateGhostBot(e) {
            if (!isFollowing || isFalling) return;
            targetX = e.clientX;
            targetY = e.clientY;
            if (!isVisible) {
                isVisible = true;
                bot.style.opacity = '1';
            }
        }

        function updatePupils(clientX, clientY) {
            if (!head || !leftPupil || !rightPupil) return;
            const rect = head.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = clientX - cx;
            const dy = clientY - cy;
            const dist = Math.hypot(dx, dy);
            const ratio = Math.min(dist / 100, 1);
            const nx = (dx / (dist || 1)) * ratio * 1.5;
            const ny = (dy / (dist || 1)) * ratio * 1.5;
            const t = `translate(${nx}px, ${ny}px)`;
            leftPupil.style.transform = t;
            rightPupil.style.transform = t;
        }

        function animate() {
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
                    bot.classList.remove('ghost-bot--fear', 'ghost-bot--falling');
                }
            }
            bot.style.left = `${ghostX}px`;
            bot.style.top = `${ghostY}px`;
            animId = requestAnimationFrame(animate);
        }

        function onMouseMove(e) {
            updateGhostBot(e);
            if (isAtBottom && !isFalling) updatePupils(e.clientX, e.clientY);
        }

        function onDblClick(e) {
            e.preventDefault();
            const botAtBottom = ghostY > window.innerHeight - 100;
            if (botAtBottom && !isFollowing) {
                isFollowing = true; isFalling = false; isAtBottom = false;
                bot.classList.remove('ghost-bot--fear', 'ghost-bot--falling');
                targetX = e.clientX; targetY = e.clientY;
                if (leftPupil) leftPupil.style.transform = 'translate(0,0)';
                if (rightPupil) rightPupil.style.transform = 'translate(0,0)';
            } else if (!isFalling) {
                isFollowing = false; isFalling = true;
                bot.classList.add('ghost-bot--fear', 'ghost-bot--falling');
            }
        }

        function onDocDblClick(e) {
            if (!bot.classList.contains('click-through-enabled')) return;
            const rect = bot.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            if (Math.hypot(e.clientX - cx, e.clientY - cy) < Math.max(rect.width, 40)) {
                onDblClick(e);
            }
        }

        function onMouseLeave() {
            if (isFollowing) { isVisible = false; bot.style.opacity = '0'; }
            if (leftPupil) leftPupil.style.transform = 'translate(0,0)';
            if (rightPupil) rightPupil.style.transform = 'translate(0,0)';
        }

        window.addEventListener('mousemove', onMouseMove);
        bot.addEventListener('dblclick', onDblClick);
        document.addEventListener('dblclick', onDocDblClick);
        window.addEventListener('mouseleave', onMouseLeave);
        animId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            bot.removeEventListener('dblclick', onDblClick);
            document.removeEventListener('dblclick', onDocDblClick);
            window.removeEventListener('mouseleave', onMouseLeave);
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <div ref={botRef} className="ghost-bot" aria-hidden="true">
            <div className="ghost-cloud">
                <div className="cloud-body"></div>
                <div className="rain-drops">
                    {[...Array(6)].map((_, i) => <div key={i} className="rain-drop"></div>)}
                </div>
            </div>
            <div className="ghost-umbrella">
                <div className="umbrella-canopy"></div>
                <div className="umbrella-handle"></div>
            </div>
            <div ref={headRef} className="ghost-bot-head">
                <div className="ghost-bot-face">
                    <div className="ghost-eye left"><div ref={leftPupilRef} className="ghost-pupil"></div></div>
                    <div className="ghost-eye right"><div ref={rightPupilRef} className="ghost-pupil"></div></div>
                </div>
            </div>
        </div>
    );
}
