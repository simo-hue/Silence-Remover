import { useState } from 'react';
import { ffmpegService } from '../services/FFmpegService';
import type { Clip } from '../components/Sidebar/ClipList';
import type { AudioAnalysisResult } from '../services/AudioAnalysisService';

interface UseExportReturn {
    exportVideo: (clip: Clip & { analysis?: AudioAnalysisResult }, duration: number) => Promise<void>;
    isExporting: boolean;
    progress: number;
}

export const useExport = (): UseExportReturn => {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);

    const exportVideo = async (clip: Clip & { analysis?: AudioAnalysisResult }, duration: number) => {
        if (!clip.analysis) {
            alert('Please analyze the video first.');
            return;
        }

        setIsExporting(true);
        setProgress(0);

        try {
            const silences = clip.analysis.silences;
            // If no silences, maybe just copy? But assume we process anyway.

            const blob = await ffmpegService.exportVideo(
                clip.file,
                silences,
                duration,
                (ratio) => setProgress(Math.round(ratio * 100))
            );

            // Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `edited_${clip.file.name}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (e: any) {
            console.error(e);
            alert('Export failed: ' + e.message);
        } finally {
            setIsExporting(false);
        }
    };

    return { exportVideo, isExporting, progress };
};
