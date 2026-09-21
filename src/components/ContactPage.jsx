import React, { useEffect } from 'react';
import { ArrowLeft, Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import { PHONE, WHATSAPP, STORE_EMAIL, STORE_ADDRESS, OPENING_HOURS } from '../config';

export default function ContactPage() {
  useEffect(() => {
    document.title = "Contact Us | Extrovat Lifestyle";
  }, []);

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
          <MessageSquare className="w-7 h-7 text-[#2436F5]" /> Contact Concierge
        </h1>
        <p className="text-xs font-sans text-[#5B6079] mt-1">
          Reach out to our fragrance specialists for order inquiries, scent consultations, or custom gifts.
        </p>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone Card */}
        <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[20px] p-5 shadow-[3px_3px_0px_#0E1330] flex items-start gap-4">
          <div className="p-3 bg-[#FFC933] text-[#0E1330] rounded-xl border-2 border-[#0E1330] shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-heading font-extrabold text-[#5B6079] uppercase tracking-wider">
              Customer Support Hotline
            </span>
            <a
              href={`tel:${PHONE}`}
              className="block font-heading font-extrabold text-base text-[#0E1330] hover:text-[#2436F5] hover:underline"
            >
              {PHONE}
            </a>
            <p className="text-xs font-sans text-[#5B6079]">
              Direct phone hotline for general & order assistance.
            </p>
          </div>
        </div>

        {/* WhatsApp Card */}
        <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[20px] p-5 shadow-[3px_3px_0px_#0E1330] flex items-start gap-4">
          <div className="p-3 bg-[#25D366] text-[#FFFFFF] rounded-xl border-2 border-[#0E1330] shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-heading font-extrabold text-[#5B6079] uppercase tracking-wider">
              Instant WhatsApp Consultation
            </span>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-heading font-extrabold text-base text-[#25D366] hover:underline"
            >
              +{WHATSAPP}
            </a>
            <p className="text-xs font-sans text-[#5B6079]">
              Chat live with a fragrance concierge.
            </p>
          </div>
        </div>

        {/* Email Card */}
        <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[20px] p-5 shadow-[3px_3px_0px_#0E1330] flex items-start gap-4">
          <div className="p-3 bg-[#2436F5] text-[#FFFFFF] rounded-xl border-2 border-[#0E1330] shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-heading font-extrabold text-[#5B6079] uppercase tracking-wider">
              Email Correspondence
            </span>
            <a
              href={`mailto:${STORE_EMAIL}`}
              className="block font-heading font-extrabold text-base text-[#0E1330] hover:text-[#2436F5] hover:underline break-all"
            >
              {STORE_EMAIL}
            </a>
            <p className="text-xs font-sans text-[#5B6079]">
              For corporate orders, press, and formal inquiries.
            </p>
          </div>
        </div>

        {/* Hours & Address Card */}
        <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[20px] p-5 shadow-[3px_3px_0px_#0E1330] flex items-start gap-4">
          <div className="p-3 bg-[#FAF8F5] text-[#0E1330] rounded-xl border-2 border-[#0E1330] shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <div>
              <span className="text-[10px] font-heading font-extrabold text-[#5B6079] uppercase tracking-wider">
                Concierge Hours
              </span>
              <p className="font-heading font-extrabold text-xs text-[#0E1330]">
                {OPENING_HOURS}
              </p>
            </div>
            <div className="pt-1 border-t border-[#E8E2D6]">
              <span className="text-[10px] font-heading font-extrabold text-[#5B6079] uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#2436F5]" /> Boutique Address
              </span>
              <p className="text-xs font-sans text-[#0E1330]">
                {STORE_ADDRESS}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="bg-[#25D366] text-[#FFFFFF] rounded-[24px] p-6 text-center border-2 border-[#0E1330] shadow-[4px_4px_0px_#0E1330] space-y-3">
        <h3 className="text-lg font-heading font-extrabold">
          Prefer real-time chat?
        </h3>
        <p className="text-xs font-sans text-[#FFFFFF]/90 max-w-sm mx-auto">
          Our team is online on WhatsApp to answer questions and take custom orders instantly.
        </p>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#FFFFFF] text-[#0E1330] font-heading font-extrabold text-xs uppercase tracking-wider rounded-full border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] hover:bg-[#F7F8FC] transition-all cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-[#25D366]" /> Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
