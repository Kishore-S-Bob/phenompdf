export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            PhenomPDF respects user privacy and is designed to process PDF files securely without storing personal data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">File Processing</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Uploaded files are used only for the requested operation.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Files are processed temporarily.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Uploaded files and generated results are automatically deleted after processing.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Data Collection</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>PhenomPDF does not store uploaded documents.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>PhenomPDF does not collect personal information.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Hosting & Logs</h2>
          <p className="text-gray-600 leading-relaxed">
            The hosting provider may collect technical logs such as IP address, request time, and browser type for operational purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We take reasonable measures to ensure files are processed securely.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Updates</h2>
          <p className="text-gray-600 leading-relaxed">
            This policy may be updated occasionally.
          </p>
        </section>
      </div>
    </div>
  );
}
