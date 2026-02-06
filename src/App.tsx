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
import type { TimelineItem } from './components/Timeline/Timeline';
import { SettingsDialog } from './components/Settings/SettingsDialog';
import { Plus } from 'lucide-react';

interface ClipWithData extends Clip {
  analysis?: AudioAnalysisResult;
}

function App() {
  const [clips, setClips] = useState<ClipWithData[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>();
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);

  //   const { analyze, isAnalyzing, error } = useAudioAnalysis();
  const { analyze, isAnalyzing, error } = useAudioAnalysis();
  const { exportVideo, isExporting, progress: exportProgress } = useExport();
  const [currentTime, setCurrentTime] = useState(0);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [silenceOptions, setSilenceOptions] = useState<SilenceOptions>({
    thresholdDb: -40,
    minDuration: 0.5,
    safetyMargin: 0.1
  });

  useEffect(() => {
    // Revoke old URL - this effect is no longer needed as videoUrl is removed
    return () => {
      // if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, []);

  useEffect(() => {
    // Legacy effect removed
  }, [selectedClipId, clips]);

  const [viewMode, setViewMode] = useState<'SOURCE' | 'PROJECT'>('PROJECT');
  const [sourceTime, setSourceTime] = useState(0);

  // Derived state for Source Mode
  const selectedClip = clips.find(c => c.id === selectedClipId);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClip && viewMode === 'SOURCE') {
      const url = URL.createObjectURL(selectedClip.file);
      setSourceUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setSourceUrl(null);
    }
  }, [selectedClip, viewMode]);


  // Preview Logic: Find which clip is active at currentTime (PROJECT MODE)
  const [projectItemUrl, setProjectItemUrl] = useState<string | null>(null);
  const [projectItemTime, setProjectItemTime] = useState(0); // Local time within the timeline clip

  const getCurrentTimelineItemRaw = () => {
    let offset = 0;
    for (const item of timelineItems) {
      if (currentTime >= offset && currentTime < offset + item.duration) {
        return { item, offset };
      }
      offset += item.duration;
    }
    return null;
  };

  const currentItemInfo = getCurrentTimelineItemRaw();

  // Manage Project URL
  useEffect(() => {
    if (currentItemInfo && viewMode === 'PROJECT') {
      const url = URL.createObjectURL(currentItemInfo.item.file);
      setProjectItemUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setProjectItemUrl(null);
    }
  }, [currentItemInfo?.item.id, viewMode]);

  // Sync Project Local Time
  useEffect(() => {
    if (currentItemInfo) {
      setProjectItemTime(currentTime - currentItemInfo.offset);
    }
  }, [currentTime, currentItemInfo]);


  // Unify Preview Source
  const activeUrl = viewMode === 'SOURCE' ? sourceUrl : projectItemUrl;
  const activeTime = viewMode === 'SOURCE' ? sourceTime : projectItemTime;

  const handleTimeUpdate = (t: number) => {
    if (viewMode === 'SOURCE') {
      setSourceTime(t);
    } else {
      // Project Mode logic
      if (currentItemInfo) {
        const global = currentItemInfo.offset + t;
        setCurrentTime(global);

        // Skip Logic (Global)
        const silences = currentItemInfo.item.silences;
        for (const s of silences) {
          if (t >= s.start && t < s.end) {
            const newLocal = s.end + 0.05;
            setCurrentTime(currentItemInfo.offset + newLocal);
            break;
          }
        }
      }
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        resolve(0);
      }
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFilesDropped = async (files: File[]) => {
    const newClipPromises = files.map(async file => {
      const duration = await getVideoDuration(file);
      return {
        id: uuidv4(),
        file,
        duration
      };
    });

    const newClips = await Promise.all(newClipPromises);

    setClips(prev => [...prev, ...newClips]);
    // Auto select first of new clips if none selected and switch to source view
    if (!selectedClipId && newClips.length > 0) {
      setSelectedClipId(newClips[0].id);
      setViewMode('SOURCE');
    }
  };

  const handleRemoveClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
    if (selectedClipId === id) {
      setSelectedClipId(undefined);
      if (viewMode === 'SOURCE') setSourceUrl(null);
    }
  };

  const handleSelectClip = (id: string) => {
    setSelectedClipId(id);
    setViewMode('SOURCE');
    setSourceTime(0);
  };

  const handleAddToTimeline = () => {
    const newItems: TimelineItem[] = clips.map(clip => ({
      id: uuidv4(),
      clipId: clip.id,
      file: clip.file,
      peaks: [],
      silences: [],
      duration: clip.duration || 0
    }));
    setTimelineItems(prev => [...prev, ...newItems]);
    setViewMode('PROJECT'); // Switch to project view to see functionality
  };

  const handleAnalyzeProject = async () => {
    // Analyze all items in timeline
    // setTimelineItems(prev => [...prev]); // This line is not needed, state update will happen below

    const updatedItems = [...timelineItems];
    let hasUpdates = false;

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      if (item.peaks.length === 0) { // Not analyzed
        try {
          const result = await analyze(item.file, silenceOptions);
          updatedItems[i] = {
            ...item,
            peaks: result.peaks,
            silences: result.silences,
            duration: result.duration
          };
          hasUpdates = true;
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (hasUpdates) {
      setTimelineItems(updatedItems);
    }
  };

  /* Legacy single clip analyze - replaced by project analyze
  const handleAnalyze = async () => {
    // Legacy single clip analyze - Redirect to Project Analyze
    if (timelineItems.length > 0) {
      await handleAnalyzeProject();
    } else {
      alert("Add clips to timeline first");
    }
  };
  */

  /* Legacy handleExport - replaced by project export
  const handleExport = async () => {
    if (timelineItems.length === 0) return;

    // Check if analyzed
    if (timelineItems.some(i => i.duration === 0)) {
      alert("Some clips are not analyzed. Please Analyze Project first.");
      return;
    }

    // @ts-ignore
    await exportVideo(timelineItems);
  };
  */

  const handleExport = async () => {
    if (timelineItems.length === 0) return;

    // Check if analyzed
    if (timelineItems.some(i => i.duration === 0)) {
      alert("Some clips are not analyzed. Please Analyze Project first.");
      return;
    }

    await exportVideo(timelineItems);
  };

  const handleTimelineScrub = (time: number) => {
    setViewMode('PROJECT');
    setCurrentTime(time);
  };

  const sidebarContent = (
    <>
      <div style={{ marginBottom: '16px' }}>
        <DropZone onFilesDropped={handleFilesDropped} />
      </div>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
        <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAddToTimeline}>
          <Plus size={16} style={{ marginRight: 6 }} />
          Add All to Timeline
        </button>
      </div>
      <ClipList
        clips={clips}
        onRemoveClip={handleRemoveClip}
        onSelectClip={handleSelectClip}
        selectedClipId={selectedClipId}
      />
    </>
  );

  const previewContent = (
    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, height: '100%', width: '100%' }}>
      {activeUrl ? (
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {viewMode === 'SOURCE' && (
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>
              SOURCE PREVIEW
            </div>
          )}
          {viewMode === 'PROJECT' && (
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'var(--text-accent)', color: 'black', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 'bold' }}>
              PROJECT TIMELINE
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0 }}>
            <VideoPreview
              src={activeUrl}
              currentTime={activeTime}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>

          <div style={{ padding: '8px' }}>
            {viewMode === 'PROJECT' && (
              <>
                <button
                  onClick={handleAnalyzeProject}
                  disabled={isAnalyzing}
                  className="btn-primary"
                  style={{ margin: '0 auto', width: 'fit-content' }}
                >
                  {isAnalyzing ? 'Analyzing Project...' : 'Analyze Project Silences'}
                </button>
                {error && <div style={{ color: 'red' }}>{error}</div>}
                {isExporting && (
                  <div style={{ marginTop: 10, color: 'var(--text-accent)' }}>
                    Exporting Project... {exportProgress}%
                  </div>
                )}
              </>
            )}
            {viewMode === 'SOURCE' && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Original Clip Reference (Read-only)
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ margin: 'auto' }}>
          {timelineItems.length === 0 ? "Select a clip to preview or Add to Timeline" : "Move playhead to view clip"}
        </div>
      )}
    </div>
  );

  const timelineContent = (
    <Timeline
      items={timelineItems}
      currentTime={currentTime}
      onScrub={handleTimelineScrub}
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
