import { useState, useEffect, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export default function PdfPreview({ file, onTotalPagesChange, maxSize = 200, rotation = 0 }) {
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const pdfDocRef = useRef(null);

  const handleTotalPagesChange = useCallback((pages) => {
    if (onTotalPagesChange) {
      onTotalPagesChange(pages);
    }
  }, [onTotalPagesChange]);

  const renderPage = async (pdf, pageNum, scale) => {
    try {
      const page = await pdf.getPage(pageNum);
      
      // Create viewport with rotation
      const viewport = page.getViewport({
        scale: scale,
        rotation: rotation
      });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Convert canvas to data URL
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (err) {
      console.error(`Error rendering page ${pageNum}:`, err);
      return null;
    }
  };

  const generateThumbnails = async (pdf) => {
    const total = pdf.numPages;
    const newThumbnails = [];

    // Calculate scale to fit within maxSize while maintaining aspect ratio
    // We'll render first page to get dimensions, then calculate appropriate scale
    try {
      const firstPage = await pdf.getPage(1);
      const baseViewport = firstPage.getViewport({ scale: 1, rotation: rotation });
      
      let scale;
      if (baseViewport.width > baseViewport.height) {
        scale = maxSize / baseViewport.width;
      } else {
        scale = maxSize / baseViewport.height;
      }

      // Render all pages
      for (let i = 1; i <= total; i++) {
        const imageUrl = await renderPage(pdf, i, scale);
        if (imageUrl) {
          newThumbnails.push({
            page_number: i,
            image: imageUrl
          });
        }
      }

      setThumbnails(newThumbnails);
      handleTotalPagesChange(total);
    } catch (err) {
      setError(err.message || 'Failed to generate thumbnails');
      setThumbnails([]);
      handleTotalPagesChange(0);
    }
  };

  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      setError(null);
      handleTotalPagesChange(0);
      if (pdfDocRef.current) {
        pdfDocRef.current = null;
      }
      return;
    }

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load file as array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        pdfDocRef.current = pdf;
        
        await generateThumbnails(pdf);
      } catch (err) {
        setError(err.message || 'Failed to load PDF');
        setThumbnails([]);
        handleTotalPagesChange(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, maxSize, handleTotalPagesChange]);

  // Re-render thumbnails when rotation changes
  useEffect(() => {
    if (pdfDocRef.current && !isLoading) {
      generateThumbnails(pdfDocRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotation]);

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
          <span>Generating page previews...</span>
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
            style={{ aspectRatio: rotation % 180 !== 0 ? '1.414' : '0.707' }}
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
