import { useState, useEffect } from 'react';
import SingleDropZone from '../components/SingleDropZone';
import PdfPreview from '../components/PdfPreview';
import LoadingOverlay from '../components/LoadingOverlay';
import { API_BASE } from '../api';

export default function SplitPage() {
  const [file, setFile] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Split PDF – PhenomPDF';
  }, []);

  const handleFileAdded = (newFile) => {
    setFile(newFile);
    setTotalPages(0);
    setStartPage('');
    setEndPage('');
    setError(null);
  };

  const handleTotalPagesChange = (pages) => {
    setTotalPages(pages);
    if (pages > 0) {
      if (!startPage) {
        setStartPage('1');
      }
      if (!endPage || parseInt(endPage) > pages) {
        setEndPage(String(pages));
      }
    }
  };

  const handleSplit = async () => {
    if (!file) {
      setError('Please upload a PDF file to split');
      return;
    }

    if (!startPage || !endPage) {
      setError('Please enter both start and end page numbers');
      return;
    }

    const start = parseInt(startPage, 10);
    const end = parseInt(endPage, 10);

    if (isNaN(start) || isNaN(end)) {
      setError('Page numbers must be valid integers');
      return;
    }

    if (start < 1) {
      setError('Start page must be at least 1');
      return;
    }

    if (end < start) {
      setError('End page must be greater than or equal to start page');
      return;
    }

    setIsSplitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('start_page', start);
      formData.append('end_page', end);

      const response = await fetch(`${API_BASE}/split`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to split PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `split_${start}-${end}.pdf`;
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
      setIsSplitting(false);
    }
  };

  const isFormValid = file && startPage && endPage;

  return (
    <>
      <LoadingOverlay isLoading={isSplitting} message="Splitting your PDF..." />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Split PDF Files Easily
        </h1>
        <p className="text-gray-500">
          Extract specific pages from a PDF file
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
          <PdfPreview file={file} onTotalPagesChange={handleTotalPagesChange} />
        </div>
      )}

      {file && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Page Range
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="start-page" className="block text-sm font-medium text-gray-600 mb-2">
                Start Page
              </label>
              <input
                id="start-page"
                type="number"
                min="1"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                placeholder="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="text-gray-400 pt-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <div className="flex-1">
              <label htmlFor="end-page" className="block text-sm font-medium text-gray-600 mb-2">
                End Page
              </label>
              <input
                id="end-page"
                type="number"
                min="1"
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
                placeholder="5"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
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
        onClick={handleSplit}
        disabled={isSplitting || !isFormValid}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-300
          ${isFormValid
            ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isSplitting ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Splitting PDF...
          </span>
        ) : (
          'Split PDF'
        )}
      </button>
    </>
  );
}
