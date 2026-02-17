
import React, { useState, useEffect, useCallback } from 'react';
import { FilterSettings, AspectRatio, BlurDirection } from '../types';

interface ControlPanelProps {
  settings: FilterSettings;
  onSettingsChange: (newSettings: Partial<FilterSettings>) => void;
  onExport: () => void;
  hasImage: boolean;
}

const Slider = ({ label, value, min, max, onChange, suffix = '' }: any) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync with prop if it changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setLocalValue(val);
    onChange(val);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
          {localValue}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={localValue}
        onChange={handleChange}
        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
};

const ControlPanel: React.FC<ControlPanelProps> = ({ settings, onSettingsChange, onExport, hasImage }) => {
  const [isAdjustmentsOpen, setIsAdjustmentsOpen] = useState(false);

  return (
    <div className="bg-slate-900 border-r border-slate-800 w-full md:w-80 h-full p-6 flex flex-col gap-6 overflow-y-auto z-20">
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-1">
          Pixel Blur Studio
        </h1>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          High-end image processing filters.
        </p>
      </div>

      <div className="space-y-6">
        {/* Collapsible Base Adjustments */}
        <section className="space-y-3">
          <button 
            onClick={() => setIsAdjustmentsOpen(!isAdjustmentsOpen)}
            className="flex items-center justify-between w-full text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 border-b border-slate-800 pb-2 group"
          >
            <span>1. Base Adjustments</span>
            <svg className={`w-3 h-3 transition-transform duration-300 ${isAdjustmentsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div className={`space-y-4 overflow-hidden transition-all duration-300 ${isAdjustmentsOpen ? 'max-h-64 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            <Slider label="Exposure" value={settings.exposure} min={-100} max={100} onChange={(v: number) => onSettingsChange({ exposure: v })} />
            <Slider label="Contrast" value={settings.contrast} min={-100} max={100} onChange={(v: number) => onSettingsChange({ contrast: v })} />
            <Slider label="Saturation" value={settings.saturation} min={-100} max={100} onChange={(v: number) => onSettingsChange({ saturation: v })} />
          </div>
        </section>

        {/* Pixellation */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 border-b border-slate-800 pb-2">2. Pixellate</h3>
          <Slider 
            label="Grid Scale" 
            value={settings.pixelSize} 
            min={1} max={100} 
            onChange={(v: number) => onSettingsChange({ pixelSize: v })}
            suffix="px"
          />
        </section>

        {/* Blur Direction */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 border-b border-slate-800 pb-2">3. Directional Blur</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['none', 'horizontal', 'vertical'] as BlurDirection[]).map((dir) => (
              <button
                key={dir}
                onClick={() => onSettingsChange({ blurDirection: dir })}
                className={`py-2 px-1 rounded-md text-[10px] font-bold uppercase transition-all border ${
                  settings.blurDirection === dir
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40'
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-750'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </section>

        {/* Finishing */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 border-b border-slate-800 pb-2">4. Finish</h3>
          <button
            onClick={() => onSettingsChange({ noiseEnabled: !settings.noiseEnabled })}
            className={`w-full py-2.5 px-3 rounded-md text-[10px] font-bold uppercase transition-all border flex items-center justify-between ${
              settings.noiseEnabled
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <span>Overlay Grain (4px)</span>
            <div className={`w-3 h-3 rounded-full ${settings.noiseEnabled ? 'bg-white shadow-[0_0_8px_white]' : 'bg-slate-700'}`} />
          </button>
        </section>

        {/* Format */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 border-b border-slate-800 pb-2">Canvas Format</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['square', 'landscape', 'portrait'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => onSettingsChange({ aspectRatio: ratio })}
                className={`flex flex-col items-center justify-center p-2 rounded-md text-[10px] font-bold uppercase transition-all border gap-1.5 ${
                  settings.aspectRatio === ratio
                    ? 'bg-slate-100 border-white text-slate-950 shadow-lg'
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-750'
                }`}
              >
                <div className={`border rounded-sm ${
                  ratio === 'square' ? 'w-4 h-4' : ratio === 'landscape' ? 'w-5 h-3' : 'w-3 h-5'
                } ${settings.aspectRatio === ratio ? 'border-slate-900' : 'border-slate-600'}`} />
                {ratio}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <button
          onClick={onExport}
          disabled={!hasImage}
          className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
            hasImage
              ? 'bg-white text-slate-950 hover:bg-blue-50 shadow-xl'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          Export JPG
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
