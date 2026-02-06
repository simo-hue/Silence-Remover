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
