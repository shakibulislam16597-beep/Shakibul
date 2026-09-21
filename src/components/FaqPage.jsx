import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import { FAQ_DATA } from '../data/pages';
import { WHATSAPP } from '../config';

export default function FaqPage() {
  useEffect(() => {
    document.title = "Frequently Asked Questions | Extrovat Lifestyle";
  }, []);

  const [expandedId, setExpandedId] = useState(FAQ_DATA[0]?.id || null);

  const toggleAccordion = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="border-b-2 border-[#0E1330] pb-4">
        <a
          href="#/"
          className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-[#2436F5] hover:underline mb-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </a>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0E1330] flex items-center gap-2">
          <HelpCircle className="w-7 h-7 text-[#2436F5]" /> Frequently Asked Questions
        </h1>
        <p className="text-xs font-sans text-[#5B6079] mt-1">
          Everything you need to know about ordering, delivery, payments, and fragrance care in Bangladesh.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {FAQ_DATA.map((faq, index) => {
          const isExpanded = expandedId === faq.id;
          const contentId = `faq-content-${faq.id}`;
          const buttonId = `faq-button-${faq.id}`;

          return (
            <div
              key={faq.id}
              className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[18px] overflow-hidden shadow-[3px_3px_0px_#0E1330] transition-all"
            >
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isExpanded}
                  aria-controls={contentId}
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full text-left py-4 px-5 flex items-center justify-between gap-3 font-heading font-extrabold text-sm text-[#0E1330] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
                >
                  <span>
                    {index + 1}. {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#2436F5] shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </h3>

              {isExpanded && (
                <div
                  id={contentId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="px-5 pb-5 pt-1 border-t border-[#E8E2D6] text-xs font-sans text-[#3A3F58] leading-relaxed animate-in fade-in duration-150"
                >
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Need More Help Box */}
      <div className="bg-[#FFC933] border-2 border-[#0E1330] rounded-[20px] p-6 shadow-[4px_4px_0px_#0E1330] text-center space-y-3">
        <h3 className="text-lg font-heading font-extrabold text-[#0E1330]">
          Still have questions?
        </h3>
        <p className="text-xs font-sans text-[#0E1330]">
          Our fragrance concierges are ready to assist you on WhatsApp.
        </p>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-[#FFFFFF] font-heading font-extrabold text-xs uppercase tracking-wider rounded-full border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] hover:bg-[#20bd5a] transition-all cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" /> Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
