import React, { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
    peaks: number[];
    silences: { start: number; end: number }[];
    duration: number;
    width: number;
    height: number;
    zoomLinesPerSecond?: number; // How many lines to draw per second of audio? No, zoom is pixels per second usually.
    // Let's us e pixelsPerSecond.
    pixelsPerSecond: number;
    currentTime: number;
    onScrub?: (time: number) => void;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
    peaks,
    silences,
    duration,
    width,
    height,
    pixelsPerSecond,
    currentTime,
    onScrub
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // We need to map time to x: x = time * pixelsPerSecond
    // And index in peaks to x.

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle high DPI
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // Clear
        ctx.fillStyle = '#181818'; // Timeline bg
        ctx.fillRect(0, 0, width, height);

        // Draw Grid (Seconds)
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        const secondStep = pixelsPerSecond < 20 ? 10 : 1; // Show every 10s if zoomed out
        for (let t = 0; t < duration; t += secondStep) {
            const x = t * pixelsPerSecond;
            if (x > width) break; // Should implement scroll offset logic if we want virtual scrolling, 
            // OR we assume 'width' passed is the TOTAL scrolling width? 
            // For MVP, let's assume 'width' is the viewport width and we render a 'scrollOffset'? 
            // OR we render the specific slice. 
            // Let's implement a 'scrollOffset' prop or for now assume the container handles scrolling 
            // and we render the whole giant canvas? 
            // Rendering giant canvas (e.g. 1 hour at 100px/s = 360,000px) crashes browsers.
            // So we MUST implement virtualization or view-window.
        }
        // RE-THINK: It is better to have the container scroll, and we just render the visible part?
        // OR we just make the canvas huge? 
        // Browsers limit canvas size (max ~16k-32k px). 
        // We should implement a "viewport" logic.
        // For this MVP, let's update the props to include `scrollOffset` (in seconds or pixels).

        // Actually simplicity first:
        // If the video is short (< 5 mins), a single canvas might work. 
        // But better: use CSS scroll on a container div, and set canvas width to full content width. 
        // Limitation: Canvas size limit. 
        // Solution: Resize Observer on container, only draw what's visible?
        // Let's stick effectively to "Draw what fits in width" + "start time offset"?
        // NO, simplest for React: 
        // Container `overflow-x: auto`. Canvas inside with `width: contentWidth`. 
        // Canvas renders EVERYTHING. 
        // Limit: Max width. 
        // Mitigation: If contentWidth > 32000, we might have issues.
        // For MVP, let's try the straightforward big canvas approach. If it breaks, I'll switch to virtualized.

        // Actually, to avoid complexity, let's try to assume the parent handles scroll, 
        // but pass `scrollLeft` to this component so it knows what to draw if we were optimizing.
        // BUT, `width` prop here likely implies the VISIBLE width if I was virtualizing.
        // Let's stick to the "Big Canvas" inside scrollable div for now, simple code.
        // If `contentWidth` is huge, we cap it or warn?

        // Drawing Logic
        const centerY = height / 2;
        // Draw Peaks
        ctx.fillStyle = '#4fc3f7';
        const peaksPerSec = peaks.length / duration;

        // Optimization: Only draw visible range if we knew scroll.
        // Since we don't passed scroll, draw all (or up to limit).

        ctx.beginPath();
        for (let i = 0; i < peaks.length; i++) {
            const time = i / peaksPerSec;
            const x = time * pixelsPerSecond;
            if (x > width) break; // If width is viewport width? 
            // Wait, if we use CSS scrolling, `width` passed here should be the TOTAL width.

            const val = peaks[i];
            const barHeight = val * (height * 0.8);

            // Draw centered bar
            ctx.fillRect(x, centerY - barHeight / 2, 2, barHeight); // 2px bar width hardcoded?
            // Better: calculated width based on pixelsPerSecond and peaksPerSec.
        }

        // Draw Silences
        ctx.fillStyle = 'rgba(239, 83, 80, 0.4)';
        silences.forEach(s => {
            const x = s.start * pixelsPerSecond;
            const w = (s.end - s.start) * pixelsPerSecond;
            ctx.fillRect(x, 0, w, height);
        });

        // Draw Playhead
        const playheadX = currentTime * pixelsPerSecond;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();

    }, [peaks, silences, duration, width, height, pixelsPerSecond, currentTime]);

    const handleClick = (e: React.MouseEvent) => {
        if (!onScrub || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = x / pixelsPerSecond;
        onScrub(time);
    };

    return (
        <canvas
            ref={canvasRef}
            style={{ cursor: 'text' }}
            onClick={handleClick}
        />
    );
};
