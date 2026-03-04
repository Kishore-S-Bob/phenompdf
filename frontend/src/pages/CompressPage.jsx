import { useState } from 'react';
import SingleDropZone from '../components/SingleDropZone';

export default function CompressPage() {
  const [file, setFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);

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

      const response = await fetch('http://localhost:8000/compress', {
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
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Compress PDF
        </h1>
        <p className="text-gray-500">
          Reduce PDF file size while maintaining quality
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <SingleDropZone onFileAdded={handleFileAdded} file={file} />
      </div>

      {file && originalSize && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            File Information
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Original Size</p>
              <p className="text-xl font-semibold text-gray-800">
                {formatFileSize(originalSize)}
              </p>
            </div>
            {compressedSize && (
              <>
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Compressed Size</p>
                  <p className="text-xl font-semibold text-green-600">
                    {formatFileSize(compressedSize)}
                  </p>
                </div>
                {originalSize > compressedSize && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Saved</p>
                    <p className="text-xl font-semibold text-blue-600">
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {compressedFile && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>PDF compressed successfully! {originalSize > compressedSize ? `Reduced by ${calculateCompressionRatio()}%` : 'File size unchanged'}</span>
          </div>
        </div>
      )}

      <button
        onClick={isCompressing ? undefined : (compressedFile ? handleDownload : handleCompress)}
        disabled={isCompressing || !file}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-200
          ${file
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
          ${isCompressing ? 'opacity-75' : ''}
        `}
      >
        {isCompressing ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Compressing PDF...
          </span>
        ) : compressedFile ? (
          'Download Compressed PDF'
        ) : (
          'Compress PDF'
        )}
      </button>
    </>
  );
}
