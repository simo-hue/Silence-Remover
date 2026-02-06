import React, { useState, useRef } from 'react';
import { TimelineClip } from './TimelineClip';
import { ZoomIn, ZoomOut } from 'lucide-react';
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
}

export const Timeline: React.FC<TimelineProps> = ({
    items,
    currentTime,
    onScrub
}) => {
    const [pixelsPerSecond, setPixelsPerSecond] = useState(50); // Default Zoom
    const containerRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => setPixelsPerSecond(prev => Math.min(prev * 1.5, 500));
    const handleZoomOut = () => setPixelsPerSecond(prev => Math.max(prev / 1.5, 10));

    let currentOffset = 0;

    return (
        <div className="timeline-container">
            <div className="timeline-controls">
                <button className="icon-btn" onClick={handleZoomOut}><ZoomOut size={16} /></button>
                <div className="zoom-value">{Math.round(pixelsPerSecond)} px/s</div>
                <button className="icon-btn" onClick={handleZoomIn}><ZoomIn size={16} /></button>
                <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>
                    {items.length} Clips
                </div>
            </div>

            <div className="timeline-scroll-area" ref={containerRef}>
                <div className="timeline-tracks-container" style={{ display: 'flex', height: '100%' }}>
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
                                    title={item.file.name}
                                />
                            );
                        })
                    ) : (
                        <div className="timeline-placeholder">
                            Add clips to the timeline to begin editing
                        </div>
                    )}
                    {/* End Spacer */}
                    <div style={{ width: '200px', flexShrink: 0 }}></div>
                </div>
            </div>
        </div>
    );
};
