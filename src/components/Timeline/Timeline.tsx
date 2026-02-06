import React, { useState, useRef } from 'react';
import { WaveformCanvas } from './WaveformCanvas';
import { ZoomIn, ZoomOut } from 'lucide-react';
import './Timeline.css';

interface TimelineProps {
    duration: number;
    peaks: number[];
    silences: { start: number; end: number }[];
    currentTime: number;
    onScrub: (time: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
    duration,
    peaks,
    silences,
    currentTime,
    onScrub
}) => {
    const [pixelsPerSecond, setPixelsPerSecond] = useState(50); // Default Zoom
    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setPixelsPerSecond(prev => Math.min(prev * 1.5, 500));
    const handleZoomOut = () => setPixelsPerSecond(prev => Math.max(prev / 1.5, 10));

    const totalWidth = duration * pixelsPerSecond;
    // Safety cap for extremely long videos if simple canvas approach
    const safeWidth = Math.min(totalWidth, 32000);

    return (
        <div className="timeline-container">
            <div className="timeline-controls">
                <button className="icon-btn" onClick={handleZoomOut}><ZoomOut size={16} /></button>
                <div className="zoom-value">{Math.round(pixelsPerSecond)} px/s</div>
                <button className="icon-btn" onClick={handleZoomIn}><ZoomIn size={16} /></button>
            </div>

            <div className="timeline-scroll-area" ref={containerRef}>
                {duration > 0 ? (
                    <WaveformCanvas
                        peaks={peaks}
                        silences={silences}
                        duration={duration}
                        width={safeWidth}
                        height={200}
                        pixelsPerSecond={pixelsPerSecond}
                        currentTime={currentTime}
                        onScrub={onScrub}
                    />
                ) : (
                    <div className="timeline-placeholder">
                        Load a clip to view timeline
                    </div>
                )}
            </div>
        </div>
    );
};
