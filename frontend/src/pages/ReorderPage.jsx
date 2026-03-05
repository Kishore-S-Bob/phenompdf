import { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SingleDropZone from '../components/SingleDropZone';

const ItemType = 'PAGE';

function PageThumbnail({ index, pageNumber, onMove, total }) {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`
        relative bg-white rounded-lg shadow-sm border-2 transition-all duration-200 cursor-grab
        ${isDragging ? 'opacity-50 border-blue-400' : 'border-gray-200 hover:border-blue-400'}
      `}
      style={{ aspectRatio: '0.707' }}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <span className="text-4xl font-bold text-gray-300">{pageNumber}</span>
      </div>
      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-medium">
        Page {pageNumber}
      </div>
      <div className="absolute bottom-2 right-2 bg-gray-800/70 text-white text-xs px-2 py-1 rounded-md">
        {index + 1}
      </div>
    </div>
  );
}

export default function ReorderPage() {
  const [file, setFile] = useState(null);
  const [pageOrder, setPageOrder] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isReordering, setIsReordering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileAdded = async (newFile) => {
    setFile(newFile);
    setPageOrder([]);
    setTotalPages(0);
    setError(null);

    if (newFile) {
      setIsLoading(true);
      try {
        // Use the backend API to get PDF page count
        const formData = new FormData();
        formData.append('file', newFile);

        const response = await fetch('http://localhost:8000/pdf-preview', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to load PDF');
        }

        const data = await response.json();
        const numPages = data.total_pages;

        const pages = [];
        for (let i = 1; i <= numPages; i++) {
          pages.push(i);
        }

        setPageOrder(pages);
        setTotalPages(numPages);
      } catch (err) {
        console.error('PDF loading error:', err);
        if (err.name === 'TypeError') {
          setError('Unable to connect to the server. Please make sure the backend is running on http://localhost:8000');
        } else {
          setError(err.message || 'Failed to load PDF. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMovePage = (fromIndex, toIndex) => {
    setPageOrder((prev) => {
      const newOrder = [...prev];
      const [movedPage] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedPage);
      return newOrder;
    });
  };

  const handleReorder = async () => {
    if (!file) {
      setError('Please upload a PDF file to reorder');
      return;
    }

    if (pageOrder.length === 0) {
      setError('No pages to reorder');
      return;
    }

    setIsReordering(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('page_order', JSON.stringify(pageOrder));

      const response = await fetch('http://localhost:8000/reorder', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reorder PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reordered.pdf';
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
      setIsReordering(false);
    }
  };

  const handleReset = () => {
    if (totalPages > 0) {
      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      setPageOrder(pages);
    }
  };

  const isFormValid = file && pageOrder.length > 0 && !isLoading;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Reorder PDF Pages
        </h1>
        <p className="text-gray-500">
          Upload a PDF and drag pages to reorder them
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <SingleDropZone onFileAdded={handleFileAdded} file={file} />
      </div>

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading PDF pages...
          </span>
        </div>
      )}

      {file && pageOrder.length > 0 && !isLoading && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Page Order ({totalPages} pages)
            </h3>
            <button
              onClick={handleReset}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset Order
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop pages to reorder them
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pageOrder.map((pageNum, index) => (
              <PageThumbnail
                key={`${pageNum}-${index}`}
                index={index}
                pageNumber={pageNum}
                onMove={handleMovePage}
                total={pageOrder.length}
              />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <button
        onClick={handleReorder}
        disabled={isReordering || !isFormValid}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-200
          ${isFormValid
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
          ${isReordering ? 'opacity-75' : ''}
        `}
      >
        {isReordering ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Reordering Pages...
          </span>
        ) : (
          'Apply Changes'
        )}
      </button>
    </DndProvider>
  );
}
