import { useState, useEffect, useRef, useCallback } from 'react';
import SingleDropZone from '../components/SingleDropZone';
import LoadingOverlay from '../components/LoadingOverlay';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const presets = [
  { id: 'horizontal', label: 'Horizontal', rotation: 0 },
  { id: 'diagonal-right', label: 'Diagonal Right', rotation: -45 },
  { id: 'diagonal-left', label: 'Diagonal Left', rotation: 45 },
  { id: 'vertical', label: 'Vertical', rotation: 90 },
];

export default function WatermarkPage() {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(null);
  const [watermarkedFile, setWatermarkedFile] = useState(null);
  
  // Watermark properties
  const [watermarkText, setWatermarkText] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(30);
  const [rotation, setRotation] = useState(0);
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1.2);
  
  const canvasRef = useRef(null);
  const watermarkRef = useRef(null);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);

  useEffect(() => {
    document.title = 'Watermark PDF – PhenomPDF';
  }, []);

  // Initialize watermark position when PDF loads
  useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setWatermarkPosition({
        x: rect.width / 2,
        y: rect.height / 2,
      });
    }
  }, [pdfDoc]);

  const handleFileAdded = useCallback((newFile) => {
    setFile(newFile);
    setWatermarkedFile(null);
    setError(null);
    setWatermarkText('');
    setCurrentPage(1);
    setTotalPages(0);
    setPdfDoc(null);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedarray = new Uint8Array(e.target.result);
        const doc = await pdfjsLib.getDocument(typedarray).promise;
        pdfDocRef.current = doc;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('PDF load error:', err);
        setError('Failed to load PDF. The file may be corrupted or password protected.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(newFile);
  }, []);

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    const page = await pdfDoc.getPage(currentPage);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
  }, [pdfDoc, renderPage]);

  // Watermark drag handlers
  const handleWatermarkMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleWatermarkMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;

    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    if (!clientX || !clientY) return;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    setWatermarkPosition(prev => ({
      x: Math.max(0, Math.min(prev.x + deltaX, containerRef.current.clientWidth - watermarkRef.current?.clientWidth || 100)),
      y: Math.max(0, Math.min(prev.y + deltaY, containerRef.current.clientHeight - watermarkRef.current?.clientHeight || 100)),
    }));

    setDragStart({ x: clientX, y: clientY });
  }, [isDragging, dragStart]);

  const handleWatermarkMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleWatermarkMouseMove);
      window.addEventListener('mouseup', handleWatermarkMouseUp);
      window.addEventListener('touchmove', handleWatermarkMouseMove, { passive: false });
      window.addEventListener('touchend', handleWatermarkMouseUp);
    } else {
      window.removeEventListener('mousemove', handleWatermarkMouseMove);
      window.removeEventListener('mouseup', handleWatermarkMouseUp);
      window.removeEventListener('touchmove', handleWatermarkMouseMove);
      window.removeEventListener('touchend', handleWatermarkMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWatermarkMouseMove);
      window.removeEventListener('mouseup', handleWatermarkMouseUp);
      window.removeEventListener('touchmove', handleWatermarkMouseMove);
      window.removeEventListener('touchend', handleWatermarkMouseUp);
    };
  }, [isDragging, handleWatermarkMouseMove]);

  const handlePresetClick = (presetRotation) => {
    setRotation(presetRotation);
  };

  const handleApplyWatermark = async () => {
    if (!file || !watermarkText.trim()) {
      setError('Please upload a PDF file and enter watermark text');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setWatermarkedFile(null);

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      
      // Read the original PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(arrayBuffer);
      
      const pages = pdfLibDoc.getPages();
      const font = await pdfLibDoc.embedFont(pdfLibDoc.StandardFonts.Helvetica);
      
      // Get the canvas dimensions for positioning
      const canvas = canvasRef.current;
      const pageWidth = pages[0].getWidth();
      const pageHeight = pages[0].getHeight();
      
      // Calculate scale ratio between canvas and actual PDF
      const scaleX = pageWidth / canvas.width;
      const scaleY = pageHeight / canvas.height;

      // Add watermark to all pages
      for (const page of pages) {
        const { height } = page.getSize();
        
        // Convert canvas position to PDF position
        const pdfX = watermarkPosition.x * scaleX;
        const pdfY = height - (watermarkPosition.y * scaleY) - (fontSize * scaleY);
        
        // Convert font size
        const pdfFontSize = fontSize * Math.min(scaleX, scaleY);
        
        // Convert opacity (0-100 to 0-1)
        const pdfOpacity = opacity / 100;
        
        // Draw the watermark
        page.drawText(watermarkText, {
          x: pdfX,
          y: pdfY,
          size: pdfFontSize,
          font: font,
          color: rgb(0, 0, 0),
          opacity: pdfOpacity,
          rotate: (rotation * Math.PI) / 180,
        });
      }

      const pdfBytes = await pdfLibDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setWatermarkedFile(blob);
    } catch (err) {
      console.error('Watermark error:', err);
      setError('Failed to apply watermark. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!watermarkedFile) return;

    const url = window.URL.createObjectURL(watermarkedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watermarked_${file.name}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setPdfDoc(null);
    setCurrentPage(1);
    setTotalPages(0);
    setWatermarkText('');
    setFontSize(48);
    setOpacity(30);
    setRotation(0);
    setWatermarkedFile(null);
    setError(null);
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading || isProcessing} message={isProcessing ? "Applying watermark..." : "Loading PDF..."} />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Watermark PDF
        </h1>
        <p className="text-gray-500">
          Add a text watermark to your PDF file with live preview
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
        <SingleDropZone onFileAdded={handleFileAdded} file={file} />
      </div>

      {file && pdfDoc && (
        <div className="space-y-6">
          {/* PDF Preview with Watermark */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Preview ({totalPages} pages)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-gray-600 font-medium min-w-[80px] text-center">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="border-l border-gray-200 pl-4 ml-2 mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">Zoom:</span>
              <button
                onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
                className="p-1 rounded hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-sm text-gray-600 min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale((s) => Math.min(2, s + 0.2))}
                className="p-1 rounded hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div className="flex justify-center">
              <div
                ref={containerRef}
                className="relative bg-gray-100 rounded-xl overflow-hidden shadow-inner"
                style={{ maxWidth: '100%' }}
              >
                <canvas
                  ref={canvasRef}
                  className="max-w-full"
                  style={{ display: 'block' }}
                />
                
                {/* Draggable Watermark Overlay */}
                {watermarkText && (
                  <div
                    ref={watermarkRef}
                    onMouseDown={handleWatermarkMouseDown}
                    onTouchStart={handleWatermarkMouseDown}
                    style={{
                      position: 'absolute',
                      left: `${watermarkPosition.x}px`,
                      top: `${watermarkPosition.y}px`,
                      transform: 'translate(-50%, -50%)',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      touchAction: 'none',
                    }}
                    className="pointer-events-auto"
                  >
                    <div
                      style={{
                        fontSize: `${fontSize * scale}px`,
                        opacity: opacity / 100,
                        transform: `rotate(${rotation}deg)`,
                        color: 'rgba(0, 0, 0, 0.5)',
                        whiteSpace: 'nowrap',
                      }}
                      className="font-sans"
                    >
                      {watermarkText}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {watermarkText && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Drag the watermark to position it on the PDF
                </span>
              </div>
            )}
          </div>

          {/* Watermark Controls */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Watermark Settings</h3>
            
            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Watermark Text
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Enter watermark text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Font Size Slider */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="120"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Opacity Slider */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opacity: {opacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Rotation Slider */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rotation: {rotation}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset.rotation)}
                    className={`
                      px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${rotation === preset.rotation
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="flex-1 py-4 px-6 rounded-xl font-semibold text-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
            >
              Upload New
            </button>
            <button
              onClick={isProcessing ? undefined : (watermarkedFile ? handleDownload : handleApplyWatermark)}
              disabled={isProcessing || !watermarkText.trim()}
              className={`
                flex-1 py-4 px-6 rounded-xl font-semibold text-lg
                transition-all duration-300
                ${watermarkText.trim()
                  ? watermarkedFile
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5'
                    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : watermarkedFile ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Watermarked PDF
                </span>
              ) : (
                'Apply Watermark'
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {watermarkedFile && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Watermark applied successfully! You can download or modify and apply again.</span>
        </div>
      )}

      {/* Instructions */}
      {file && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Enter text:</strong> Type the watermark text you want to add</li>
            <li>• <strong>Adjust settings:</strong> Use sliders for font size, opacity, and rotation</li>
            <li>• <strong>Use presets:</strong> Quick alignment options (horizontal, diagonal, vertical)</li>
            <li>• <strong>Position watermark:</strong> Drag the watermark text on the preview to position it</li>
            <li>• <strong>Apply to all pages:</strong> The watermark will be applied to all pages with the same configuration</li>
            <li>• <strong>Navigate pages:</strong> Preview different pages to check positioning</li>
          </ul>
        </div>
      )}
    </>
  );
}
