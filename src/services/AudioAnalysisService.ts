export interface AudioAnalysisResult {
    duration: number;
    sampleRate: number;
    peaks: number[]; // For waveform visualization (decimated)
    silences: { start: number; end: number }[];
}

export interface SilenceOptions {
    thresholdDb: number; // e.g. -40dB
    minDuration: number; // e.g. 0.5s
    safetyMargin: number; // e.g. 0.1s padding
}

export class AudioAnalysisService {
    private audioContext: AudioContext;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    async analyzeVideoAudio(file: File, options: SilenceOptions, onProgress?: (p: number) => void): Promise<AudioAnalysisResult> {
        onProgress?.(5); // Started
        const arrayBuffer = await file.arrayBuffer();
        onProgress?.(20); // Loaded
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        onProgress?.(40); // Decoded

        // 1. Generate Peaks for Waveform
        const peaks = this.getPeaks(audioBuffer, 100);
        onProgress?.(50);

        // 2. Detect Silences with async chunks to allow UI updates?
        // Ideally yes, but for now let's keep it sync for simplicity unless it freezes.
        // If we want progress we need to make detectSilenceSegments async or pass callback
        const silences = this.detectSilenceSegments(audioBuffer, options);
        onProgress?.(100);

        return {
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            peaks,
            silences
        };
    }

    // Simplified peak generation (max amplitude in chunk)
    private getPeaks(buffer: AudioBuffer, peaksByName: number = 2000): number[] {
        const channelData = buffer.getChannelData(0); // Analyze first channel
        const len = channelData.length;
        const peaks: number[] = [];

        // Calculate step based on desired total peaks (peaksByName arg)
        const step = Math.floor(len / peaksByName);

        for (let i = 0; i < len; i += step) {
            let max = 0;
            // Taking a small sample or just the value at i (if decimation is high, maybe RMS of the window?)
            // Let's take the absolute max in the window to not miss spikes.
            for (let j = 0; j < step && i + j < len; j++) {
                const val = Math.abs(channelData[i + j]);
                if (val > max) max = val;
            }
            peaks.push(max);
        }
        return peaks;
    }

    private detectSilenceSegments(buffer: AudioBuffer, options: SilenceOptions): { start: number; end: number }[] {
        console.log("Detecting silences with options:", options);
        const data = buffer.getChannelData(0);
        const sampleRate = buffer.sampleRate;

        const threshold = Math.pow(10, options.thresholdDb / 20); // Convert dB to amplitude
        console.log("Threshold amplitude:", threshold);

        const minSamples = options.minDuration * sampleRate;
        const marginSamples = options.safetyMargin * sampleRate;

        const silences: { start: number; end: number }[] = [];
        let isSilent = false;
        let silenceStart = 0;
        let i = 0;

        // Peak checking across the whole file
        let maxVal = 0;

        // We can iterate with a stride to speed up, but accuracy matters.
        // Optimization: check rms in blocks.
        const blockSize = 128;

        for (i = 0; i < data.length; i += blockSize) {
            // Calculate simplified RMS or just check if ANY sample exceeds threshold in block?
            // Checking max in block is safer to avoid declaring silence if there's a click.
            let maxInBlock = 0;
            for (let j = 0; j < blockSize && i + j < data.length; j++) {
                const v = Math.abs(data[i + j]);
                if (v > maxInBlock) maxInBlock = v;
                if (v > maxVal) maxVal = v;
            }

            if (maxInBlock < threshold) {
                if (!isSilent) {
                    isSilent = true;
                    silenceStart = i;
                }
            } else {
                if (isSilent) {
                    isSilent = false;
                    const durationFrames = i - silenceStart;
                    if (durationFrames >= minSamples) {
                        // Apply safety margin (shrink silence)
                        const actualStart = silenceStart + marginSamples;
                        const actualEnd = i - marginSamples;

                        if (actualEnd > actualStart) {
                            silences.push({
                                start: actualStart / sampleRate,
                                end: actualEnd / sampleRate
                            });
                        }
                    }
                }
            }
        }

        // Check tail
        if (isSilent) {
            const durationFrames = data.length - silenceStart;
            if (durationFrames >= minSamples) {
                const actualStart = silenceStart + marginSamples;
                const actualEnd = data.length - marginSamples;
                if (actualEnd > actualStart) {
                    silences.push({
                        start: actualStart / sampleRate,
                        end: actualEnd / sampleRate
                    });
                }
            }
        }

        console.log("Max amplitude found in file:", maxVal);
        console.log("Found silences:", silences.length, silences);

        return silences;
    }
}

export const audioService = new AudioAnalysisService();
