import React, { useRef, useEffect } from 'react';

interface TimeRulerProps {
    duration: number;
    pixelsPerSecond: number;
    height?: number;
    currentTime?: number; // Optional/unused for internal draw, but kept for interface compatibility if needed
    onScrub: (time: number) => void;
}

export const TimeRuler: React.FC<TimeRulerProps> = ({
    duration,
    pixelsPerSecond,
    height = 24,
    // currentTime, 
    onScrub
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Format time helper: MM:SS:ff
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        // const ms = Math.floor((seconds % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // DPI Scale
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(duration * pixelsPerSecond, canvas.parentElement?.clientWidth || 0);

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Styles
        ctx.fillStyle = '#1e1e1e'; // Background matching timeline
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#888';
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left';

        // Ticks
        // Determine step based on zoom
        // if pps = 50 (default), 1s = 50px. Good.
        // if pps = 10 (zoom out), 1s = 10px. Too crowded. Show every 5s or 10s.
        // if pps = 200 (zoom in), 1s = 200px. Show every 0.1s or 0.5s?

        let timeStep = 1;
        if (pixelsPerSecond < 20) timeStep = 5;
        if (pixelsPerSecond < 5) timeStep = 10;
        if (pixelsPerSecond > 100) timeStep = 0.5;
        if (pixelsPerSecond > 200) timeStep = 0.1;

        // Draw ticks
        for (let t = 0; t <= duration + (canvas.parentElement?.clientWidth || 0) / pixelsPerSecond; t += timeStep) {
            const x = t * pixelsPerSecond;
            if (x > width) break;

            const isMajor = Math.abs(t % 1) < 0.001 || (timeStep >= 1 && t % 5 === 0);
            const tickHeight = isMajor ? height * 0.5 : height * 0.25;

            ctx.beginPath();
            ctx.moveTo(x, height);
            ctx.lineTo(x, height - tickHeight);
            ctx.stroke();

            // Labels for major ticks
            if (isMajor && pixelsPerSecond > 30 || (t % 5 === 0 && pixelsPerSecond <= 30)) {
                // Determine precision
                let label = formatTime(t);
                if (timeStep < 1) label += `.${Math.round((t % 1) * 10)}`;
                ctx.fillText(label, x + 4, height - tickHeight + 8);
            }
        }

    }, [duration, pixelsPerSecond, height]);

    const handleClick = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = x / pixelsPerSecond;
        onScrub(time);
    };

    return (
        <canvas
            ref={canvasRef}
            className="time-ruler"
            onClick={handleClick}
            style={{ display: 'block', cursor: 'pointer' }}
        />
    );
};
