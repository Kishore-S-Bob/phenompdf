import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../api';

export default function PdfPreview({ file, onTotalPagesChange, maxSize = 200 }) {
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTotalPagesChange = useCallback((pages) => {
    if (onTotalPagesChange) {
      onTotalPagesChange(pages);
    }
  }, [onTotalPagesChange]);

  useEffect(() => {
    if (!file) {
      setThumbnails([]);
      setError(null);
      handleTotalPagesChange(0);
      return;
    }

    const fetchPreviews = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('max_size', maxSize);

        const response = await fetch(`${API_BASE}/pdf-preview`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to generate preview');
        }

        const data = await response.json();
        setThumbnails(data.thumbnails);
        handleTotalPagesChange(data.total_pages);
      } catch (err) {
        if (err.name === 'TypeError') {
          setError('Unable to connect to the server. Please make sure the backend is running on http://localhost:8000');
        } else {
          setError(err.message);
        }
        setThumbnails([]);
        handleTotalPagesChange(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviews();
  }, [file, maxSize, handleTotalPagesChange]);

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
            style={{ aspectRatio: '0.707' }}
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
