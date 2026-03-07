import { useState, useEffect } from 'react';
import SingleDropZone from '../components/SingleDropZone';
import LoadingOverlay from '../components/LoadingOverlay';
import { API_BASE } from '../api';

export default function CompressPage() {
  const [file, setFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);

  useEffect(() => {
    document.title = 'Compress PDF – PhenomPDF';
  }, []);

  const handleFileAdded = (newFile) => {
    setFile(newFile);
    setCompressedFile(null);
    setOriginalSize(null);
    setCompressedSize(null);
    setError(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCompress = async () => {
    if (!file) {
      setError('Please upload a PDF file to compress');
      return;
    }

    setIsCompressing(true);
    setError(null);
    setCompressedFile(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setOriginalSize(file.size);

      const response = await fetch(`${API_BASE}/compress`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to compress PDF');
      }

      const blob = await response.blob();
      setCompressedSize(blob.size);
      setCompressedFile(blob);
    } catch (err) {
      if (err.name === 'TypeError') {
        setError('Unable to connect to the server. Please make sure the backend is running on http://localhost:8000');
      } else {
        setError(err.message);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedFile) return;

    const url = window.URL.createObjectURL(compressedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${file.name}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const calculateCompressionRatio = () => {
    if (!originalSize || !compressedSize || originalSize === 0) return 0;
    return ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
  };

  return (
    <>
      <LoadingOverlay isLoading={isCompressing} message="Compressing your PDF..." />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Compress PDF Files
        </h1>
        <p className="text-gray-500">
          Reduce PDF file size while maintaining quality
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
        <SingleDropZone onFileAdded={handleFileAdded} file={file} />
      </div>

      {file && originalSize && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            File Information
          </h3>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[120px]">
              <p className="text-sm text-gray-500 mb-1">Original Size</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatFileSize(originalSize)}
              </p>
            </div>
            {compressedSize && (
              <>
                <div className="text-gray-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <p className="text-sm text-gray-500 mb-1">Compressed Size</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatFileSize(compressedSize)}
                  </p>
                </div>
                {originalSize > compressedSize && (
                  <div className="flex-1 min-w-[120px] text-right">
                    <p className="text-sm text-gray-500 mb-1">Saved</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {calculateCompressionRatio()}%
                    </p>
                  </div>
                )}
              </>
            )}
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

      {compressedFile && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>PDF compressed successfully! {originalSize > compressedSize ? `Reduced by ${calculateCompressionRatio()}%` : 'File size unchanged'}</span>
        </div>
      )}

      <button
        onClick={isCompressing ? undefined : (compressedFile ? handleDownload : handleCompress)}
        disabled={isCompressing || !file}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-300
          ${file
            ? compressedFile
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5'
              : 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isCompressing ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Compressing PDF...
          </span>
        ) : compressedFile ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Compressed PDF
          </span>
        ) : (
          'Compress PDF'
        )}
      </button>
    </>
  );
}
