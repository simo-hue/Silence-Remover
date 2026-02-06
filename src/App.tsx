import { useState, useEffect } from 'react';
import './App.css';
import './components/Sidebar/SidebarTabs.css';
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

import { SilenceControls } from './components/Sidebar/SilenceControls';
import { Toaster, toast } from 'sonner';
import { ExportDialog } from './components/Export/ExportDialog';
import { ExportProgressModal } from './components/Export/ExportProgressModal';
import type { ExportQuality } from './services/FFmpegService';

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
  const [isPlaying, setIsPlaying] = useState(false);

  // const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Removed
  const [silenceOptions, setSilenceOptions] = useState<SilenceOptions>({
    thresholdDb: -40,
    minDuration: 0.5,
    safetyMargin: 0.1
  });

  const [activeSidebarTab, setActiveSidebarTab] = useState<'clips' | 'settings'>('clips');
  const [activeTool, setActiveTool] = useState<'select' | 'blade'>('select'); // New Tool State

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

  /* AUTOMATED IMPORT LOGIC */
  const handleFilesDropped = async (files: File[]) => {
    // 1. Calculate durations
    const newClipData = await Promise.all(files.map(async file => {
      const duration = await getVideoDuration(file);
      return {
        id: uuidv4(),
        file,
        duration
      };
    }));

    // 2. Add to Clip Pool (Sidebar)
    setClips(prev => [...prev, ...newClipData]);

    // 3. Automatically Create Timeline Items
    const newTimelineItems: TimelineItem[] = newClipData.map(clip => ({
      id: uuidv4(),
      clipId: clip.id,
      file: clip.file,
      peaks: [],
      silences: [],
      duration: clip.duration || 0
    }));

    // 4. Update Timeline State
    setTimelineItems(prev => [...prev, ...newTimelineItems]);

    // 5. Auto-select first new clip and Switch to Project View
    if (!selectedClipId && newClipData.length > 0) {
      setSelectedClipId(newClipData[0].id);
    }
    setViewMode('PROJECT');

    // 6. Trigger Analysis immediately
    performAnalysis(newTimelineItems);
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

  /* REMOVED: handleAddToTimeline - logic moved to handleFilesDropped */

  const performAnalysis = async (itemsToAnalyze: TimelineItem[], force: boolean = false) => {
    console.log("Starting analysis for items:", itemsToAnalyze.length, "Force:", force);
    const count = itemsToAnalyze.length;
    const toastId = toast.loading(`Starting analysis for ${count} clip${count > 1 ? 's' : ''}...`);

    let processed = 0;

    // We update state item by item to show progress
    for (const item of itemsToAnalyze) {
      if (!force && item.peaks.length > 0) {
        console.log("Skipping already analyzed item:", item.id);
        processed++;
        continue; // Already analyzed
      }

      console.log("Analyzing item:", item.id, item.file.name);
      try {
        const result = await analyze(item.file, silenceOptions);
        console.log("Analysis result for", item.id, result);

        const silenceCount = result.silences.length;
        toast.info(`Analyzed ${item.file.name}: Found ${silenceCount} silence segments`, {
          id: toastId // update existing? No, maybe stack them.
        });

        setTimelineItems(currentItems => {
          return currentItems.map(i => {
            if (i.id === item.id) {
              return {
                ...i,
                peaks: result.peaks,
                silences: result.silences,
                duration: result.duration
              };
            }
            return i;
          });
        });
        processed++;
      } catch (e: any) {
        console.error("Analysis failed for item", item.id, e);
        toast.error(`Failed to analyze ${item.file.name}: ${e.message}`);
      }
    }

    toast.success(`Analysis complete. Processed ${processed}/${count} clips.`, {
      id: toastId
    });
  };

  const handleAnalyzeProject = () => {
    console.log("Analyze Project Clicked");
    if (timelineItems.length === 0) {
      toast.error("No clips in timeline to analyze.");
      return;
    }
    performAnalysis(timelineItems);
  };

  const handleAnalyzeItem = (id: string) => {
    console.log("Analyze Item Clicked:", id);
    const item = timelineItems.find(i => i.id === id);
    if (!item) {
      toast.error("Clip not found.");
      return;
    }
    performAnalysis([item]);
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





  /* Playback Controls */
  const togglePlay = () => {
    setIsPlaying(p => !p);
  };

  const handleVideoEnded = () => {
    // Find current clip index from current timeline state
    if (!currentItemInfo) {
      setIsPlaying(false);
      return;
    }

    const currentIndex = timelineItems.findIndex(item => item.id === currentItemInfo.item.id);

    if (currentIndex !== -1 && currentIndex < timelineItems.length - 1) {
      // Move to next clip
      // Calculate start time of next item
      let nextStartTime = 0;
      for (let i = 0; i <= currentIndex; i++) {
        nextStartTime += timelineItems[i].duration;
      }
      // Jump to next clip + tiny offset to ensure we land inside it
      setCurrentTime(nextStartTime + 0.01);
    } else {
      // End of project
      setIsPlaying(false);
    }
  };

  /* New Export Flow */
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const handleExportClick = () => {
    if (timelineItems.length === 0) return;

    // Check if analyzed
    if (timelineItems.some(i => i.duration === 0)) {
      toast.error("Some clips are not analyzed. Please Analyze Project first.");
      return;
    }

    setIsExportDialogOpen(true);
  };

  const handleConfirmExport = async (quality: ExportQuality) => {
    setIsExportDialogOpen(false);
    // Add small delay to allow modal to close smoothly
    setTimeout(async () => {
      try {
        await exportVideo(timelineItems, { quality });
        toast.success("Export successful! 🎉", {
          description: "Your video is ready and downloading."
        });
      } catch (error) {
        toast.error("Export failed", {
          description: error instanceof Error ? error.message : "An unknown error occurred during export."
        });
      }
    }, 100);
  };

  const handleTimelineScrub = (time: number) => {
    setViewMode('PROJECT');
    setCurrentTime(time);
  };

  /* Blade Tool - Range Removal Logic */
  const handleTimelineRangeRemove = (itemId: string, start: number, end: number) => {
    setTimelineItems(currentItems => {
      const index = currentItems.findIndex(i => i.id === itemId);
      if (index === -1) return currentItems;

      const item = currentItems[index];

      // Validate range
      if (start >= end) return currentItems;
      const removeDuration = end - start;
      if (removeDuration < 0.1) {
        toast.warning("Selection too small to remove");
        return currentItems;
      }

      const newItemsList = [...currentItems];
      const createdItems: TimelineItem[] = [];

      // 1. Create Left Part (if start > 0.1)
      if (start > 0.1) {
        const splitIndex = Math.floor(item.peaks.length * (start / item.duration));
        const peaks1 = item.peaks.slice(0, splitIndex);

        const silences1: { start: number; end: number }[] = [];
        item.silences.forEach(s => {
          if (s.end <= start) {
            silences1.push(s);
          } else if (s.start < start) {
            // Silence is cut
            silences1.push({ start: s.start, end: start });
          }
        });

        createdItems.push({
          ...item,
          id: uuidv4(),
          peaks: peaks1,
          silences: silences1,
          duration: start
        });
      }

      // 2. Create Right Part (if end < duration - 0.1)
      if (end < item.duration - 0.1) {
        const splitIndex = Math.floor(item.peaks.length * (end / item.duration));
        const peaks2 = item.peaks.slice(splitIndex);

        const silences2: { start: number; end: number }[] = [];
        item.silences.forEach(s => {
          if (s.start >= end) {
            silences2.push({ start: s.start - end, end: s.end - end });
          } else if (s.end > end) {
            // Silence starts before end but finishes after
            silences2.push({ start: 0, end: s.end - end });
          }
        });

        createdItems.push({
          ...item,
          id: uuidv4(),
          peaks: peaks2,
          silences: silences2,
          duration: item.duration - end
        });
      }

      // Replace the original item with the new parts
      newItemsList.splice(index, 1, ...createdItems);

      toast.success("Range removed");
      return newItemsList;
    });
  };

  /* New handler for sidebar analyze button */
  const handleAnalyzeClipFromSidebar = (clipId: string) => {
    // Find all timeline items that use this clipId
    const itemsToAnalyze = timelineItems.filter(item => item.clipId === clipId);

    if (itemsToAnalyze.length === 0) {
      // Optional: Logic to add to timeline if not present could go here, 
      // but for now we just handle existing timeline items.
      toast.error("This clip is not on the timeline yet. Add it to the timeline to analyze.");
      return;
    }

    performAnalysis(itemsToAnalyze);
    // Switch to project view to see progress
    setViewMode('PROJECT');
  };

  /* Sidebar Content Construction */
  // ... inside App component (variable declared at top)

  const sidebarContent = (
    <>
      {/* Sidebar Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeSidebarTab === 'clips' ? 'active' : ''}`}
          onClick={() => setActiveSidebarTab('clips')}
        >
          Clips
        </button>
        <button
          className={`sidebar-tab ${activeSidebarTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSidebarTab('settings')}
        >
          Settings
        </button>
      </div>

      {activeSidebarTab === 'clips' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <DropZone onFilesDropped={handleFilesDropped} />
          </div>
          {/* Removed Add All to Timeline Button */}
          <ClipList
            clips={clips}
            onRemoveClip={handleRemoveClip}
            onSelectClip={handleSelectClip}
            onAnalyzeClip={handleAnalyzeClipFromSidebar}
            selectedClipId={selectedClipId}
          />
        </>
      )}

      {activeSidebarTab === 'settings' && (
        <div style={{ marginBottom: '10px' }}>
          <SilenceControls
            options={silenceOptions}
            onChange={setSilenceOptions}
            onApply={() => performAnalysis(timelineItems, true)}
            isAnalyzing={isAnalyzing}
          />
        </div>
      )}
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
              isPlaying={viewMode === 'PROJECT' ? isPlaying : false}
              onEnded={viewMode === 'PROJECT' ? handleVideoEnded : undefined}
            />
          </div>

          <div style={{ padding: '8px' }}>
            {viewMode === 'PROJECT' && (
              <>
                {/* Buttons moved to Header and Sidebar */}
                {error && <div style={{ color: 'red', marginTop: '4px' }}>{error}</div>}
                {isAnalyzing && (
                  <div style={{ marginTop: 10, color: 'var(--text-accent)' }}>
                    Analyzing...
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
      onAnalyzeItem={handleAnalyzeItem}
      isPlaying={isPlaying}
      onTogglePlay={togglePlay}
      activeTool={activeTool}
      onToolChange={setActiveTool}
      onRangeRemove={handleTimelineRangeRemove}
    />
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isExportDialogOpen) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExportDialogOpen]);

  return (
    <>
      <MainLayout
        sidebarContent={sidebarContent}
        previewContent={previewContent}
        timelineContent={timelineContent}
        onAnalyzeProject={handleAnalyzeProject}
        onExport={handleExportClick}
      />

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onConfirm={handleConfirmExport}
      />

      {isExporting && <ExportProgressModal progress={exportProgress} />}

      <Toaster position="bottom-right" theme="dark" />
    </>
  );
}

export default App;
