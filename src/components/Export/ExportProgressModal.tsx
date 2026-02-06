import { Loader2 } from 'lucide-react';

interface ExportProgressModalProps {
    progress: number;
}

export function ExportProgressModal({ progress }: ExportProgressModalProps) {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 200, // Higher than dialog
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'white'
        }}>
            <div style={{ marginBottom: '24px' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: 'var(--text-accent)' }} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Exporting Video...</h2>
            <p style={{ color: '#888', marginBottom: '32px' }}>Please do not close this tab.</p>

            <div style={{ width: '400px', background: '#333', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                    width: `${progress}%`,
                    background: 'var(--text-accent)',
                    height: '100%',
                    transition: 'width 0.3s ease-out'
                }} />
            </div>

            <div style={{ marginTop: '12px', fontFamily: 'monospace', fontSize: '18px' }}>
                {progress.toFixed(0)}%
            </div>
        </div>
    );
}
