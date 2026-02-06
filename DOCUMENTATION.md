# Documentation

### [2026-02-06]: Video Editor - Silence Remover Implementation
*   **Details**: Implemented a client-side web application to automatically remove silences from videos. 
    *   **Core Features**:
        *   Drag & Drop video upload.
        *   Automatic silence detection using Web Audio API (client-side).
        *   Timeline visualization with waveform and silence overlays.
        *   Video Preview with auto-skip functionality for silent segments.
        *   Export functionality using FFmpeg.wasm (cutting and concatenating segments).
*   **Tech Notes**:
    *   **Stack**: React + Vite + TypeScript + Vanilla CSS (using Variables).
    *   **Performance**: Optimized for Apple Silicon using `vite.config.ts` headers (`Cross-Origin-Embedder-Policy: require-corp`) to support `SharedArrayBuffer` and `ffmpeg.wasm`.
    *   **Architecture**: 
        *   `AudioAnalysisService`: Extracts audio buffer and detects silences (RMS-based).
        *   `FFmpegService`: Handles video trimming and concatenation in WASM.
        *   `Timeline`: Custom Canvas rendering for high-performance waveform visualization.
    *   **Dependencies**: `@ffmpeg/ffmpeg`, `@ffmpeg/util`, `lucide-react`.

- [2026-02-06]: Added Analysis Buttons
  - *Details*: Added separate buttons for "Analyze Clip" and "Analyze Timeline" in the preview control area.
  - *Tech Notes*: Modified `App.tsx` to include new buttons. "Analyze Clip" triggers `handleAnalyzeItem` for the active clip. "Analyze Timeline" triggers `handleAnalyzeProject`.

- [2026-02-06]: Refactored Analysis UI
  - *Details*: Moved "Analyze Timeline" button to the main Header and "Analyze Clip" button to the Sidebar (ClipList item).
  - *Tech Notes*: Removed analysis controls from `App.tsx` preview area. Added logic to `handleAnalyzeClipFromSidebar` to analyze matching timeline items from sidebar.

- [2026-02-06]: Implemented Analysis Engine
  - *Details*: Enhanced silence visualization in waveform with distinct red hatched pattern. Export logic verified to cut out identified silences.
  - *Tech Notes*: Updated `WaveformCanvas.tsx` drawing logic. Confirmed `FFmpegService.ts` handles silence removal via concat.

- [2026-02-06]: Improved User Feedback
  - *Details*: Integrated `sonner` for toast notifications. Now providing detailed feedback for analysis events (Start, Success, Error).
  - *Tech Notes*: Added `<Toaster />` to `App.tsx`. Implemented `toast` calls in `performAnalysis`.

- [2026-02-06]: Professional Timeline Redesign
  - *Details*: Major visual overhaul of the timeline. Added `TimeRuler`, professional status metrics (Total Duration, Clip Count), and refined the dark theme aesthetics.
  - *Tech Notes*: Created `TimeRuler.tsx`. Refactored `Timeline.tsx` layout. Updated `Timeline.css` variables.

- [2026-02-06]: Fix FFmpeg Core Loading
  - *Details*: Resolved "failed to import ffmpeg-core.js" error by installing `@ffmpeg/core` and refactoring `FFmpegService` to use local imports.
  - *Tech Notes*:
    - Installed `@ffmpeg/core@0.12.6`.
    - Updated `FFmpegService.ts` to import `coreURL` and `wasmURL` directly from `@ffmpeg/core` and `@ffmpeg/core/wasm`.
    - Updated `vite.config.ts` to exclude `@ffmpeg/core` from optimization.
    - Verified build successfully bundles `ffmpeg-core.wasm`.

- [2026-02-06]: Export UI - Quality & Progress
  - *Details*: Added a robust professional export flow.
  - *Features*:
    - **Export Dialog**: Allows choosing between 4K, 1080p, 720p, and Original quality.
    - **Progress Overlay**: Shows a visible progress bar during export to block interaction.
  - *Tech Notes*:
    - Created `ExportDialog.tsx` and `ExportProgressModal.tsx`.
    - Updated `FFmpegService.ts` to support dynamic scaling (`-vf scale=...`) and pixel format conversion (`yuv420p`).

- [2026-02-06]: Smoother Export Progress
  - *Details*: Implemented real-time granular progress tracking for exports.
  - *Tech Notes*:
    - Refactored `FFmpegService` to parse `time=HH:MM:SS.mm` logs from FFmpeg.
    - Progress is now calculated based on actual encoded duration vs total project duration, providing sub-second updates.

- [2026-02-06]: Playback Controls & Export Enhancements
  - *Details*: Implemented interactive playback controls (Play/Pause, seamless clip transitions) and granular export progress tracking.
  - *Tech Notes*:
    - **App.tsx**: Added `isPlaying` state and orchestration logic for clip transitions. Added Play/Pause button and Spacebar shortcut.
    - **VideoPreview**: Updated to support programmatic playback control via props.
    - **FFmpegService**: Enhanced with granular progress parsing and quality-based scaling.
    - **Export UI**: Added `ExportDialog` and `ExportProgressModal` components.

- [2026-02-06]: Blade Tool (Razor) Implementation
  - *Details*: Added professional timeline cutting functionality.
  - *Features*:
    - **Toolbar**: Added interactive toolbar with "Pointer" and "Scissors" (Blade) tools.
    - **Visual Feedback**: Custom cursor when Blade tool is active.
    - **Splitting**: Range Removal (Drag-to-Delete) functionality.
  - *Tech Notes*:
    - **App.tsx**: Implemented `handleTimelineRangeRemove` ripple delete logic.
    - **WaveformCanvas.tsx**: Implemented drag selection state and rendering.

- [2026-02-06]: Timeline Tools UI Refinement
  - *Details*: Refactored Timeline.css to remove duplicate style definitions and improved the visual design of the timeline tools. Grouped tools into segmented controls and centered playback buttons.
  - *Tech Notes*: Removed redundant .timeline-controls and .icon-btn classes. Added .tool-group for better visual hierarchy.
