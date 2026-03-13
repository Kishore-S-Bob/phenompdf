import { useState, useRef, useEffect } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';
import SEOContent from '../components/SEOContent';
import { API_BASE } from '../api';

export default function ImageToPdfPage({ onToolClick }) {
  const [images, setImages] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);
  const [isConverted, setIsConverted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.title = 'Convert Image to PDF Online – PhenomPDF';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Convert JPG, PNG, and other images into a single PDF document. Easy online image to PDF converter with PhenomPDF.');
    }
  }, []);

  const faqs = [
    {
      question: 'Can I combine multiple images into one PDF?',
      answer: 'Yes, you can upload multiple images and they will be merged into a single PDF file.'
    }
  ];

  const relatedTools = [
    { id: 'pdf-to-image', label: 'PDF → Image' },
    { id: 'merge', label: 'Merge PDF' },
    { id: 'compress', label: 'Compress PDF' }
  ];

  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

  const isValidImage = (file) => {
    return ALLOWED_TYPES.includes(file.type) ||
           file.name.toLowerCase().endsWith('.png') ||
           file.name.toLowerCase().endsWith('.jpg') ||
           file.name.toLowerCase().endsWith('.jpeg');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(isValidImage);

    if (files.length > 0) {
      addImages(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).filter(isValidImage);
    if (files.length > 0) {
      addImages(files);
    }
    e.target.value = '';
  };

  const addImages = (files) => {
    const newImages = files.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(file)
    }));
    setImages((prev) => [...prev, ...newImages]);
    setIsConverted(false);
    setError(null);
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOverItem = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    setImages((prev) => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(dragIndex, 1);
      newImages.splice(index, 0, movedImage);
      return newImages;
    });
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const moveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < images.length) {
      setImages((prev) => {
        const newImages = [...prev];
        const [movedImage] = newImages.splice(index, 1);
        newImages.splice(newIndex, 0, movedImage);
        return newImages;
      });
    }
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsConverting(true);
    setError(null);
    setIsConverted(false);

    try {
      const formData = new FormData();
      images.forEach((img) => {
        formData.append('files', img.file);
      });

      const response = await fetch(`${API_BASE}/image-to-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to convert images to PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted.pdf';
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
      <LoadingOverlay isLoading={isConverting} message="Converting images to PDF..." />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Image to PDF Converter
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Convert JPG, PNG, and other images into a single PDF document with PhenomPDF. Easy online image to PDF converter.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-2xl p-10 text-center
              transition-all duration-300 ease-out
              ${isDragging
                ? 'border-blue-500 bg-blue-50/80 scale-[1.02] shadow-lg shadow-blue-500/20'
                : 'border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-5">
              <div className={`
                w-20 h-20 rounded-2xl flex items-center justify-center
                transition-all duration-300
                ${isDragging
                  ? 'bg-blue-100 scale-110 shadow-md shadow-blue-500/20'
                  : 'bg-white shadow-sm'
                }
              `}>
                <svg
                  className={`
                    w-10 h-10 transition-colors duration-300
                    ${isDragging ? 'text-blue-600' : 'text-gray-400'}
                  `}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-800">
                  {isDragging ? 'Drop your images here' : 'Drag & drop images here'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  PNG and JPG files are accepted
                </p>
              </div>
            </div>
          </div>

          {/* Browse Files Button */}
          <button
            onClick={handleClick}
            className="
              mx-auto px-8 py-3 rounded-xl font-medium text-sm
              bg-white border border-gray-200 text-gray-700
              hover:bg-gray-50 hover:border-gray-300 hover:shadow-md
              active:scale-[0.98]
              transition-all duration-200
              flex items-center gap-2
            "
          >
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Browse Images
          </button>

          {/* Security Message */}
          <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Files are processed securely and automatically deleted
          </p>

          {/* Trust Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Files are processed securely</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Files are automatically deleted after processing</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No file size tracking or storage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview List */}
      {images.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Uploaded Images ({images.length})
            </h3>
            <p className="text-sm text-gray-500">
              Drag to reorder
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOverItem(e, index)}
                onDragEnd={handleDragEnd}
                className="relative group bg-gray-50 rounded-xl overflow-hidden border border-gray-200 cursor-move hover:shadow-md transition-shadow"
              >
                <div className="aspect-square">
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Order Badge */}
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                  {index + 1}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Reorder Controls */}
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    className={`p-1.5 bg-white rounded-lg shadow ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    title="Move left"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                    className={`p-1.5 bg-white rounded-lg shadow ${index === images.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    title="Move right"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* File Name */}
                <p className="text-xs text-gray-500 truncate px-2 py-1.5 bg-white/80">
                  {image.file.name}
                </p>
              </div>
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

      {isConverted && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Images converted to PDF successfully!</span>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={isConverting || images.length === 0}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-300
          ${images.length > 0
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
            Converting to PDF...
          </span>
        ) : (
          'Convert to PDF'
        )}
      </button>

      <SEOContent
        toolName="Image to PDF"
        description="Image to PDF converter allows you to transform your pictures into a professional PDF document. Whether you have photos of a document, receipts, or creative work, you can upload them all, arrange them in the right order, and create a single PDF file. It's an excellent way to organize images for sharing or archiving."
        faqs={faqs}
        relatedTools={relatedTools}
        onToolClick={onToolClick}
      />
    </>
  );
}
