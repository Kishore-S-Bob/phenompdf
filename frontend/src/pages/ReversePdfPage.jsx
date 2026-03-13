import { useState, useEffect } from 'react';
import SingleDropZone from '../components/SingleDropZone';
import LoadingOverlay from '../components/LoadingOverlay';
import SEOContent from '../components/SEOContent';
import { API_BASE } from '../api';

export default function ReversePdfPage({ onToolClick }) {
  const [file, setFile] = useState(null);
  const [isReversing, setIsReversing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Reverse PDF Pages Online – PhenomPDF';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Reverse the order of pages in your PDF document. Quick and easy online tool to flip your PDF page sequence with PhenomPDF.');
    }
  }, []);

  const faqs = [
    {
      question: 'Can I reverse the page order of a PDF?',
      answer: 'Yes, simply upload your PDF and click Reverse PDF to flip the page sequence instantly.'
    }
  ];

  const relatedTools = [
    { id: 'reorder', label: 'Reorder PDF' },
    { id: 'rotate', label: 'Rotate PDF' },
    { id: 'merge', label: 'Merge PDF' }
  ];

  const handleFileAdded = (newFile) => {
    setFile(newFile);
    setError(null);
  };

  const handleReverse = async () => {
    if (!file) {
      setError('Please upload a PDF file to reverse');
      return;
    }

    setIsReversing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/reverse`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reverse PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reversed_${file.name}`;
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
      setIsReversing(false);
    }
  };

  const isFormValid = file;

  return (
    <>
      <LoadingOverlay isLoading={isReversing} message="Reversing PDF pages..." />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Reverse PDF Pages
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Reverse the order of pages in your PDF document with PhenomPDF. Quick and easy online tool to flip your PDF page sequence.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
        <SingleDropZone onFileAdded={handleFileAdded} file={file} />
      </div>

      {file && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            What will happen?
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-16 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-gray-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">1</span>
              </div>
              <span className="text-xs text-gray-500">Page 1</span>
            </div>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-16 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-500">→</span>
              </div>
              <span className="text-xs text-gray-500">becomes</span>
            </div>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-16 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-gray-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">N</span>
              </div>
              <span className="text-xs text-gray-500">Last page</span>
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
        onClick={handleReverse}
        disabled={isReversing || !isFormValid}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-300
          ${isFormValid
            ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isReversing ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Reversing Pages...
          </span>
        ) : (
          'Reverse Pages'
        )}
      </button>

      <SEOContent
        toolName="Reverse PDF"
        description="Reverse PDF is a simple but powerful tool that flips the page order of your PDF document. This is especially useful for documents scanned in reverse order or when you need to change the presentation sequence of your slides or reports. Our tool is fast, free, and runs entirely in your web browser."
        faqs={faqs}
        relatedTools={relatedTools}
        onToolClick={onToolClick}
      />
    </>
  );
}
