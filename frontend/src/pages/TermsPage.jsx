import { useEffect } from 'react';

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Service – PhenomPDF';
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Terms of Service
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Usage</h2>
          <p className="text-gray-600 leading-relaxed">
            PhenomPDF provides free tools for processing PDF files such as merging, splitting, compressing, and converting.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">User Responsibility</h2>
          <p className="text-gray-600 leading-relaxed">
            Users are responsible for the files they upload and must not upload illegal or harmful content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Service Availability</h2>
          <p className="text-gray-600 leading-relaxed">
            The service is provided "as is" without guarantee of uptime or uninterrupted access.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            PhenomPDF is not responsible for data loss or damages resulting from use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Changes to Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            These terms may change over time.
          </p>
        </section>
      </div>
    </div>
  );
}
