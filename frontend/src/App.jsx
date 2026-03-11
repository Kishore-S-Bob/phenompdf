import { useState } from 'react';
import MergePage from './pages/MergePage';
import SplitPage from './pages/SplitPage';
import CompressPage from './pages/CompressPage';
import PdfToImagePage from './pages/PdfToImagePage';
import ImageToPdfPage from './pages/ImageToPdfPage';
import ReorderPage from './pages/ReorderPage';
import ProtectPage from './pages/ProtectPage';
import UnlockPage from './pages/UnlockPage';
import EditPdfPage from './pages/EditPdfPage';
import RotatePage from './pages/RotatePage';
import WatermarkPage from './pages/WatermarkPage';
import OcrPdfPage from './pages/OcrPdfPage';
import ExtractPagesPage from './pages/ExtractPagesPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';
import Footer from './components/Footer';
import Logo from './components/Logo';

// Tool Icons as components for better styling control
const MergeIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const SplitIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
  </svg>
);

const CompressIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v11m-4-4l4-4 4 4" />
  </svg>
);

const PdfToImageIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ImageToPdfIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13l2 2 4-4" />
  </svg>
);

const ReorderIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const ProtectIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const UnlockIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);

const EditPdfIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4" />
  </svg>
);

const RotateIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const WatermarkIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const OcrIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const ExtractPagesIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('merge');
  const [showInfoPage, setShowInfoPage] = useState(null);

  const tools = [
    { id: 'merge', label: 'Merge PDF', description: 'Combine multiple PDFs into one', icon: MergeIcon },
    { id: 'split', label: 'Split PDF', description: 'Extract pages from your PDF', icon: SplitIcon },
    { id: 'extract-pages', label: 'Extract Pages', description: 'Extract specific pages to a new PDF', icon: ExtractPagesIcon },
    { id: 'compress', label: 'Compress PDF', description: 'Reduce file size while keeping quality', icon: CompressIcon },
    { id: 'pdf-to-image', label: 'PDF → Image', description: 'Convert PDF pages to images', icon: PdfToImageIcon },
    { id: 'image-to-pdf', label: 'Image → PDF', description: 'Convert images to a single PDF', icon: ImageToPdfIcon },
    { id: 'reorder', label: 'Reorder PDF', description: 'Rearrange pages in your PDF', icon: ReorderIcon },
    { id: 'protect', label: 'Protect PDF', description: 'Add password protection', icon: ProtectIcon },
    { id: 'unlock', label: 'Unlock PDF', description: 'Remove password protection', icon: UnlockIcon },
    { id: 'rotate', label: 'Rotate PDF', description: 'Rotate pages in your PDF', icon: RotateIcon },
    { id: 'watermark', label: 'Watermark PDF', description: 'Add text watermark to your PDF', icon: WatermarkIcon },
    { id: 'edit-pdf', label: 'Edit PDF', description: 'Add text, highlights and annotations', icon: EditPdfIcon },
    { id: 'ocr-pdf', label: 'OCR PDF', description: 'Extract text from scanned PDFs or images using OCR', icon: OcrIcon },
  ];

  const handleToolClick = (toolId) => {
    setActiveTab(toolId);
    setShowInfoPage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInfoPageClick = (page) => {
    setShowInfoPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHomeClick = () => {
    setShowInfoPage(null);
    setActiveTab('merge');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    if (showInfoPage) {
      switch (showInfoPage) {
        case 'privacy': return <PrivacyPage />;
        case 'terms': return <TermsPage />;
        case 'contact': return <ContactPage />;
        default: return <MergePage />;
      }
    }
    switch (activeTab) {
      case 'merge': return <MergePage />;
      case 'split': return <SplitPage />;
      case 'extract-pages': return <ExtractPagesPage />;
      case 'compress': return <CompressPage />;
      case 'pdf-to-image': return <PdfToImagePage />;
      case 'image-to-pdf': return <ImageToPdfPage />;
      case 'reorder': return <ReorderPage />;
      case 'protect': return <ProtectPage />;
      case 'unlock': return <UnlockPage />;
      case 'rotate': return <RotatePage />;
      case 'watermark': return <WatermarkPage />;
      case 'edit-pdf': return <EditPdfPage />;
      case 'ocr-pdf': return <OcrPdfPage />;
      default: return <MergePage />;
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Brand Name */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={handleHomeClick}
            >
              <Logo size="medium" className="transition-transform group-hover:scale-110" />
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-indigo-500 transition-all">
                  PhenomPDF
                </h1>
                <span className="text-xs text-gray-500 font-medium -mt-1">
                  Professional PDF Toolkit
                </span>
              </div>
            </div>

            {/* Desktop Navigation - All 8 tools visible */}
            <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className={`
                    px-3 lg:px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200
                    ${activeTab === tool.id && !showInfoPage
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                    }
                  `}
                >
                  {tool.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative w-full py-16 px-4 text-center">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                <Logo size="large" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              PhenomPDF
            </h2>
            <p className="text-sm sm:text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
              Merge, split, compress and convert PDFs with professional-grade tools.
              Fast, secure, and completely free.
            </p>
          </div>
        </div>
      </div>

      {/* Tool Cards Grid */}
      <div className="w-full max-w-7xl mx-auto px-4 py-10 md:py-14 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`
                  w-full group relative overflow-hidden rounded-2xl p-5 sm:p-6 text-left
                  transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1
                  active:scale-[0.98]
                  ${activeTab === tool.id
                    ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white text-gray-700 shadow-lg shadow-gray-200/50'
                  }
                `}
              >
                {/* Hover Glow Effect */}
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                  ${activeTab === tool.id
                    ? 'bg-gradient-to-br from-white/10 to-transparent'
                    : 'bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-transparent'
                  }
                `} />

                {/* Icon Container */}
                <div className={`
                  relative w-14 h-14 rounded-xl flex items-center justify-center mb-4
                  transition-all duration-300
                  ${activeTab === tool.id
                    ? 'bg-white/20 shadow-inner'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:scale-110 group-hover:shadow-md'
                  }
                `}>
                  <div className={activeTab === tool.id ? 'text-white' : 'text-blue-600'}>
                    <IconComponent />
                  </div>
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className={`
                    font-bold text-base md:text-lg mb-1 transition-colors
                    ${activeTab === tool.id ? 'text-white' : 'text-gray-900'}
                  `}>
                    {tool.label}
                  </h3>
                  <p className={`
                    text-xs md:text-sm leading-relaxed
                    ${activeTab === tool.id ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-600'}
                  `}>
                    {tool.description}
                  </p>
                </div>

                {/* Active Indicator */}
                {activeTab === tool.id && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-white rounded-full animate-pulse" />
                )}

                {/* Arrow on hover */}
                <div className={`
                  absolute bottom-4 right-4 transition-all duration-300
                  ${activeTab === tool.id
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                  }
                `}>
                  <svg className={`w-5 h-5 ${activeTab === tool.id ? 'text-white' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Navigation - Horizontal Scroll */}
      <div className="md:hidden w-full max-w-7xl mx-auto px-4 sm:px-6 -mt-4 mb-8">
        <nav className="flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide -mx-4 px-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`
                flex-shrink-0 px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap
                transition-all duration-200 flex items-center gap-2
                ${activeTab === tool.id && !showInfoPage
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50'
                }
              `}
            >
              <tool.icon />
              {tool.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pb-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderPage()}
        </div>
      </main>

      {/* Footer */}
      <Footer onNavigate={handleInfoPageClick} />
    </div>
  );
}
