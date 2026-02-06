import React, { useRef, useEffect } from 'react';

interface VideoPreviewProps {
    src: string;
    currentTime: number;
    onTimeUpdate: (time: number) => void;
    onDurationChange?: (duration: number) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
    src,
    currentTime,
    onTimeUpdate,
    onDurationChange
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isSeekingRef = useRef(false);

    // Sync external currentTime -> Video element
    // Only if difference is significant to avoid stutter loop
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (Math.abs(video.currentTime - currentTime) > 0.2) {
            if (!isSeekingRef.current) {
                // If we are not currently dragging scrub, update video.
                // But scrub updates currentTime... 
                // We need to differentiate "Video Playing update" vs "User Drag Update"
                // Usually, if the prop changes significantly, we seek.
                video.currentTime = currentTime;
            }
        }
    }, [currentTime]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            // Avoid infinite loop if we round or if update is too frequent
            // Just pass it up. Parent decides if it pushes back down.
            onTimeUpdate(videoRef.current.currentTime);
        }
    };

    const handleDurationChange = () => {
        if (videoRef.current && onDurationChange) {
            onDurationChange(videoRef.current.duration);
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
                ref={videoRef}
                src={src}
                style={{ maxHeight: '100%', width: 'auto', height: 'auto', maxWidth: '100%' }}
                controls={false} // Custom controls or use browser controls? 
                // Design says: "Header: ... controls main". 
                // "Preview: Play/pause del progetto ... Navigazione tra le clip"
                // Let's enable default controls for now for easy testing, or minimal custom overlay.
                // We need Custom Controls for "Play Project" vs "Play Clip".
                // Let's stick to NO native controls and use our App buttons?
                // For MVP: native controls are easiest for Volume/Fullscreen.
                // But they might conflict with our custom play button if we have one.
                // Let's use simple clicks on video to toggle play.
                onClick={(e) => {
                    const v = e.currentTarget;
                    v.paused ? v.play() : v.pause();
                }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleDurationChange}
            />
        </div>
    );
};
