import { useState, useEffect, useRef, useCallback } from 'react';

export default function GhostBotGame({ botRef, gameMode, setGameMode }) {
    const [score, setScore] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [bullets, setBullets] = useState([]);
    const bulletIdRef = useRef(0);
    const collapseTimerRef = useRef(null);

    useEffect(() => {
        if (expanded && !gameMode) {
            collapseTimerRef.current = setTimeout(() => setExpanded(false), 3000);
        }
        return () => clearTimeout(collapseTimerRef.current);
    }, [expanded, gameMode]);

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
        if (e.target.closest('.game-toggle-wrapper')) return;
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

    const toggleGame = () => {
        if (gameMode) {
            setGameMode(false);
            setScore(0);
            setBullets([]);
        } else {
            setGameMode(true);
        }
    };

    const handleArrowClick = (e) => {
        e.stopPropagation();
        setExpanded(prev => !prev);
        clearTimeout(collapseTimerRef.current);
    };

    const handleGameClick = (e) => {
        e.stopPropagation();
        toggleGame();
        clearTimeout(collapseTimerRef.current);
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

            <div className={`game-toggle-wrapper ${expanded ? 'expanded' : ''}`}>
                <button className="game-toggle-arrow" onClick={handleArrowClick} title="Game">
                    <span className="material-icons" style={{ fontSize: '16px' }}>
                        {expanded ? 'chevron_right' : 'chevron_left'}
                    </span>
                </button>
                <button
                    className={`game-toggle-btn ${gameMode ? 'active' : ''}`}
                    onClick={handleGameClick}
                >
                    🎮 {gameMode ? 'Stop' : 'Game'}
                </button>
            </div>
        </>
    );
}
