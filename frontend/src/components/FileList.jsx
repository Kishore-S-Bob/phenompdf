export default function FileList({ files, onRemove, onReorder }) {
  const moveFile = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < files.length) {
      onReorder(index, newIndex);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Uploaded Files ({files.length})
      </h3>
      {files.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No files uploaded yet</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li 
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveFile(index, -1)}
                  disabled={index === 0}
                  className={`p-1 rounded hover:bg-gray-100 ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  title="Move up"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveFile(index, 1)}
                  disabled={index === files.length - 1}
                  className={`p-1 rounded hover:bg-gray-100 ${index === files.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  title="Move down"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {index + 1}. {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              <button
                onClick={() => onRemove(index)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
