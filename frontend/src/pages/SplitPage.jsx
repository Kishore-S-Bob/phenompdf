import { useState } from 'react';
import SingleDropZone from '../components/SingleDropZone';

export default function SplitPage() {
  const [file, setFile] = useState(null);
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);
  const [error, setError] = useState(null);

  const handleFileAdded = (newFile) => {
    setFile(newFile);
    setError(null);
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

      const response = await fetch('http://localhost:8000/split', {
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
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Split PDF File
        </h1>
        <p className="text-gray-500">
          Extract specific pages from a PDF file
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <SingleDropZone onFileAdded={handleFileAdded} file={file} />
      </div>

      {file && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <button
        onClick={handleSplit}
        disabled={isSplitting || !isFormValid}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-200
          ${isFormValid
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
          ${isSplitting ? 'opacity-75' : ''}
        `}
      >
        {isSplitting ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
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
