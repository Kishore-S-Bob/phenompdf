import { useEffect } from 'react';

export default function ContactPage() {
  useEffect(() => {
    document.title = 'Contact – PhenomPDF';
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Contact Us
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">
            If you have questions, feedback, or issues with PhenomPDF, please contact us.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
            <p className="text-sm text-gray-500 mb-2">Contact Email</p>
            <a
              href="mailto:phenomstudios30@gmail.com"
              className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-500 hover:to-purple-500 transition-all"
            >
              phenomstudios30@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
