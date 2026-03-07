import { useState, useRef } from 'react';

export default function SingleDropZone({ onFileAdded, file }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (files.length > 0) {
      onFileAdded(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onFileAdded(files[0]);
    }
    e.target.value = '';
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onFileAdded(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!file ? handleClick : undefined}
        className={`
          w-full max-w-xl mx-auto border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center
          transition-all duration-300 ease-out
          ${file
            ? 'border-green-400 bg-green-50/50 cursor-default'
            : isDragging
              ? 'border-blue-500 bg-blue-50/80 scale-[1.02] shadow-lg shadow-blue-500/20 cursor-pointer'
              : 'border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-green-100 flex items-center justify-center shadow-sm">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800 max-w-md truncate">
                {file.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="
                mt-2 px-4 py-2 rounded-lg text-sm font-medium
                text-red-600 bg-red-50 hover:bg-red-100
                transition-colors duration-200
                flex items-center gap-2
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Remove file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className={`
              w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center
              transition-all duration-300
              ${isDragging
                ? 'bg-blue-100 scale-110 shadow-md shadow-blue-500/20'
                : 'bg-white shadow-sm'
              }
            `}>
              <svg
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 transition-colors duration-300
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-semibold text-gray-800">
                {isDragging ? 'Drop your PDF here' : 'Drag & drop a PDF file'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Only PDF files are accepted
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Browse Files Button */}
      {!file && (
        <button
          onClick={handleClick}
          className="
            mx-auto py-3 px-6 rounded-lg font-medium text-sm
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
              d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
            />
          </svg>
          Browse Files
        </button>
      )}
    </div>
  );
}
