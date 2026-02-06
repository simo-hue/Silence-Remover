import React from 'react';
import type { SilenceOptions } from '../../services/AudioAnalysisService';
import { Settings, RefreshCw } from 'lucide-react';

interface SilenceControlsProps {
    options: SilenceOptions;
    onChange: (options: SilenceOptions) => void;
    onApply: () => void;
    isAnalyzing: boolean;
}

export const SilenceControls: React.FC<SilenceControlsProps> = ({
    options,
    onChange,
    onApply,
    isAnalyzing
}) => {
    const handleChange = (key: keyof SilenceOptions, value: number) => {
        onChange({
            ...options,
            [key]: value
        });
    };

    return (
        <div style={{
            padding: '12px',
            background: '#2a2a2a',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #333'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#888', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <Settings size={12} />
                Silence Detection Settings
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Threshold */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                        <label>Threshold (dB)</label>
                        <span style={{ color: 'var(--text-accent)' }}>{options.thresholdDb} dB</span>
                    </div>
                    <input
                        type="range"
                        min="-80"
                        max="-10"
                        step="1"
                        value={options.thresholdDb}
                        onChange={(e) => handleChange('thresholdDb', Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--text-accent)' }}
                    />
                </div>

                {/* Min Duration */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                        <label>Min Duration (s)</label>
                        <span>{options.minDuration} s</span>
                    </div>
                    <input
                        type="number"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        value={options.minDuration}
                        onChange={(e) => handleChange('minDuration', Number(e.target.value))}
                        style={{
                            width: '100%',
                            background: '#1a1a1a',
                            border: '1px solid #444',
                            color: 'white',
                            padding: '4px',
                            borderRadius: '4px',
                            fontSize: '11px'
                        }}
                    />
                </div>

                {/* Safety Margin */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                        <label>Padding (s)</label>
                        <span>{options.safetyMargin} s</span>
                    </div>
                    <input
                        type="number"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={options.safetyMargin}
                        onChange={(e) => handleChange('safetyMargin', Number(e.target.value))}
                        style={{
                            width: '100%',
                            background: '#1a1a1a',
                            border: '1px solid #444',
                            color: 'white',
                            padding: '4px',
                            borderRadius: '4px',
                            fontSize: '11px'
                        }}
                    />
                </div>

                <button
                    className="btn-primary"
                    onClick={onApply}
                    disabled={isAnalyzing}
                    style={{ marginTop: '4px', fontSize: '12px', padding: '6px' }}
                >
                    <RefreshCw size={14} className={isAnalyzing ? "spin" : ""} style={{ marginRight: '6px' }} />
                    {isAnalyzing ? "Analyzing..." : "Re-Analyze Project"}
                </button>
            </div>
        </div>
    );
};
