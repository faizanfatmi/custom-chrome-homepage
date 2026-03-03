import { useState, useEffect, useRef, useCallback } from 'react';

function loadPosition() {
    try {
        const saved = localStorage.getItem('gameConsoleBtnPos');
        if (saved) return JSON.parse(saved);
    } catch { }
    return { edge: 'right', percent: 50 };
}

export default function GhostBotGame({ botRef, gameMode, setGameMode }) {
    const [score, setScore] = useState(0);
    const [bullets, setBullets] = useState([]);
    const bulletIdRef = useRef(0);
    const [btnPos, setBtnPos] = useState(loadPosition);
    const [dragging, setDragging] = useState(false);
    const [dragPreview, setDragPreview] = useState(null);
    const longPressRef = useRef(null);
    const isDraggingRef = useRef(false);
    const btnRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('gameConsoleBtnPos', JSON.stringify(btnPos));
    }, [btnPos]);

    useEffect(() => {
        if (!gameMode) {
            window.__gameBullets = [];
            return;
        }
        const interval = setInterval(() => {
            setBullets(prev => {
                const updated = prev.map(b => ({
                    ...b,
                    x: b.x + b.vx * 8,
                    y: b.y + b.vy * 8,
                    life: b.life - 1
                })).filter(b => b.life > 0 && b.x > -20 && b.x < window.innerWidth + 20 && b.y > -20 && b.y < window.innerHeight + 20);

                const bot = botRef.current;
                if (!bot) { window.__gameBullets = updated; return updated; }
                const botPos = bot.getPosition();

                const remaining = [];
                let hitThisFrame = false;
                for (const b of updated) {
                    const dist = Math.hypot(b.x - botPos.x, b.y - botPos.y);
                    if (dist < 35 && !hitThisFrame) {
                        hitThisFrame = true;
                        bot.triggerHit();
                        setScore(s => s + 1);
                        setTimeout(() => {
                            if (botRef.current) botRef.current.respawn();
                        }, 2000);
                    } else {
                        remaining.push(b);
                    }
                }
                window.__gameBullets = remaining;
                return remaining;
            });
        }, 16);
        return () => { clearInterval(interval); window.__gameBullets = []; };
    }, [gameMode, botRef]);

    const handleShoot = useCallback((e) => {
        if (!gameMode) return;
        if (e.target.closest('.game-console-btn')) return;
        const bot = botRef.current;
        if (!bot) return;
        const botPos = bot.getPosition();
        const dx = botPos.x - e.clientX;
        const dy = botPos.y - e.clientY;
        const dist = Math.hypot(dx, dy);
        const vx = dx / (dist || 1);
        const vy = dy / (dist || 1);

        setBullets(prev => [...prev, {
            id: bulletIdRef.current++,
            x: e.clientX,
            y: e.clientY,
            vx, vy,
            life: 120
        }]);
    }, [gameMode, botRef]);

    useEffect(() => {
        if (!gameMode) return;
        window.addEventListener('click', handleShoot);
        document.body.classList.add('game-active');
        return () => {
            window.removeEventListener('click', handleShoot);
            document.body.classList.remove('game-active');
        };
    }, [gameMode, handleShoot]);

    const getNearestEdge = (x, y) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const distances = {
            top: y,
            bottom: h - y,
            left: x,
            right: w - x
        };
        let minEdge = 'right';
        let minDist = Infinity;
        for (const [edge, dist] of Object.entries(distances)) {
            if (dist < minDist) { minDist = dist; minEdge = edge; }
        }
        let percent;
        if (minEdge === 'top' || minEdge === 'bottom') {
            percent = Math.max(5, Math.min(95, (x / w) * 100));
        } else {
            percent = Math.max(5, Math.min(95, (y / h) * 100));
        }
        return { edge: minEdge, percent };
    };

    const handlePointerDown = (e) => {
        const startX = e.clientX;
        const startY = e.clientY;
        longPressRef.current = setTimeout(() => {
            isDraggingRef.current = true;
            setDragging(true);
            setDragPreview(getNearestEdge(startX, startY));
        }, 400);
    };

    const handlePointerMove = useCallback((e) => {
        if (!isDraggingRef.current) return;
        e.preventDefault();
        setDragPreview(getNearestEdge(e.clientX, e.clientY));
    }, []);

    const handlePointerUp = useCallback((e) => {
        clearTimeout(longPressRef.current);
        if (isDraggingRef.current) {
            e.stopPropagation();
            e.preventDefault();
            const final = getNearestEdge(e.clientX, e.clientY);
            setBtnPos(final);
            setDragging(false);
            setDragPreview(null);
            isDraggingRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (dragging) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
            return () => {
                window.removeEventListener('pointermove', handlePointerMove);
                window.removeEventListener('pointerup', handlePointerUp);
            };
        }
    }, [dragging, handlePointerMove, handlePointerUp]);

    const handleConsoleClick = (e) => {
        e.stopPropagation();
        if (isDraggingRef.current) return;
        if (gameMode) {
            setGameMode(false);
            setScore(0);
            setBullets([]);
        } else {
            setGameMode(true);
        }
    };

    const handlePointerLeave = () => {
        if (!isDraggingRef.current) clearTimeout(longPressRef.current);
    };

    const pos = dragPreview || btnPos;

    const getStyle = () => {
        const p = `${pos.percent}%`;
        switch (pos.edge) {
            case 'right':
                return { right: 0, top: p, transform: 'translateY(-50%)' };
            case 'left':
                return { left: 0, top: p, transform: 'translateY(-50%)' };
            case 'top':
                return { top: 0, left: p, transform: 'translateX(-50%)' };
            case 'bottom':
                return { bottom: 0, left: p, transform: 'translateX(-50%)' };
            default:
                return { right: 0, top: '50%', transform: 'translateY(-50%)' };
        }
    };

    return (
        <>
            {bullets.map(b => (
                <div key={b.id} className="game-bullet" style={{
                    left: `${b.x}px`,
                    top: `${b.y}px`
                }} />
            ))}

            {gameMode && (
                <div className="game-score">
                    <span className="game-score-icon">🎯</span>
                    <span className="game-score-value">{score}</span>
                </div>
            )}

            <button
                ref={btnRef}
                className={`game-console-btn edge-${pos.edge} ${gameMode ? 'active' : ''} ${dragging ? 'dragging' : ''}`}
                onClick={handleConsoleClick}
                onPointerDown={handlePointerDown}
                onPointerLeave={handlePointerLeave}
                title={gameMode ? 'Stop Game' : 'Play Game (hold to move)'}
                style={getStyle()}
            >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="console-icon">
                    <path d="M6 11H8V9H10V11H12V13H10V15H8V13H6V11Z" fill="currentColor" />
                    <circle cx="16" cy="10" r="1" fill="currentColor" />
                    <circle cx="18" cy="12" r="1" fill="currentColor" />
                    <path d="M17 4H7C4.24 4 2 6.24 2 9V15C2 17.76 4.24 20 7 20H17C19.76 20 22 17.76 22 15V9C22 6.24 19.76 4 17 4ZM20 15C20 16.65 18.65 18 17 18H7C5.35 18 4 16.65 4 15V9C4 7.35 5.35 6 7 6H17C18.65 6 20 7.35 20 9V15Z" fill="currentColor" />
                </svg>
            </button>
        </>
    );
}
