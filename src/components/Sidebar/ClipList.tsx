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
    selectedClipId?: string;
}

export const ClipList: React.FC<ClipListProps> = ({
    clips,
    onRemoveClip,
    onSelectClip,
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
                    <button
                        className="btn-remove"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveClip(clip.id);
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </li>
            ))}
        </ul>
    );
};
