import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { isRainyWeather } from '../hooks/useWeather';

const GhostBot = forwardRef(function GhostBot({ weatherCode, gameMode, onHit }, ref) {
    const { settings } = useSettings();
    const botRef = useRef(null);
    const headRef = useRef(null);
    const leftPupilRef = useRef(null);
    const rightPupilRef = useRef(null);
    const posRef = useRef({ x: 0, y: 0 });
    const stateRef = useRef({ isFollowing: true, isFalling: false, isAtBottom: false, isVisible: false, speed: 0.15 });

    useImperativeHandle(ref, () => ({
        getPosition: () => posRef.current,
        triggerHit: () => {
            const bot = botRef.current;
            if (!bot) return;
            const s = stateRef.current;
            s.isFollowing = false;
            s.isFalling = true;
            bot.classList.add('ghost-bot--hit');
            setTimeout(() => bot.classList.remove('ghost-bot--hit'), 400);
            bot.classList.add('ghost-bot--fear', 'ghost-bot--falling');
            if (onHit) onHit();
        },
        respawn: () => {
            const bot = botRef.current;
            if (!bot) return;
            const s = stateRef.current;
            s.isFalling = false;
            s.isAtBottom = false;
            s.isFollowing = true;
            s.speed = Math.min(s.speed + 0.02, 0.4);
            posRef.current.x = Math.random() * (window.innerWidth - 100) + 50;
            posRef.current.y = Math.random() * (window.innerHeight / 2) + 50;
            bot.classList.remove('ghost-bot--fear', 'ghost-bot--falling');
            bot.style.opacity = '1';
        }
    }));

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

        let targetX = 0, targetY = 0;
        let animId;
        const pos = posRef.current;
        const state = stateRef.current;

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
            if (state.isFollowing && !state.isFalling) {
                if (gameMode) {
                    let moveX = 0, moveY = 0;
                    const dx = pos.x - targetX;
                    const dy = pos.y - targetY;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 200) {
                        moveX += (dx / (dist || 1)) * 4;
                        moveY += (dy / (dist || 1)) * 4;
                    }
                    const bullets = window.__gameBullets || [];
                    for (const b of bullets) {
                        const bdx = pos.x - b.x;
                        const bdy = pos.y - b.y;
                        const bdist = Math.hypot(bdx, bdy);
                        if (bdist < 120) {
                            const force = (120 - bdist) / 120 * 8;
                            moveX += (bdx / (bdist || 1)) * force;
                            moveY += (bdy / (bdist || 1)) * force;
                        }
                    }
                    if (moveX === 0 && moveY === 0) {
                        pos.x += (Math.random() - 0.5) * 2;
                        pos.y += (Math.random() - 0.5) * 2;
                    } else {
                        pos.x += moveX;
                        pos.y += moveY;
                    }
                    pos.x = Math.max(20, Math.min(window.innerWidth - 20, pos.x));
                    pos.y = Math.max(20, Math.min(window.innerHeight - 20, pos.y));
                } else {
                    pos.x += (targetX - pos.x) * state.speed;
                    pos.y += (targetY - pos.y) * state.speed;
                }
            } else if (state.isFalling) {
                pos.y += 3;
                pos.x += (Math.random() - 0.5) * 4;
                if (pos.y > window.innerHeight - 50) {
                    state.isFalling = false;
                    state.isAtBottom = true;
                    pos.y = window.innerHeight - 50;
                    bot.classList.remove('ghost-bot--fear', 'ghost-bot--falling');
                }
            }
            bot.style.left = `${pos.x}px`;
            bot.style.top = `${pos.y}px`;
            animId = requestAnimationFrame(animate);
        }

        function onMouseMove(e) {
            targetX = e.clientX;
            targetY = e.clientY;
            if (!state.isFollowing || state.isFalling) {
                if (state.isAtBottom && !state.isFalling) updatePupils(e.clientX, e.clientY);
                return;
            }
            if (!state.isVisible) {
                state.isVisible = true;
                bot.style.opacity = '1';
            }
        }

        function onDblClick(e) {
            if (gameMode) return;
            e.preventDefault();
            const botAtBottom = pos.y > window.innerHeight - 100;
            if (botAtBottom && !state.isFollowing) {
                state.isFollowing = true; state.isFalling = false; state.isAtBottom = false;
                bot.classList.remove('ghost-bot--fear', 'ghost-bot--falling');
                targetX = e.clientX; targetY = e.clientY;
                if (leftPupil) leftPupil.style.transform = 'translate(0,0)';
                if (rightPupil) rightPupil.style.transform = 'translate(0,0)';
            } else if (!state.isFalling) {
                state.isFollowing = false; state.isFalling = true;
                bot.classList.add('ghost-bot--fear', 'ghost-bot--falling');
            }
        }

        function onDocDblClick(e) {
            if (gameMode) return;
            if (!bot.classList.contains('click-through-enabled')) return;
            const rect = bot.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            if (Math.hypot(e.clientX - cx, e.clientY - cy) < Math.max(rect.width, 40)) {
                onDblClick(e);
            }
        }

        function onMouseLeave() {
            if (!gameMode && state.isFollowing) { state.isVisible = false; bot.style.opacity = '0'; }
            if (leftPupil) leftPupil.style.transform = 'translate(0,0)';
            if (rightPupil) rightPupil.style.transform = 'translate(0,0)';
        }

        if (gameMode) {
            if (!state.isVisible) {
                state.isVisible = true;
                state.isFollowing = true;
                state.isFalling = false;
                state.isAtBottom = false;
                pos.x = Math.random() * (window.innerWidth - 100) + 50;
                pos.y = Math.random() * (window.innerHeight / 2) + 100;
                bot.style.opacity = '1';
            }
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
    }, [gameMode]);

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
                <div className="ghost-helmet"></div>
                <div className="ghost-bot-face">
                    <div className="ghost-eye left"><div ref={leftPupilRef} className="ghost-pupil"></div></div>
                    <div className="ghost-eye right"><div ref={rightPupilRef} className="ghost-pupil"></div></div>
                </div>
            </div>
        </div>
    );
});

export default GhostBot;
