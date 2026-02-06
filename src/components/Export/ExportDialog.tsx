import { useState } from 'react';
import { X, Video, Monitor, Film, Smartphone } from 'lucide-react';
import type { ExportQuality } from '../../services/FFmpegService';

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (quality: ExportQuality) => void;
}

export function ExportDialog({ isOpen, onClose, onConfirm }: ExportDialogProps) {
    const [quality, setQuality] = useState<ExportQuality>('1080p');

    if (!isOpen) return null;

    const options: { id: ExportQuality; label: string; desc: string; icon: any }[] = [
        { id: '4k', label: '4K Ultra HD', desc: 'Highest quality, larger file size (3840x2160)', icon: Monitor },
        { id: '1080p', label: 'Full HD (1080p)', desc: 'Standard professional quality (1920x1080)', icon: Video },
        { id: '720p', label: 'HD (720p)', desc: 'Faster export, smaller file size (1280x720)', icon: Film },
        { id: 'original', label: 'Original Quality', desc: 'Use source resolution (may crash with 4K)', icon: Smartphone },
    ];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
        }}>
            <div style={{
                background: '#1a1a1a',
                width: '450px',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #333',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Export Video</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {options.map((opt) => (
                        <div
                            key={opt.id}
                            onClick={() => setQuality(opt.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: quality === opt.id ? 'rgba(255,255,255,0.1)' : '#252525',
                                border: quality === opt.id ? '1px solid var(--text-accent)' : '1px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                color: quality === opt.id ? 'var(--text-accent)' : '#666',
                                background: quality === opt.id ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                                padding: '8px',
                                borderRadius: '6px'
                            }}>
                                <opt.icon size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 500, color: quality === opt.id ? 'white' : '#ccc' }}>{opt.label}</div>
                                <div style={{ fontSize: '12px', color: '#888' }}>{opt.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        style={{ padding: '8px 16px' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(quality)}
                        className="btn-primary"
                        style={{ padding: '8px 24px' }}
                    >
                        Export Video
                    </button>
                </div>
            </div>
        </div>
    );
}
