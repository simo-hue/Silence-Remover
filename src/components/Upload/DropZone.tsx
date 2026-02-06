import React, { useCallback, useState } from 'react';
import { Upload, FileVideo } from 'lucide-react';
import './DropZone.css';

interface DropZoneProps {
    onFilesDropped: (files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesDropped }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        // Convert FileList to array
        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('video/')
        );

        if (files.length > 0) {
            onFilesDropped(files);
        }
    }, [onFilesDropped]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).filter(file =>
                file.type.startsWith('video/')
            );
            if (files.length > 0) {
                onFilesDropped(files);
            }
        }
    }, [onFilesDropped]);

    return (
        <div
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
        >
            <input
                type="file"
                id="file-upload"
                multiple
                accept="video/*"
                onChange={handleFileInput}
                style={{ display: 'none' }}
            />
            <div className="drop-zone-content">
                <div className="icon-wrapper">
                    {isDragging ? <FileVideo size={48} /> : <Upload size={48} />}
                </div>
                <h3>{isDragging ? 'Drop videos here' : 'Drag & Drop videos'}</h3>
                <p>or click to browse</p>
            </div>
        </div>
    );
};
