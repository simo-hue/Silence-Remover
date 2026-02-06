import React, { useRef, useEffect, useState } from 'react';

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
    isBladeActive?: boolean;
    onRangeRemove?: (start: number, end: number) => void;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
    peaks,
    silences,
    duration,
    width,
    height,
    pixelsPerSecond,
    currentTime,
    onScrub,
    isBladeActive,
    onRangeRemove
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragEnd, setDragEnd] = useState<number | null>(null);

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

        if (peaks.length === 0) {
            // Render "Pending Analysis" State
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(0, 0, width, height);

            ctx.font = '14px Inter, sans-serif'; // Increased font size slightly
            ctx.fillStyle = '#888';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Draw a dashed center line
            ctx.strokeStyle = '#444';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw text centered only once to avoid overlap issues
            // If the clip is huge (e.g. > 2000px), we could repeat, but let's keep it simple and clean first.
            ctx.fillText("Analysis Pending - Click 'Analyze Project'", width / 2, centerY - 15);

        } else {
            // Draw Peaks
            ctx.fillStyle = '#4fc3f7';
            const peaksPerSec = peaks.length / duration;

            ctx.beginPath();
            for (let i = 0; i < peaks.length; i++) {
                const time = i / peaksPerSec;
                const x = time * pixelsPerSecond;
                if (x > width) break;

                const val = peaks[i];
                const barHeight = Math.max(2, val * (height * 0.8)); // Ensure at least 2px height

                // Draw centered bar
                ctx.fillRect(x, centerY - barHeight / 2, 2, barHeight);
            }

            // Draw Silences
            silences.forEach(s => {
                const x = s.start * pixelsPerSecond;
                const w = (s.end - s.start) * pixelsPerSecond;

                // Fill
                ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'; // stronger red
                ctx.fillRect(x, 0, w, height);

                // Border
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, 0, w, height);

                // Hatching pattern for "to be cut" look
                ctx.save();
                ctx.beginPath();
                ctx.rect(x, 0, w, height);
                ctx.clip();

                ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
                ctx.lineWidth = 2;
                const spacing = 10;
                for (let i = x - height; i < x + w; i += spacing) {
                    ctx.moveTo(i, height);
                    ctx.lineTo(i + height, 0);
                }
                ctx.stroke();
                ctx.restore();
            });
        }

        // Draw Playhead
        const playheadX = currentTime * pixelsPerSecond;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();

        // Draw Selection Overlay
        if (dragStart !== null && dragEnd !== null) {
            const startX = dragStart * pixelsPerSecond;
            const endX = dragEnd * pixelsPerSecond;
            const selX = Math.min(startX, endX);
            const selW = Math.abs(endX - startX);

            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(selX, 0, selW, height);

            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.strokeRect(selX, 0, selW, height);
        }

    }, [peaks, silences, duration, width, height, pixelsPerSecond, currentTime, dragStart, dragEnd]);

    const getLocalTime = (e: React.MouseEvent) => {
        if (!canvasRef.current) return 0;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        return Math.max(0, Math.min(duration, x / pixelsPerSecond));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isBladeActive) return;
        setDragStart(getLocalTime(e));
        setDragEnd(getLocalTime(e));
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isBladeActive || dragStart === null) return;
        setDragEnd(getLocalTime(e));
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isBladeActive) {
            // Normal Click for scrub
            if (onScrub) onScrub(getLocalTime(e));
            return;
        }

        if (dragStart !== null && dragEnd !== null && onRangeRemove) {
            const start = Math.min(dragStart, dragEnd);
            const end = Math.max(dragStart, dragEnd);

            if (end - start > 0.05) { // Min threshold
                onRangeRemove(start, end);
            } else {
                // Too small, treat as just a click (or ignore)
            }
        }
        setDragStart(null);
        setDragEnd(null);
    };

    return (
        <canvas
            ref={canvasRef}
            style={{ cursor: isBladeActive ? 'crosshair' : 'text' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { setDragStart(null); setDragEnd(null); }}
        />
    );
};
