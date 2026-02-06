import { useState, useEffect } from 'react';
import './App.css'; // Global CSS is enough for App often, or we can remove if using Layout CSS
import { MainLayout } from './components/Layout/MainLayout';
import { DropZone } from './components/Upload/DropZone';
import { VideoPreview } from './components/Preview/VideoPreview';
import { ClipList } from './components/Sidebar/ClipList';
import type { Clip } from './components/Sidebar/ClipList';
import { v4 as uuidv4 } from 'uuid';
import { useAudioAnalysis } from './hooks/useAudioAnalysis';
import { useExport } from './hooks/useExport';
import type { AudioAnalysisResult, SilenceOptions } from './services/AudioAnalysisService';
import { Timeline } from './components/Timeline/Timeline';
import { SettingsDialog } from './components/Settings/SettingsDialog';

// Extend Clip to store analysis data
interface ClipWithData extends Clip {
  analysis?: AudioAnalysisResult;
}

function App() {
  const [clips, setClips] = useState<ClipWithData[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>();
  const { analyze, isAnalyzing, error } = useAudioAnalysis();
  const { exportVideo, isExporting, progress: exportProgress } = useExport();
  const [currentTime, setCurrentTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [silenceOptions, setSilenceOptions] = useState<SilenceOptions>({
    thresholdDb: -40,
    minDuration: 0.5,
    safetyMargin: 0.1
  });

  useEffect(() => {
    // Revoke old URL
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, []);

  useEffect(() => {
    if (selectedClipId) {
      const clip = clips.find(c => c.id === selectedClipId);
      if (clip) {
        const url = URL.createObjectURL(clip.file);
        setVideoUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setCurrentTime(0);
      }
    } else {
      setVideoUrl(null);
    }
  }, [selectedClipId, clips]);

  const handleFilesDropped = (files: File[]) => {
    const newClips: ClipWithData[] = files.map(file => ({
      id: uuidv4(),
      file,
      // Duration and thumbnail will be populated later by logic
    }));

    setClips(prev => [...prev, ...newClips]);
    // Auto select first of new clips if none selected
    if (!selectedClipId && newClips.length > 0) {
      setSelectedClipId(newClips[0].id);
    }
  };

  const handleRemoveClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
    if (selectedClipId === id) {
      setSelectedClipId(undefined);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;

    try {
      const result = await analyze(clip.file, silenceOptions);
      setClips(prev => prev.map(c =>
        c.id === selectedClipId
          ? { ...c, analysis: result, duration: result.duration }
          : c
      ));
    } catch (e) {
      // Error handled in hook state usually, or log here
    }
  };

  const handleExport = async () => {
    if (!selectedClipId) {
      alert('Please select a clip to export.');
      return;
    }
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;

    if (!clip.analysis) {
      alert('Please analyze the silences before exporting.');
      return;
    }

    await exportVideo(clip, clip.duration || 0);
  };

  const selectedClip = clips.find(c => c.id === selectedClipId);

  const sidebarContent = (
    <>
      <div style={{ marginBottom: '16px' }}>
        <DropZone onFilesDropped={handleFilesDropped} />
      </div>
      <ClipList
        clips={clips}
        onRemoveClip={handleRemoveClip}
        onSelectClip={setSelectedClipId}
        selectedClipId={selectedClipId}
      />
    </>
  );

  const previewContent = (
    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, height: '100%', width: '100%' }}>
      {selectedClip && videoUrl ? (
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <VideoPreview
              src={videoUrl}
              currentTime={currentTime}
              onTimeUpdate={(t: number) => {
                setCurrentTime(t);
                // Skip Logic
                if (selectedClip.analysis?.silences) {
                  const silences = selectedClip.analysis.silences;
                  for (const s of silences) {
                    // If we are inside a silence, jump to end
                    if (t >= s.start && t < s.end) {
                      // We need a way to seek the video!
                      // We trigger a state update that the efficient VideoPreview effect catches?
                      // Yes, setting current time to s.end should trigger the effect in VideoPreview
                      setCurrentTime(s.end + 0.05); // + buffer
                      console.log('Skipped silence', s.start, '->', s.end);
                      break; // Only skip one at a time
                    }
                  }
                }
              }}
            />
          </div>

          <div style={{ padding: '8px' }}>
            {!selectedClip.analysis && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="btn-primary"
                style={{ margin: '0 auto', width: 'fit-content' }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Silences'}
              </button>
            )}
            {selectedClip.analysis && (
              <div style={{ color: 'green' }}>
                Found {selectedClip.analysis.silences.length} silent segments
              </div>
            )}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {isExporting && (
              <div style={{ marginTop: 10, color: 'var(--text-accent)' }}>
                Exporting... {exportProgress}%
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ margin: 'auto' }}>No clip selected</div>
      )}
    </div>
  );

  const timelineContent = (
    <Timeline
      duration={selectedClip?.duration || 0}
      peaks={selectedClip?.analysis?.peaks || []}
      silences={selectedClip?.analysis?.silences || []}
      currentTime={currentTime}
      onScrub={setCurrentTime}
    />
  );

  return (
    <>
      <MainLayout
        sidebarContent={sidebarContent}
        previewContent={previewContent}
        timelineContent={timelineContent}
        onExport={handleExport}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={silenceOptions}
        onChange={setSilenceOptions}
      />
    </>
  );
}

export default App;
