import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import DropZone from '../components/DropZone';
import LoadingOverlay from '../components/LoadingOverlay';
import { API_BASE } from '../api';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function EditPdfPage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [annotations, setAnnotations] = useState({});
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(1.2);

  const canvasRef = useRef(null);

  useEffect(() => {
    document.title = 'Edit PDF – PhenomPDF';
  }, []);

  const handleFileSelected = useCallback((files) => {
    if (files.length > 0) {
      const file = files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a valid PDF file');
        return;
      }
      setPdfFile(file);
      setIsLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const doc = await pdfjsLib.getDocument(typedarray).promise;
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
          setAnnotations({});
        } catch (err) {
          console.error('PDF load error:', err);
          setError('Failed to load PDF. The file may be corrupted or password protected.');
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  useEffect(() => {
    if (pdfDoc) {
      renderPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scale, annotations]);

  const renderPage = async () => {
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

    // Draw annotations on top
    drawAnnotations(context);
  };

  const drawAnnotations = (context) => {
    const pageAnnotations = annotations[currentPage] || [];
    
    pageAnnotations.forEach((ann) => {
      if (ann.type === 'text') {
        context.font = `${16 * scale}px Arial`;
        context.fillStyle = ann.color || '#000000';
        context.fillText(ann.text, ann.x * scale, ann.y * scale);
      } else if (ann.type === 'highlight') {
        context.globalAlpha = 0.3;
        context.fillStyle = ann.color || '#FFFF00';
        context.fillRect(
          ann.x * scale,
          ann.y * scale,
          ann.width * scale,
          ann.height * scale
        );
        context.globalAlpha = 1;
      } else if (ann.type === 'draw') {
        context.strokeStyle = ann.color || '#FF0000';
        context.lineWidth = 3 * scale;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        ann.points.forEach((point, i) => {
          if (i === 0) {
            context.moveTo(point.x * scale, point.y * scale);
          } else {
            context.lineTo(point.x * scale, point.y * scale);
          }
        });
        context.stroke();
      }
    });
  };

  const handleCanvasMouseDown = (e) => {
    if (activeTool === 'select') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (activeTool === 'text') {
      // Add text at click position
      const text = prompt('Enter text to add:');
      if (text) {
        const newAnnotation = {
          id: Date.now(),
          type: 'text',
          text,
          x,
          y,
          color: '#000000',
        };
        addAnnotation(newAnnotation);
      }
      return;
    }

    if (activeTool === 'highlight') {
      setIsDrawing(true);
      setCurrentAnnotation({
        id: Date.now(),
        type: 'highlight',
        x,
        y,
        width: 0,
        height: 0,
        color: '#FFFF00',
      });
      return;
    }

    if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentAnnotation({
        id: Date.now(),
        type: 'draw',
        points: [{ x, y }],
        color: '#FF0000',
      });
      return;
    }

    if (activeTool === 'erase') {
      // Find and remove annotation at click position
      const pageAnnotations = annotations[currentPage] || [];
      const annotationToRemove = pageAnnotations.find((ann) => {
        if (ann.type === 'text') {
          const distance = Math.sqrt(
            Math.pow(ann.x - x, 2) + Math.pow(ann.y - y, 2)
          );
          return distance < 30;
        } else if (ann.type === 'highlight') {
          return (
            x >= ann.x &&
            x <= ann.x + ann.width &&
            y >= ann.y &&
            y <= ann.y + ann.height
          );
        } else if (ann.type === 'draw') {
          return ann.points.some(
            (point) =>
              Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)) < 20
          );
        }
        return false;
      });

      if (annotationToRemove) {
        removeAnnotation(annotationToRemove.id);
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !currentAnnotation) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (currentAnnotation.type === 'highlight') {
      setCurrentAnnotation({
        ...currentAnnotation,
        width: x - currentAnnotation.x,
        height: y - currentAnnotation.y,
      });
    } else if (currentAnnotation.type === 'draw') {
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [...currentAnnotation.points, { x, y }],
      });
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    if (currentAnnotation.type === 'highlight') {
      // Normalize width and height to handle negative drag
      const normalized = {
        ...currentAnnotation,
        x: currentAnnotation.width < 0 ? currentAnnotation.x + currentAnnotation.width : currentAnnotation.x,
        y: currentAnnotation.height < 0 ? currentAnnotation.y + currentAnnotation.height : currentAnnotation.y,
        width: Math.abs(currentAnnotation.width),
        height: Math.abs(currentAnnotation.height),
      };
      
      // Only add if highlight has some size
      if (normalized.width > 5 && normalized.height > 5) {
        addAnnotation(normalized);
      }
    } else if (currentAnnotation.type === 'draw') {
      // Only add if drawing has multiple points
      if (currentAnnotation.points.length > 2) {
        addAnnotation(currentAnnotation);
      }
    }

    setIsDrawing(false);
    setCurrentAnnotation(null);
  };

  const addAnnotation = (annotation) => {
    setAnnotations((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), annotation],
    }));
  };

  const removeAnnotation = (id) => {
    setAnnotations((prev) => ({
      ...prev,
      [currentPage]: (prev[currentPage] || []).filter((ann) => ann.id !== id),
    }));
  };

  const handleExport = async () => {
    if (!pdfDoc || !pdfFile) return;

    setIsLoading(true);

    try {
      // For client-side editing, we'll create a new PDF with annotations
      // We'll use the browser to render each page with annotations and save as new PDF
      // Since we can't directly modify PDF with pypdf from client, we'll create an annotated version

      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      
      // Read the original PDF
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(arrayBuffer);
      
      const pages = pdfLibDoc.getPages();
      const font = await pdfLibDoc.embedFont(StandardFonts.Helvetica);

      // Add annotations to each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageNum = i + 1;
        const pageAnnotations = annotations[pageNum] || [];
        const { height } = page.getSize();

        for (const ann of pageAnnotations) {
          if (ann.type === 'text') {
            // Convert coordinates (canvas is top-left, PDF is bottom-left)
            const pdfX = ann.x;
            const pdfY = height - ann.y - 10;
            
            page.drawText(ann.text, {
              x: pdfX,
              y: pdfY,
              size: 12,
              font: font,
              color: rgb(0, 0, 0),
            });
          } else if (ann.type === 'highlight') {
            const pdfX = ann.x;
            const pdfY = height - ann.y - ann.height;
            
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: ann.width,
              height: ann.height,
              color: rgb(1, 1, 0),
              opacity: 0.3,
            });
          } else if (ann.type === 'draw') {
            if (ann.points.length > 1) {
              for (let j = 0; j < ann.points.length - 1; j++) {
                const p1 = ann.points[j];
                const p2 = ann.points[j + 1];
                
                page.drawLine({
                  start: { x: p1.x, y: height - p1.y },
                  end: { x: p2.x, y: height - p2.y },
                  thickness: 2,
                  color: rgb(1, 0, 0),
                });
              }
            }
          }
        }
      }

      const pdfBytes = await pdfLibDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'edited.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setPdfDoc(null);
    setCurrentPage(1);
    setTotalPages(0);
    setAnnotations({});
    setError(null);
  };

  const tools = [
    { id: 'select', label: 'Select', icon: 'cursor' },
    { id: 'text', label: 'Add Text', icon: 'text' },
    { id: 'highlight', label: 'Highlight', icon: 'highlight' },
    { id: 'draw', label: 'Draw', icon: 'draw' },
    { id: 'erase', label: 'Erase', icon: 'erase' },
  ];

  const ToolIcon = ({ type }) => {
    switch (type) {
      case 'cursor':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        );
      case 'text':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'highlight':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'draw':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      case 'erase':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message="Processing your PDF..." />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Edit PDF Online
        </h1>
        <p className="text-gray-500">
          Add text, highlight, draw, and annotate your PDF files
        </p>
      </div>

      {!pdfFile ? (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
          <DropZone onFilesAdded={handleFileSelected} />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mt-4 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Tools */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-500 mr-2">Tools:</span>
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${activeTool === tool.id
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    <ToolIcon type={tool.icon} />
                    <span className="hidden sm:inline">{tool.label}</span>
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                >
                  Upload New
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>

          {/* Page Navigation */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-gray-600 font-medium">
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

              <div className="border-l border-gray-200 pl-4 ml-2 flex items-center gap-2">
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
            </div>
          </div>

          {/* Canvas Container */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-4 overflow-auto">
            <div className="flex justify-center">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className={`
                    border border-gray-200 rounded shadow-lg cursor-crosshair
                    ${activeTool === 'select' ? 'cursor-default' : ''}
                  `}
                  style={{ maxWidth: '100%' }}
                />
                
                {/* Drawing preview */}
                {currentAnnotation && isDrawing && (
                  <svg
                    className="absolute top-0 left-0 pointer-events-none"
                    width={canvasRef.current?.width || 0}
                    height={canvasRef.current?.height || 0}
                  >
                    {currentAnnotation.type === 'highlight' && (
                      <rect
                        x={Math.min(currentAnnotation.x, currentAnnotation.x + currentAnnotation.width) * scale}
                        y={Math.min(currentAnnotation.y, currentAnnotation.y + currentAnnotation.height) * scale}
                        width={Math.abs(currentAnnotation.width) * scale}
                        height={Math.abs(currentAnnotation.height) * scale}
                        fill="rgba(255, 255, 0, 0.3)"
                      />
                    )}
                    {currentAnnotation.type === 'draw' && currentAnnotation.points.length > 1 && (
                      <polyline
                        points={currentAnnotation.points.map(p => `${p.x * scale},${p.y * scale}`).join(' ')}
                        fill="none"
                        stroke="red"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How to edit:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Add Text:</strong> Click anywhere on the PDF to add text</li>
              <li>• <strong>Highlight:</strong> Click and drag to highlight areas</li>
              <li>• <strong>Draw:</strong> Click and drag to draw freehand lines</li>
              <li>• <strong>Erase:</strong> Click on any annotation to remove it</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
