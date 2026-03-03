import { useEffect, useRef, useState } from 'react';

export default function MusicVisualizer() {
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animRef = useRef(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        function resize() {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }
        resize();
        window.addEventListener('resize', resize);

        function drawIdle() {
            const rect = canvas.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            ctx.clearRect(0, 0, w, h);

            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            const time = Date.now() / 2000;
            for (let x = 0; x <= w; x++) {
                const y = h / 2 + Math.sin(x * 0.02 + time) * 2 + Math.sin(x * 0.01 + time * 1.5) * 1;
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            animRef.current = requestAnimationFrame(drawIdle);
        }

        function drawActive() {
            if (!analyserRef.current) {
                drawIdle();
                return;
            }

            const analyser = analyserRef.current;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);

            const rect = canvas.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            ctx.clearRect(0, 0, w, h);

            ctx.beginPath();
            const sliceWidth = w / bufferLength;
            let x = 0;
            let hasSignal = false;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * h) / 2;
                if (Math.abs(v - 1.0) > 0.01) hasSignal = true;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }

            const gradient = ctx.createLinearGradient(0, 0, w, 0);
            gradient.addColorStop(0, 'rgba(200, 200, 210, 0.05)');
            gradient.addColorStop(0.3, 'rgba(220, 220, 230, 0.5)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
            gradient.addColorStop(0.7, 'rgba(220, 220, 230, 0.5)');
            gradient.addColorStop(1, 'rgba(200, 200, 210, 0.05)');

            ctx.strokeStyle = hasSignal ? gradient : 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = hasSignal ? 2 : 1.5;
            ctx.stroke();

            if (hasSignal) {
                ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
                ctx.shadowBlur = 8;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            animRef.current = requestAnimationFrame(drawActive);
        }

        if (isActive && analyserRef.current) {
            drawActive();
        } else {
            drawIdle();
        }

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [isActive]);

    const startAudio = async () => {
        try {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            sourceRef.current = source;
            setIsActive(true);
        } catch {
            setIsActive(false);
        }
    };

    const stopAudio = () => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
            analyserRef.current = null;
            sourceRef.current = null;
        }
        setIsActive(false);
    };

    const handleClick = () => {
        if (isActive) stopAudio();
        else startAudio();
    };

    useEffect(() => {
        return () => {
            if (audioContextRef.current) audioContextRef.current.close();
            cancelAnimationFrame(animRef.current);
        };
    }, []);

    return (
        <div className="music-visualizer" onClick={handleClick} title={isActive ? "Click to stop visualizer" : "Click to start music visualizer"}>
            <canvas ref={canvasRef} className="music-visualizer-canvas" />
            {!isActive && (
                <div className="music-visualizer-hint">
                    <span className="material-icons" style={{ fontSize: '14px' }}>music_note</span>
                </div>
            )}
        </div>
    );
}
