import { useState, useEffect } from 'react';
import SingleDropZone from '../components/SingleDropZone';
import PdfPreview from '../components/PdfPreview';
import LoadingOverlay from '../components/LoadingOverlay';
import { API_BASE } from '../api';

export default function RotatePage() {
  const [file, setFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [angle, setAngle] = useState(90);
  const [pageSelectionMode, setPageSelectionMode] = useState('all');
  const [specificPages, setSpecificPages] = useState('');
  const [isRotating, setIsRotating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Rotate PDF – PhenomPDF';
  }, []);

  const handleFileAdded = (newFile) => {
    setFile(newFile);
    setTotalPages(0);
    setSpecificPages('');
    setPageSelectionMode('all');
    setError(null);
  };

  const handleTotalPagesChange = (pages) => {
    setTotalPages(pages);
  };

  const handleRotate = async () => {
    if (!file) {
      setError('Please upload a PDF file to rotate');
      return;
    }

    if (pageSelectionMode === 'specific' && !specificPages.trim()) {
      setError('Please enter page numbers to rotate');
      return;
    }

    setIsRotating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('angle', angle);
      
      if (pageSelectionMode === 'specific') {
        formData.append('pages', specificPages);
      }

      const response = await fetch(`${API_BASE}/rotate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to rotate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rotated_${file.name}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      if (err.name === 'TypeError') {
        setError('Unable to connect to the server. Please make sure the backend is running on http://localhost:8000');
      } else {
        setError(err.message);
      }
    } finally {
      setIsRotating(false);
    }
  };

  const isFormValid = file && (pageSelectionMode === 'all' || specificPages.trim());

  return (
    <>
      <LoadingOverlay isLoading={isRotating} message="Rotating your PDF..." />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Rotate PDF Files Easily
        </h1>
        <p className="text-gray-500">
          Rotate all pages or specific pages by 90°, 180°, or 270°
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
        <SingleDropZone onFileAdded={handleFileAdded} file={file} />
      </div>

      {file && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Page Previews ({totalPages} pages)
          </h3>
          <PdfPreview file={file} onTotalPagesChange={handleTotalPagesChange} rotation={angle} />
        </div>
      )}

      {file && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Page Selection
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => setPageSelectionMode('all')}
              className={`
                py-3 px-4 rounded-xl font-medium transition-all duration-300
                ${pageSelectionMode === 'all'
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              All Pages
            </button>
            <button
              onClick={() => setPageSelectionMode('specific')}
              className={`
                py-3 px-4 rounded-xl font-medium transition-all duration-300
                ${pageSelectionMode === 'specific'
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              Specific Pages
            </button>
          </div>

          {pageSelectionMode === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Numbers (comma-separated)
              </label>
              <input
                type="text"
                value={specificPages}
                onChange={(e) => setSpecificPages(e.target.value)}
                placeholder="e.g., 1,3,5"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter page numbers separated by commas (e.g., 1,3,5)
              </p>
            </div>
          )}
        </div>
      )}

      {file && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Rotation Angle
          </h3>
          <div className="flex items-center justify-center gap-4">
            {[90, 180, 270].map((angleOption) => (
              <button
                key={angleOption}
                onClick={() => setAngle(angleOption)}
                className={`
                  flex-1 py-4 px-6 rounded-xl font-semibold text-lg
                  transition-all duration-300
                  ${angle === angleOption
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {angleOption}°
              </button>
            ))}
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

      <button
        onClick={handleRotate}
        disabled={isRotating || !isFormValid}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-300
          ${isFormValid
            ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isRotating ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Rotating PDF...
          </span>
        ) : (
          'Rotate PDF'
        )}
      </button>
    </>
  );
}
