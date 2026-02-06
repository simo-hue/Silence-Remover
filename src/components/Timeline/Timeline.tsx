import React, { useState, useRef, useMemo } from 'react';
import { TimelineClip } from './TimelineClip';
import { TimeRuler } from './TimeRuler';
import { ZoomIn, ZoomOut, Clock, Film } from 'lucide-react'; // Added icons
import './Timeline.css';

export interface TimelineItem {
    id: string; // unique instance id
    clipId: string;
    file: File;
    peaks: number[];
    silences: { start: number; end: number }[];
    duration: number;
}

interface TimelineProps {
    items: TimelineItem[];
    currentTime: number;
    onScrub: (time: number) => void;
    onAnalyzeItem: (id: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
    items,
    currentTime,
    onScrub,
    onAnalyzeItem
}) => {
    const [pixelsPerSecond, setPixelsPerSecond] = useState(50); // Default Zoom
    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setPixelsPerSecond(prev => Math.min(prev * 1.5, 500));
    const handleZoomOut = () => setPixelsPerSecond(prev => Math.max(prev / 1.5, 10));

    // Calculate metrics
    const totalDuration = useMemo(() => items.reduce((acc, item) => acc + item.duration, 0), [items]);
    const clipCount = items.length;

    // Format Time Metrics
    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
    };

    let currentOffset = 0;

    return (
        <div className="timeline-container">
            {/* Toolbar / Status Bar Top */}
            <div className="timeline-controls">
                <div className="timeline-tools">
                    <button className="icon-btn" onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={16} /></button>
                    <div className="zoom-value">{Math.round(pixelsPerSecond)} px/s</div>
                    <button className="icon-btn" onClick={handleZoomIn} title="Zoom In"><ZoomIn size={16} /></button>
                </div>

                <div className="timeline-metrics">
                    <div className="metric-item" title="Total Duration">
                        <Clock size={14} />
                        <span>{formatDuration(totalDuration)}</span>
                    </div>
                    <div className="metric-separator"></div>
                    <div className="metric-item" title="Clip Count">
                        <Film size={14} />
                        <span>{clipCount} clips</span>
                    </div>
                </div>
            </div>

            {/* Scroll Area containing Ruler + Tracks */}
            <div className="timeline-scroll-area" ref={containerRef}>
                <div className="timeline-content-wrapper">
                    {/* Time Ruler */}
                    <div className="timeline-ruler-wrapper">
                        <TimeRuler
                            duration={Math.max(totalDuration, 60)} // Min 60s for ruler visuals
                            pixelsPerSecond={pixelsPerSecond}
                            currentTime={currentTime}
                            onScrub={onScrub}
                        />
                        {/* Global Playhead Indicator on Ruler */}
                        <div
                            className="timeline-playhead-marker"
                            style={{ left: currentTime * pixelsPerSecond }}
                        />
                    </div>

                    {/* Tracks */}
                    <div className="timeline-tracks-container">
                        {items.length > 0 ? (
                            items.map((item) => {
                                const start = currentOffset;
                                currentOffset += item.duration;

                                return (
                                    <TimelineClip
                                        key={item.id}
                                        id={item.id}
                                        peaks={item.peaks}
                                        silences={item.silences}
                                        duration={item.duration}
                                        pixelsPerSecond={pixelsPerSecond}
                                        globalCurrentTime={currentTime}
                                        startTimeOffset={start}
                                        onScrub={onScrub}
                                        onAnalyze={() => onAnalyzeItem(item.id)}
                                        title={item.file.name}
                                    />
                                );
                            })
                        ) : (
                            <div className="timeline-placeholder">
                                <div className="placeholder-content">
                                    <span>Drag clips here or click '+' to start editing</span>
                                </div>
                            </div>
                        )}
                        {/* End Spacer */}
                        <div style={{ width: '200px', flexShrink: 0 }}></div>

                        {/* Global Playhead Line across tracks */}
                        <div
                            className="timeline-playhead-line"
                            style={{ left: currentTime * pixelsPerSecond }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
