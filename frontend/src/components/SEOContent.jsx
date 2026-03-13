import React from 'react';

const SEOContent = ({ toolName, description, faqs = [], relatedTools = [], onToolClick }) => {
  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      {/* Tool Description Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About {toolName}</h2>
        <p className="text-gray-600 leading-relaxed">
          {description}
        </p>
      </section>

      {/* FAQ Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Is PhenomPDF free to use?</h3>
            <p className="text-gray-600">Yes, all tools on PhenomPDF are free and work directly in your browser.</p>
          </div>
        </div>
      </section>

      {/* Related Tools Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">You may also like</h2>
        <div className="flex flex-wrap gap-4">
          {relatedTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolClick(tool.id)}
              className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {tool.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SEOContent;
