
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FilterSettings, ASPECT_RATIOS } from './types';
import { 
  applyPixellation, 
  applyDirectionalBlur, 
  getCoverDimensions, 
  applyAdjustments, 
  applyNoise 
} from './utils/canvasUtils';
import ControlPanel from './components/ControlPanel';

const App: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [settings, setSettings] = useState<FilterSettings>({
    exposure: 0,
    contrast: 0,
    saturation: 0,
    pixelSize: 20,
    blurDirection: 'none',
    blurRadius: 100,
    noiseEnabled: false,
    aspectRatio: 'square',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragCounter = useRef(0);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setImage(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const processImage = useCallback(() => {
    if (!image || !canvasRef.current) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const targetRatio = ASPECT_RATIOS[settings.aspectRatio];
    let canvasWidth = 1080;
    let canvasHeight = 1080;

    if (settings.aspectRatio === 'landscape') {
      canvasHeight = 1080 / targetRatio;
    } else if (settings.aspectRatio === 'portrait') {
      canvasWidth = 1080 * targetRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const { sourceX, sourceY, sourceWidth, sourceHeight } = getCoverDimensions(
      image.width,
      image.height,
      targetRatio
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvas.width, canvas.height
    );

    // Filter pipeline
    applyAdjustments(ctx, { 
      exposure: settings.exposure, 
      contrast: settings.contrast, 
      saturation: settings.saturation 
    });

    applyPixellation(ctx, canvas.width, canvas.height, settings.pixelSize);

    if (settings.blurDirection !== 'none') {
      applyDirectionalBlur(
        ctx,
        canvas.width,
        canvas.height,
        settings.blurRadius,
        settings.blurDirection as 'horizontal' | 'vertical'
      );
    }

    if (settings.noiseEnabled) {
      applyNoise(ctx, canvas.width, canvas.height);
    }

    setIsProcessing(false);
  }, [image, settings]);

  useEffect(() => {
    // Longer debounce for smoother interaction on heavy filters
    const timer = setTimeout(() => {
      processImage();
    }, 150);
    return () => clearTimeout(timer);
  }, [processImage]);

  const handleExport = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `pixel-blur-${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  return (
    <div 
      className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-slate-950 text-slate-100"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <ControlPanel 
        settings={settings} 
        onSettingsChange={(s) => setSettings(prev => ({ ...prev, ...s }))}
        onExport={handleExport}
        hasImage={!!image}
      />

      <main className="flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full" />
        </div>

        {image ? (
          <div className="relative w-full h-full flex items-center justify-center transition-transform duration-500">
            <div className={`max-w-full max-h-full shadow-2xl shadow-black border border-slate-800 rounded-xl overflow-hidden relative bg-slate-900 transition-all duration-300 ${isDragging ? 'scale-95 opacity-60' : 'scale-100 opacity-100'}`}>
              <canvas 
                ref={canvasRef} 
                className={`max-w-full max-h-[85vh] object-contain block transition-opacity duration-300 ${isProcessing ? 'opacity-70' : 'opacity-100'}`}
              />
              
              {isProcessing && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-10">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">Rendering</span>
                </div>
              )}

              <button 
                onClick={() => setImage(null)}
                className="absolute top-4 right-4 bg-slate-800/80 hover:bg-red-500 text-white p-2 rounded-lg transition-colors border border-white/5 z-10"
                title="Remove Image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <label 
              className={`group relative flex flex-col items-center justify-center w-full h-96 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all duration-500 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-500/10 scale-105' 
                  : 'border-slate-800 hover:border-slate-600 bg-slate-900/40'
              }`}
            >
              <div className="flex flex-col items-center justify-center p-8 text-center pointer-events-none">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 ${
                  isDragging ? 'bg-blue-600 scale-110 rotate-12' : 'bg-slate-800 group-hover:bg-slate-700'
                }`}>
                  <svg className={`w-10 h-10 transition-colors ${isDragging ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Drop it like it's hot</h2>
                <p className="text-slate-500 text-sm max-w-[240px]">Drag and drop your image anywhere or click to browse</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {isDragging && (
          <div className="fixed inset-0 bg-blue-600/20 backdrop-blur-sm z-50 pointer-events-none flex items-center justify-center">
             <div className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-xl shadow-2xl animate-bounce border border-blue-400">
                Drop Image to Start
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
