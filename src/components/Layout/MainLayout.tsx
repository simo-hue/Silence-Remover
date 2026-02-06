import React from 'react';
import './MainLayout.css';
import { Download, Scissors } from 'lucide-react';

interface MainLayoutProps {
    sidebarContent: React.ReactNode;
    previewContent: React.ReactNode;
    timelineContent: React.ReactNode;
    onExport?: () => void;
    // onOpenSettings?: () => void; // Removed
    onAnalyzeProject?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    sidebarContent,
    previewContent,
    timelineContent,
    onExport,
    // onOpenSettings,
    onAnalyzeProject
}) => {
    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo-area">
                    <Scissors className="logo-icon" size={24} />
                    <h1>Silence Remover</h1>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-primary"
                        onClick={onAnalyzeProject}
                        title="Analyze all clips on the timeline"
                        style={{ marginRight: '8px' }}
                    >
                        <span style={{ marginRight: '6px' }}>⚡</span>
                        Analyze Timeline
                    </button>
                    {/* Settings Button Removed */}
                    <button className="btn-primary" onClick={onExport}>
                        <Download size={18} />
                        <span>Export</span>
                    </button>
                </div>
            </header>

            <main className="main-content">
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <h2>Media Pool</h2>
                    </div>
                    <div className="sidebar-content">
                        {sidebarContent}
                    </div>
                </aside>

                <section className="preview-area">
                    {previewContent}
                </section>
            </main>

            <footer className="timeline-area">
                {timelineContent}
            </footer>
        </div>
    );
};
