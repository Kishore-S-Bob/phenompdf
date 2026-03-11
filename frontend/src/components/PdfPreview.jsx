import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export default function PdfPreview({ file, onTotalPagesChange, maxSize = 200, rotation = 0, selectedPages = [] }) {
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const isRenderingRef = useRef(false);
  const canvasRef = useRef(null);
  const lastFileRef = useRef(null);
  const lastRotationRef = useRef(0);
  const lastSelectedPagesRef = useRef([]);

  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      setError(null);
      if (onTotalPagesChange) onTotalPagesChange(0);
      lastFileRef.current = null;
      lastRotationRef.current = 0;
      lastSelectedPagesRef.current = [];
      return;
    }

    // 1. Prevent Infinite Re-rendering: Check if file, rotation, or selectedPages actually changed
    const selectedPagesStr = JSON.stringify(selectedPages);
    const lastSelectedPagesStr = JSON.stringify(lastSelectedPagesRef.current);
    
    if (lastFileRef.current === file && 
        lastRotationRef.current === rotation && 
        lastSelectedPagesStr === selectedPagesStr) {
      // Same inputs, no need to re-render
      return;
    }

    const renderPdf = async () => {
      // 2. Use a Rendering Lock
      if (isRenderingRef.current) return;
      isRenderingRef.current = true;

      setIsLoading(true);
      setError(null);
      
      // 3. Clear Preview Container Only Once
      setThumbnails([]);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const total = pdf.numPages;

        if (onTotalPagesChange) {
          onTotalPagesChange(total);
        }

        const newThumbnails = [];
        // 7. Optimize Preview Rendering: Limit to the first 5 pages
        const maxPages = Math.min(total, 5);

        // 5. Reuse Canvas Elements
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // 4. Render Pages Sequentially
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const pageRotation = selectedPages.includes(i) ? rotation : 0;
          
          const baseViewport = page.getViewport({ scale: 1, rotation: pageRotation });
          let scale;
          if (baseViewport.width > baseViewport.height) {
            scale = maxSize / baseViewport.width;
          } else {
            scale = maxSize / baseViewport.height;
          }

          const viewport = page.getViewport({ scale, rotation: pageRotation });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };

          await page.render(renderContext).promise;
          const imageUrl = canvas.toDataURL('image/jpeg', 0.85);

          newThumbnails.push({
            page_number: i,
            image: imageUrl,
            rotation: pageRotation
          });
        }

        // 6. Avoid State Updates in Render Loops: Store in local variable until completion
        setThumbnails(newThumbnails);
        pdf.destroy();
        
        // Update refs after successful render
        lastFileRef.current = file;
        lastRotationRef.current = rotation;
        lastSelectedPagesRef.current = [...selectedPages];
      } catch (err) {
        console.error('PDF preview error:', err);
        setError(err.message || 'Failed to generate previews');
        setThumbnails([]);
      } finally {
        setIsLoading(false);
        isRenderingRef.current = false;
      }
    };

    // 1. Prevent Infinite Re-rendering: Run only when file, rotation, or selectedPages change
    renderPdf();
  }, [file, rotation, selectedPages, onTotalPagesChange, maxSize]);

  if (!file) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {/* 8. Add Loading Indicator */}
          <span>Generating preview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        {error}
      </div>
    );
  }

  if (thumbnails.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {thumbnails.map((thumbnail) => (
        <div
          key={thumbnail.page_number}
          className="relative bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-200"
        >
          <div
            className="w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
            style={{ aspectRatio: thumbnail.rotation === 90 || thumbnail.rotation === 270 ? '1.414' : '0.707' }}
          >
            <img
              src={thumbnail.image}
              alt={`Page ${thumbnail.page_number}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-md font-medium shadow-sm">
            Page {thumbnail.page_number}
          </div>
        </div>
      ))}
    </div>
  );
}
