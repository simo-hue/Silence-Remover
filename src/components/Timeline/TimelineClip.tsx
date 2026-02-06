import React from 'react';
import { WaveformCanvas } from './WaveformCanvas';
import './TimelineClip.css';

interface TimelineClipProps {
    id: string;
    peaks: number[];
    silences: { start: number; end: number }[];
    duration: number;
    pixelsPerSecond: number;
    globalCurrentTime: number;
    startTimeOffset: number;
    onScrub: (globalTime: number) => void;
    title: string;
    onAnalyze: () => void;
    activeTool: 'select' | 'blade';
    onRangeRemove: (start: number, end: number) => void;
}

export const TimelineClip: React.FC<TimelineClipProps> = ({
    peaks,
    silences,
    duration,
    pixelsPerSecond,
    globalCurrentTime,
    startTimeOffset,
    onScrub,
    onAnalyze,

    title,
    activeTool,
    onRangeRemove
}) => {
    const width = duration * pixelsPerSecond;

    // Calculate local current time relative to this clip
    // If globalTime is 15s and this clip starts at 10s, localTime is 5s.
    // If globalTime is 5s and this clip starts at 10s, localTime is -5s (not playing this clip).
    const localCurrentTime = globalCurrentTime - startTimeOffset;

    return (
        <div className="timeline-clip-wrapper" style={{ width: width }}>
            <div className="clip-header" title={title}>
                <span>{title}</span>
                {peaks.length === 0 && (
                    <button
                        className="tiny-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAnalyze();
                        }}
                    >
                        Analyze
                    </button>
                )}
            </div>
            <WaveformCanvas
                peaks={peaks}
                silences={silences}
                duration={duration}
                width={width}
                height={180} // Slightly less to fit header
                pixelsPerSecond={pixelsPerSecond}
                currentTime={localCurrentTime} // WaveformCanvas draws playhead if 0 <= t <= duration
                onScrub={(localTime) => {
                    onScrub(startTimeOffset + localTime);
                }}
                isBladeActive={activeTool === 'blade'}
                onRangeRemove={onRangeRemove}
            />
        </div>
    );
};
