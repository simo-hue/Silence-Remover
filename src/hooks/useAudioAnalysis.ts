import { useState, useCallback } from 'react';
import { audioService } from '../services/AudioAnalysisService';
import type { AudioAnalysisResult, SilenceOptions } from '../services/AudioAnalysisService';

interface UseAudioAnalysisReturn {
    analyze: (file: File, options?: Partial<SilenceOptions>) => Promise<AudioAnalysisResult>;
    isAnalyzing: boolean;
    error: string | null;
    progress: number; // 0-100 (if we can implement progress tracking later)
}

const DEFAULT_OPTIONS: SilenceOptions = {
    thresholdDb: -40,
    minDuration: 0.5, // seconds
    safetyMargin: 0.1 // seconds
};

export const useAudioAnalysis = (): UseAudioAnalysisReturn => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const analyze = useCallback(async (file: File, options: Partial<SilenceOptions> = {}) => {
        setIsAnalyzing(true);
        setError(null);
        setProgress(0); // Reset

        try {
            const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
            // Simulate progress or implement it in service if possible (decoding is one-shot usually)
            setProgress(10);

            const result = await audioService.analyzeVideoAudio(file, mergedOptions);

            setProgress(100);
            return result;
        } catch (err: any) {
            console.error('Audio Analysis Error:', err);
            setError(err.message || 'Failed to analyze audio.');
            throw err;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    return { analyze, isAnalyzing, error, progress };
};
