import React from 'react';
import { WaveformCanvas } from './WaveformCanvas';
import './TimelineClip.css';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    id,
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

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        width: width,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        boxShadow: isDragging ? '0 0 0 2px var(--accent-color)' : 'none',
    };

    const localCurrentTime = globalCurrentTime - startTimeOffset;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`timeline-clip-wrapper ${isDragging ? 'dragging' : ''}`}
            {...attributes}
        >
            <div className="clip-header" title={title} {...listeners}>
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
                height={120} // Slightly less to fit header
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
