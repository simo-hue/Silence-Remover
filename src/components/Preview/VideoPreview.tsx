import React, { useRef, useEffect } from 'react';

interface VideoPreviewProps {
    src: string;
    currentTime: number;
    onTimeUpdate: (time: number) => void;
    onDurationChange?: (duration: number) => void;
    isPlaying?: boolean;
    onEnded?: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
    src,
    currentTime,
    onTimeUpdate,
    onDurationChange,
    isPlaying = false,
    onEnded
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const isSeekingRef = useRef(false);

    // Sync external currentTime -> Video element
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Only sync if difference is significant to avoid fighting with the video's own playback progress
        if (Math.abs(video.currentTime - currentTime) > 0.2) {
            // We can add a check if we are "playing" vs "scrubbing", but usually
            // if the prop updates from outside while playing, it matches video time anyway.
            // If it deviates, it means a Seek happened.
            video.currentTime = currentTime;
        }
    }, [currentTime]);

    // Apply Play/Pause state
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Auto-play prevented:", error);
                });
            }
        } else {
            video.pause();
        }
    }, [isPlaying, src]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
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
                controls={false}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleDurationChange}
                onEnded={onEnded}
            />
        </div>
    );
};
