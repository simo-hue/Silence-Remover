import { useState } from 'react';
import { ffmpegService } from '../services/FFmpegService';
import type { ExportOptions } from '../services/FFmpegService';
import type { TimelineItem } from '../components/Timeline/Timeline';

interface UseExportReturn {
    exportVideo: (items: TimelineItem[], options: ExportOptions) => Promise<void>;
    isExporting: boolean;
    progress: number;
}

export const useExport = (): UseExportReturn => {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);

    const exportVideo = async (items: TimelineItem[], options: ExportOptions) => {
        setIsExporting(true);
        setProgress(0);

        try {
            const blob = await ffmpegService.exportProject(
                items,
                options,
                (ratio) => setProgress(Math.round(ratio * 100))
            );

            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'silent-editor-project.mp4';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Export failed", error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    };

    return { exportVideo, isExporting, progress };
};
