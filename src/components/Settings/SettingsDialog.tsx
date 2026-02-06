import React from 'react';
import { X } from 'lucide-react';
import type { SilenceOptions } from '../../services/AudioAnalysisService';
import './SettingsDialog.css';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    options: SilenceOptions;
    onChange: (newOptions: SilenceOptions) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen,
    onClose,
    options,
    onChange
}) => {
    if (!isOpen) return null;

    const handleChange = (key: keyof SilenceOptions, value: number) => {
        onChange({
            ...options,
            [key]: value
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Silence Detection Settings</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="control-group">
                        <div className="control-label">
                            <label>Silence Threshold</label>
                            <span className="value-display">{options.thresholdDb} dB</span>
                        </div>
                        <input
                            type="range"
                            min="-80"
                            max="-10"
                            step="1"
                            value={options.thresholdDb}
                            onChange={(e) => handleChange('thresholdDb', Number(e.target.value))}
                        />
                        <p className="help-text">Audio below this volume will be considered silence.</p>
                    </div>

                    <div className="control-group">
                        <div className="control-label">
                            <label>Minimum Duration</label>
                            <span className="value-display">{options.minDuration}s</span>
                        </div>
                        <input
                            type="range"
                            min="0.1"
                            max="5.0"
                            step="0.1"
                            value={options.minDuration}
                            onChange={(e) => handleChange('minDuration', Number(e.target.value))}
                        />
                        <p className="help-text">Silences shorter than this will be ignored.</p>
                    </div>

                    <div className="control-group">
                        <div className="control-label">
                            <label>Safety Margin</label>
                            <span className="value-display">{options.safetyMargin}s</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1.0"
                            step="0.05"
                            value={options.safetyMargin}
                            onChange={(e) => handleChange('safetyMargin', Number(e.target.value))}
                        />
                        <p className="help-text">Padding kept before and after speech to avoid abrupt cuts.</p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};
