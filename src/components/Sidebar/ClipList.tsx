import React from 'react';
import { Film, Trash2 } from 'lucide-react';
import './ClipList.css';

export interface Clip {
    id: string;
    file: File;
    duration?: number;
    thumbnailUrl?: string;
}

interface ClipListProps {
    clips: Clip[];
    onRemoveClip: (id: string) => void;
    onSelectClip: (id: string) => void;
    onAnalyzeClip: (id: string) => void;
    selectedClipId?: string;
}

export const ClipList: React.FC<ClipListProps> = ({
    clips,
    onRemoveClip,
    onSelectClip,
    onAnalyzeClip,
    selectedClipId
}) => {
    if (clips.length === 0) {
        return (
            <div className="empty-clips">
                <p>No clips loaded</p>
            </div>
        );
    }

    return (
        <ul className="clip-list">
            {clips.map((clip) => (
                <li
                    key={clip.id}
                    className={`clip-item ${selectedClipId === clip.id ? 'selected' : ''}`}
                    onClick={() => onSelectClip(clip.id)}
                >
                    <div className="clip-thumbnail">
                        {clip.thumbnailUrl ? (
                            <img src={clip.thumbnailUrl} alt={clip.file.name} />
                        ) : (
                            <Film size={24} />
                        )}
                    </div>
                    <div className="clip-info">
                        <span className="clip-name">{clip.file.name}</span>
                        <span className="clip-duration">
                            {clip.duration ? `${clip.duration.toFixed(1)}s` : '--:--'}
                        </span>
                    </div>
                    <div className="clip-actions">
                        <button
                            className="btn-icon-small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAnalyzeClip(clip.id);
                            }}
                            title="Analyze this clip in timeline"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12h5l3 5 5-10 4 5h5" />
                            </svg>
                        </button>
                        <button
                            className="btn-remove"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveClip(clip.id);
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
};
