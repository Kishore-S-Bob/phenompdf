import { useState, useEffect } from 'react';
import SingleDropZone from '../components/SingleDropZone';
import LoadingOverlay from '../components/LoadingOverlay';
import { API_BASE } from '../api';

export default function PdfToImagePage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('png');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);
  const [isConverted, setIsConverted] = useState(false);

  useEffect(() => {
    document.title = 'PDF to Image – PhenomPDF';
  }, []);

  const handleFileAdded = (newFile) => {
    setFile(newFile);
    setIsConverted(false);
    setError(null);
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please upload a PDF file to convert');
      return;
    }

    setIsConverting(true);
    setError(null);
    setIsConverted(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);

      const response = await fetch(`${API_BASE}/pdf-to-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to convert PDF to images');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'images.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsConverted(true);
    } catch (err) {
      if (err.name === 'TypeError') {
        setError('Unable to connect to the server. Please make sure the backend is running on http://localhost:8000');
      } else {
        setError(err.message);
      }
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isConverting} message="Converting PDF to images..." />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          PDF to Image Converter
        </h1>
        <p className="text-gray-500">
          Convert PDF pages to PNG or JPG images
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
        <SingleDropZone onFileAdded={handleFileAdded} file={file} />
      </div>

      {file && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Output Format
          </h3>
          <div className="flex gap-4">
            <label className={`
              flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
              ${format === 'png'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}>
              <input
                type="radio"
                name="format"
                value="png"
                checked={format === 'png'}
                onChange={(e) => setFormat(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <span className="font-semibold text-gray-800 block">PNG</span>
                  <span className="text-xs text-gray-500">High quality, transparent</span>
                </div>
              </div>
            </label>
            <label className={`
              flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
              ${format === 'jpg'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}>
              <input
                type="radio"
                name="format"
                value="jpg"
                checked={format === 'jpg'}
                onChange={(e) => setFormat(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <span className="font-semibold text-gray-800 block">JPG</span>
                  <span className="text-xs text-gray-500">Smaller file size</span>
                </div>
              </div>
            </label>
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

      {isConverted && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>PDF converted to images successfully! Images downloaded as ZIP file.</span>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={isConverting || !file}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-300
          ${file
            ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isConverting ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Converting PDF...
          </span>
        ) : (
          'Convert to Image'
        )}
      </button>
    </>
  );
}
