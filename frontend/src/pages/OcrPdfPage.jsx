import { useState, useRef, useEffect } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const MAX_PAGES = 3;

export default function OcrPdfPage() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processedPages, setProcessedPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [activeBlock, setActiveBlock] = useState(null);
  const [progressMessage, setProgressMessage] = useState('');
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  useEffect(() => {
    document.title = 'OCR PDF – PhenomPDF';
  }, []);

  useEffect(() => {
    if (processedPages.length > 0 && currentPage < processedPages.length) {
      drawPage(currentPage);
    }
  }, [processedPages, currentPage, activeBlock]);

  const drawPage = (pageIndex) => {
    const pageData = processedPages[pageIndex];
    if (!pageData) return;

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');

    canvas.width = pageData.width;
    canvas.height = pageData.height;
    overlayCanvas.width = pageData.width;
    overlayCanvas.height = pageData.height;

    ctx.drawImage(pageData.image, 0, 0);

    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (pageData.blocks) {
      pageData.blocks.forEach((block, index) => {
        const isActive = activeBlock === `${pageIndex}-${index}`;
        
        overlayCtx.fillStyle = isActive ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 235, 59, 0.3)';
        overlayCtx.strokeStyle = isActive ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 193, 7, 0.8)';
        overlayCtx.lineWidth = 2;
        
        overlayCtx.fillRect(block.x0, block.y0, block.x1 - block.x0, block.y1 - block.y0);
        overlayCtx.strokeRect(block.x0, block.y0, block.x1 - block.x0, block.y1 - block.y0);
      });
    }
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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
    e.target.value = '';
  };

  const isValidFile = (file) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const handleFile = async (uploadedFile) => {
    if (!isValidFile(uploadedFile)) {
      setError('Please upload a PDF or image file (PNG, JPG)');
      return;
    }

    setFile(uploadedFile);
    setError(null);
    setProcessedPages([]);
    setExtractedText('');
    setCurrentPage(0);
    setActiveBlock(null);

    await processFile(uploadedFile);
  };

  const processFile = async (uploadedFile) => {
    setIsProcessing(true);
    setProgressMessage('Starting OCR processing...');

    try {
      if (uploadedFile.type === 'application/pdf' || uploadedFile.name.toLowerCase().endsWith('.pdf')) {
        await processPdf(uploadedFile);
      } else {
        await processImage(uploadedFile);
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process file: ' + err.message);
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  };

  const processPdf = async (pdfFile) => {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const numPages = Math.min(pdf.numPages, MAX_PAGES);
    const pages = [];
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
      setProgressMessage(`Processing page ${i} of ${numPages}...`);

      const page = await pdf.getPage(i);
      const scale = 2;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      const imageData = canvas.toDataURL('image/png');
      
      const result = await performOcr(imageData);
      
      pages.push({
        pageNumber: i,
        image: canvas,
        width: canvas.width,
        height: canvas.height,
        blocks: result.blocks,
        text: result.text
      });

      fullText += `--- Page ${i} ---\n${result.text}\n\n`;
    }

    setProcessedPages(pages);
    setExtractedText(fullText);
  };

  const processImage = async (imageFile) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const maxDimension = 2000;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = canvas.toDataURL('image/png');
        
        setProgressMessage('Extracting text from image...');

        const result = await performOcr(imageData);

        const pages = [{
          pageNumber: 1,
          image: canvas,
          width: canvas.width,
          height: canvas.height,
          blocks: result.blocks,
          text: result.text
        }];

        setProcessedPages(pages);
        setExtractedText(result.text);
        resolve();
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(imageFile);
    });
  };

  const performOcr = async (imageData) => {
    const result = await Tesseract.recognize(imageData, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgressMessage(`Recognizing text... ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    const blocks = result.data.words.map(word => ({
      text: word.text,
      x0: word.bbox.x0,
      y0: word.bbox.y0,
      x1: word.bbox.x1,
      y1: word.bbox.y1,
      confidence: word.confidence
    }));

    const lines = result.data.lines.map(line => ({
      text: line.text,
      bbox: line.bbox
    }));

    return {
      text: result.data.text,
      blocks: blocks,
      lines: lines
    };
  };

  const handleBlockClick = (pageIndex, blockIndex, text) => {
    setActiveBlock(`${pageIndex}-${blockIndex}`);
    navigator.clipboard.writeText(text);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
  };

  const handleDownloadText = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted-text.txt';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setProcessedPages([]);
    setExtractedText('');
    setCurrentPage(0);
    setActiveBlock(null);
    setError(null);
  };

  return (
    <>
      <LoadingOverlay 
        isLoading={isProcessing} 
        message={progressMessage || 'Processing...'}
      />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          OCR PDF / Image to Text
        </h1>
        <p className="text-gray-500">
          Extract text from scanned PDFs or images using OCR
        </p>
      </div>

      {!file ? (
        <>
          {/* Upload Zone */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
            <div className="flex flex-col gap-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-2xl p-10 text-center
                  transition-all duration-300 ease-out cursor-pointer
                  ${isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[1.02] shadow-lg shadow-blue-500/20'
                    : 'border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30'
                  }
                `}
                onClick={handleClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-800">
                      {isDragging ? 'Drop your file here' : 'Drag & drop scanned PDF or image'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      PDF, PNG and JPG files are accepted
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
                Browse Files
              </button>

              {/* Security Message */}
              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Files are processed entirely in your browser - nothing is uploaded to any server
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* File Info and Reset */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {processedPages.length} page{processedPages.length !== 1 ? 's' : ''} processed
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Upload New File
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Preview Section */}
          {processedPages.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
                {processedPages.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-600 px-2">
                      Page {currentPage + 1} of {processedPages.length}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(processedPages.length - 1, currentPage + 1))}
                      disabled={currentPage === processedPages.length - 1}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Canvas Container */}
              <div className="relative overflow-auto max-h-[500px] bg-gray-100 rounded-xl">
                <canvas
                  ref={canvasRef}
                  className="mx-auto"
                  style={{ display: 'block' }}
                />
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 mx-auto cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => {
                    const pageData = processedPages[currentPage];
                    if (!pageData || !pageData.blocks) return;

                    const rect = overlayCanvasRef.current.getBoundingClientRect();
                    const scaleX = overlayCanvasRef.current.width / rect.width;
                    const scaleY = overlayCanvasRef.current.height / rect.height;
                    const x = (e.clientX - rect.left) * scaleX;
                    const y = (e.clientY - rect.top) * scaleY;

                    for (let i = 0; i < pageData.blocks.length; i++) {
                      const block = pageData.blocks[i];
                      if (x >= block.x0 && x <= block.x1 && y >= block.y0 && y <= block.y1) {
                        handleBlockClick(currentPage, i, block.text);
                        break;
                      }
                    }
                  }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Click on highlighted text regions to copy individual words
              </p>
            </div>
          )}

          {/* Extracted Text Section */}
          {extractedText && (
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Detected Text</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyText}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Text
                  </button>
                  <button
                    onClick={handleDownloadText}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download TXT
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 max-h-[400px] overflow-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{extractedText}</pre>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
