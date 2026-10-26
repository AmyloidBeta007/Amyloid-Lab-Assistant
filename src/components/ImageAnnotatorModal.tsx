import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Edit3, ArrowUpRight, Square, Circle, Type, RotateCcw, Download, Check, X, Sparkles, Trash2 } from 'lucide-react';
import { PaperImageAttachment } from '../types';

interface ImageAnnotatorModalProps {
  onClose: () => void;
  onSaveAttachment: (attachment: PaperImageAttachment) => void;
  paperTitle?: string;
}

type AnnotationTool = 'arrow' | 'rect' | 'circle' | 'pen' | 'text';

interface AnnotationItem {
  id: string;
  type: AnnotationTool;
  color: string;
  lineWidth: number;
  // coordinates
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  points?: Array<{ x: number; y: number }>;
  text?: string;
}

export const ImageAnnotatorModal: React.FC<ImageAnnotatorModalProps> = ({
  onClose,
  onSaveAttachment,
  paperTitle
}) => {
  // Source states: 'source_select' | 'camera_active' | 'annotating'
  const [stage, setStage] = useState<'source_select' | 'camera_active' | 'annotating'>('source_select');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState('Lab Figure / Gel Snapshot');
  const [imageNotes, setImageNotes] = useState('');

  // Camera stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Annotation Canvas states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<AnnotationTool>('arrow');
  const [strokeColor, setStrokeColor] = useState<string>('#ef4444'); // red default for lab marking
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [textInput, setTextInput] = useState('Target Band (480 bp)');

  // Annotation history
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<AnnotationItem | null>(null);

  // Background image ref
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  // Pre-loaded scientific captures for instant convenience
  const sampleLabImages = [
    {
      name: 'Agarose Gel 1.8% (PCR Bands)',
      url: '/src/assets/images/bio_lab_bench_hero_1792938142791.jpg'
    },
    {
      name: 'Fluorescence Confocal Z-Stack',
      url: '/src/assets/images/microscope_confocal_lens_1792938143735.jpg'
    },
    {
      name: 'Sequencing Flow Cell Microfluidics',
      url: '/src/assets/images/rna_seq_flow_visual_1792938142351.jpg'
    }
  ];

  // Start live camera
  const handleStartCamera = async () => {
    setCameraError(null);
    setStage('camera_active');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera access denied or not available';
      setCameraError(msg);
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 640;
    tempCanvas.height = video.videoHeight || 480;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
      setImageSrc(dataUrl);
      stopCamera();
      setStage('annotating');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Upload picture from store/files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        setImageSrc(ev.target.result);
        setImageTitle(file.name.replace(/\.[^/.]+$/, ''));
        setStage('annotating');
      }
    };
    reader.readAsDataURL(file);
  };

  // Choose preloaded sample
  const handleSelectSample = (sample: { name: string; url: string }) => {
    setImageSrc(sample.url);
    setImageTitle(sample.name);
    setStage('annotating');
  };

  // Load image onto canvas when imageSrc changes
  useEffect(() => {
    if (stage === 'annotating' && imageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      img.onload = () => {
        bgImgRef.current = img;
        redrawCanvas();
      };
    }
  }, [stage, imageSrc]);

  // Redraw canvas with background image + annotations
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !bgImgRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = bgImgRef.current;
    // Set canvas dimensions to fit image while capping max display width
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw background image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw all confirmed annotations
    const allItems = currentAnnotation ? [...annotations, currentAnnotation] : annotations;

    allItems.forEach(item => {
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.color;
      ctx.lineWidth = item.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (item.type === 'pen' && item.points && item.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(item.points[0].x, item.points[0].y);
        for (let i = 1; i < item.points.length; i++) {
          ctx.lineTo(item.points[i].x, item.points[i].y);
        }
        ctx.stroke();
      } else if (item.type === 'rect' && item.endX !== undefined && item.endY !== undefined) {
        ctx.beginPath();
        ctx.rect(item.startX, item.startY, item.endX - item.startX, item.endY - item.startY);
        ctx.stroke();
      } else if (item.type === 'circle' && item.endX !== undefined && item.endY !== undefined) {
        const radius = Math.hypot(item.endX - item.startX, item.endY - item.startY);
        ctx.beginPath();
        ctx.arc(item.startX, item.startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (item.type === 'arrow' && item.endX !== undefined && item.endY !== undefined) {
        // Draw line
        ctx.beginPath();
        ctx.moveTo(item.startX, item.startY);
        ctx.lineTo(item.endX, item.endY);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(item.endY - item.startY, item.endX - item.startX);
        const headlen = 16 * (item.lineWidth / 3);
        ctx.beginPath();
        ctx.moveTo(item.endX, item.endY);
        ctx.lineTo(item.endX - headlen * Math.cos(angle - Math.PI / 6), item.endY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(item.endX - headlen * Math.cos(angle + Math.PI / 6), item.endY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (item.type === 'text') {
        const fontSize = Math.max(14, item.lineWidth * 6);
        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
        // Draw dark background pill for readability
        const textMetrics = ctx.measureText(item.text || '');
        const pad = 4;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(item.startX - pad, item.startY - fontSize, textMetrics.width + pad * 2, fontSize + pad);

        ctx.fillStyle = item.color;
        ctx.fillText(item.text || '', item.startX, item.startY);
      }
    });
  };

  // Canvas Mouse Coordinates helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);

    if (tool === 'text') {
      const newTextAnnotation: AnnotationItem = {
        id: `ann-${Date.now()}`,
        type: 'text',
        color: strokeColor,
        lineWidth: strokeWidth,
        startX: x,
        startY: y,
        text: textInput
      };
      setAnnotations(prev => [...prev, newTextAnnotation]);
      setIsDrawing(false);
      return;
    }

    if (tool === 'pen') {
      setCurrentAnnotation({
        id: `ann-${Date.now()}`,
        type: 'pen',
        color: strokeColor,
        lineWidth: strokeWidth,
        startX: x,
        startY: y,
        points: [{ x, y }]
      });
    } else {
      setCurrentAnnotation({
        id: `ann-${Date.now()}`,
        type: tool,
        color: strokeColor,
        lineWidth: strokeWidth,
        startX: x,
        startY: y,
        endX: x,
        endY: y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;
    const { x, y } = getCanvasCoords(e);

    if (currentAnnotation.type === 'pen') {
      const updatedPoints = [...(currentAnnotation.points || []), { x, y }];
      setCurrentAnnotation({
        ...currentAnnotation,
        points: updatedPoints
      });
    } else {
      setCurrentAnnotation({
        ...currentAnnotation,
        endX: x,
        endY: y
      });
    }
    redrawCanvas();
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentAnnotation) {
      setAnnotations(prev => [...prev, currentAnnotation]);
      setCurrentAnnotation(null);
    }
  };

  const handleUndo = () => {
    setAnnotations(prev => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setAnnotations([]);
  };

  useEffect(() => {
    if (stage === 'annotating') {
      redrawCanvas();
    }
  }, [annotations, currentAnnotation]);

  // Export / Save
  const handleSaveToPaper = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const finalDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const newAttachment: PaperImageAttachment = {
      id: `img-${Date.now()}`,
      title: imageTitle.trim() || 'Annotated Figure',
      imageUrl: finalDataUrl,
      createdAt: new Date().toISOString().split('T')[0],
      notes: imageNotes.trim() || undefined,
      annotationsCount: annotations.length
    };
    onSaveAttachment(newAttachment);
    onClose();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${imageTitle.replace(/\s+/g, '_')}_annotated.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const colorPalette = [
    { label: 'Red / Flag', value: '#ef4444' },
    { label: 'Teal / Valid', value: '#0d9488' },
    { label: 'Laser Cyan', value: '#06b6d4' },
    { label: 'Amber / Caution', value: '#f59e0b' },
    { label: 'White / Contrast', value: '#ffffff' },
    { label: 'Violet', value: '#8b5cf6' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">
                Lab Image Capture & Annotation Studio
              </h2>
            </div>
            {paperTitle && (
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-lg">
                Attaching to: <span className="font-semibold text-slate-700">{paperTitle}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none p-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Stage 1: Choose Source */}
        {stage === 'source_select' && (
          <div className="space-y-6 py-4 flex-1 overflow-y-auto">
            <div className="text-center max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Choose Image Source</h3>
              <p className="text-xs text-slate-500">
                Snap a live photo of your bench gel, upload an image from your device storage, or use a sample capture.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Option A: Take Live Picture with Device Camera */}
              <button
                type="button"
                onClick={handleStartCamera}
                className="p-6 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/40 hover:bg-teal-50 hover:border-teal-500 transition-all text-center space-y-2 flex flex-col items-center justify-center group"
              >
                <div className="p-3 bg-teal-600 text-white rounded-full group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-900 text-sm">Take Live Picture</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Use device webcam or mobile camera to photograph gel transilluminator, colony plate, or microscope eyepiece.
                </p>
              </button>

              {/* Option B: Add Picture from Store/Device File */}
              <label className="p-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-400 transition-all text-center space-y-2 flex flex-col items-center justify-center cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="p-3 bg-slate-800 text-white rounded-full group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-900 text-sm">Add Picture from Store</div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload an existing gel photo, Bioanalyzer electropherogram, or confocal TIFF/PNG from your files.
                </p>
              </label>
            </div>

            {/* Option C: Pre-loaded scientific captures */}
            <div className="max-w-2xl mx-auto pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Or Use Preloaded Lab Captures:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {sampleLabImages.map(sample => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/30 transition-all text-left text-xs space-y-1.5 group"
                  >
                    <div className="h-20 w-full rounded overflow-hidden bg-slate-100">
                      <img
                        src={sample.url}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="font-semibold text-slate-800 line-clamp-1 block">
                      {sample.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stage 2: Camera Stream Active */}
        {stage === 'camera_active' && (
          <div className="space-y-4 py-2 flex-1 flex flex-col items-center justify-center">
            {cameraError ? (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs space-y-2 text-center max-w-md">
                <p className="font-bold">Camera Access Notice</p>
                <p>{cameraError}</p>
                <p className="text-slate-600">You can also upload an image directly from your local files or select a sample image.</p>
                <button
                  onClick={() => setStage('source_select')}
                  className="px-3 py-1 bg-slate-800 text-white rounded text-xs"
                >
                  Back to Image Sources
                </button>
              </div>
            ) : (
              <div className="space-y-3 w-full flex flex-col items-center">
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black max-w-xl w-full aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-red-600 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>Live Camera</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setStage('source_select');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    className="px-6 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Snapshot</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stage 3: Annotation Studio */}
        {stage === 'annotating' && (
          <div className="flex-1 flex flex-col overflow-hidden space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg shrink-0 text-xs">
              {/* Tool Selection */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTool('arrow')}
                  className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                    tool === 'arrow' ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Arrow: Point to target band or cell"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Arrow</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('rect')}
                  className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                    tool === 'rect' ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Box: Frame target ROI"
                >
                  <Square className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Box</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('circle')}
                  className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                    tool === 'circle' ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Circle: Highlight puncta"
                >
                  <Circle className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Circle</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('pen')}
                  className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                    tool === 'pen' ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Freehand Draw"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Draw</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTool('text')}
                  className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                    tool === 'text' ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Text Label"
                >
                  <Type className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Text</span>
                </button>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-1 bg-white p-1 rounded border border-slate-200">
                {colorPalette.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setStrokeColor(c.value)}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      strokeColor === c.value ? 'scale-125 ring-2 ring-slate-800' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value, border: c.value === '#ffffff' ? '1px solid #cbd5e1' : undefined }}
                    title={c.label}
                  />
                ))}
              </div>

              {/* Stroke Width */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500">Width:</span>
                {[2, 3, 5].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setStrokeWidth(w)}
                    className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                      strokeWidth === w ? 'bg-slate-800 text-white font-bold' : 'bg-white border border-slate-200'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>

              {/* Actions: Undo / Clear / Change Image */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={annotations.length === 0}
                  className="p-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded bg-white disabled:opacity-40"
                  title="Undo last annotation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={annotations.length === 0}
                  className="p-1 text-slate-600 hover:text-rose-600 border border-slate-200 rounded bg-white disabled:opacity-40"
                  title="Clear all annotations"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setStage('source_select')}
                  className="text-xs text-teal-700 hover:underline px-1 font-medium"
                >
                  Retake / Change
                </button>
              </div>
            </div>

            {/* Text label input when text tool is active */}
            {tool === 'text' && (
              <div className="flex items-center gap-2 p-2 bg-teal-50 border border-teal-200 rounded text-xs">
                <Type className="w-3.5 h-3.5 text-teal-700" />
                <span className="font-semibold text-teal-900 shrink-0">Label text:</span>
                <input
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="e.g. 480 bp Band, Knockout Lane 3, WT Negative Control..."
                  className="flex-1 px-2 py-1 bg-white border border-teal-300 rounded font-mono text-xs"
                />
                <span className="text-[11px] text-teal-700 italic">Click on canvas to place</span>
              </div>
            )}

            {/* Canvas Area */}
            <div className="flex-1 overflow-auto bg-slate-950 rounded-xl p-2 flex items-center justify-center border border-slate-800 min-h-[300px]">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="max-h-[500px] max-w-full object-contain cursor-crosshair shadow-lg rounded"
              />
            </div>

            {/* Bottom Meta & Save Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs shrink-0">
              <input
                type="text"
                value={imageTitle}
                onChange={e => setImageTitle(e.target.value)}
                placeholder="Figure title (e.g. Agarose Gel 1.8% Amplicon Validation)..."
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
              />
              <input
                type="text"
                value={imageNotes}
                onChange={e => setImageNotes(e.target.value)}
                placeholder="Notes / key takeaway (e.g. Sharp band at 480bp, lane 4)..."
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
                  title="Download annotated PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveToPaper}
                  className="px-4 py-1.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save to Dossier</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
