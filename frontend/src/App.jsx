import { useState } from 'react';
import MergePage from './pages/MergePage';
import SplitPage from './pages/SplitPage';
import CompressPage from './pages/CompressPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('merge');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-md p-1 inline-flex">
            <button
              onClick={() => setActiveTab('merge')}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                ${activeTab === 'merge'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Merge PDF
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                ${activeTab === 'split'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Split PDF
            </button>
            <button
              onClick={() => setActiveTab('compress')}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                ${activeTab === 'compress'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Compress PDF
            </button>
          </div>
        </div>

        {/* Page Content */}
        {activeTab === 'merge' ? <MergePage /> : activeTab === 'split' ? <SplitPage /> : <CompressPage />}
      </div>
    </div>
  );
}
