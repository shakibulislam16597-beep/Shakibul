import React, { useEffect } from 'react';
import { ArrowLeft, Sparkles, ShieldCheck, HeartHandshake, Compass } from 'lucide-react';
import { ABOUT_DATA } from '../data/pages';

export default function AboutPage() {
  useEffect(() => {
    document.title = "About Us | Extrovat Lifestyle";
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Back to Home Link */}
      <div>
        <a
          href="#/"
          className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-[#2436F5] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </a>
      </div>

      {/* Hero Header */}
      <div className="text-center space-y-3 border-b-2 border-[#0E1330] pb-8">
        <div className="w-16 h-16 bg-[#FFC933] rounded-full flex items-center justify-center mx-auto border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330]">
          <Sparkles className="w-8 h-8 text-[#0E1330]" />
        </div>
        <h1
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
          className="text-3xl sm:text-4xl font-bold text-[#0E1330] tracking-tight"
        >
          {ABOUT_DATA.title}
        </h1>
        <p className="text-xs sm:text-sm font-sans text-[#5B6079] max-w-xl mx-auto leading-relaxed">
          {ABOUT_DATA.subtitle}
        </p>
      </div>

      {/* Brand Story Section */}
      <div className="bg-[#FFFFFF] border-2 border-[#0E1330] rounded-[24px] p-6 sm:p-8 shadow-[4px_4px_0px_#0E1330] space-y-4">
        <h2
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
          className="text-2xl font-bold text-[#0E1330] border-b border-[#E8E2D6] pb-2"
        >
          Our Heritage & Craftsmanship
        </h2>
        <div className="space-y-3 text-xs sm:text-sm font-sans text-[#3A3F58] leading-relaxed">
          {ABOUT_DATA.storyParagraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>

      {/* Mission & Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FAF8F5] border-2 border-[#0E1330] rounded-[20px] p-5 shadow-[3px_3px_0px_#0E1330] space-y-2">
          <ShieldCheck className="w-6 h-6 text-[#2436F5]" />
          <h3 className="font-heading font-extrabold text-sm text-[#0E1330]">
            {ABOUT_DATA.values[0].title}
          </h3>
          <p className="text-xs font-sans text-[#5B6079]">
            {ABOUT_DATA.values[0].description}
          </p>
        </div>

        <div className="bg-[#FAF8F5] border-2 border-[#0E1330] rounded-[20px] p-5 shadow-[3px_3px_0px_#0E1330] space-y-2">
          <HeartHandshake className="w-6 h-6 text-[#C9A227]" />
          <h3 className="font-heading font-extrabold text-sm text-[#0E1330]">
            {ABOUT_DATA.values[1].title}
          </h3>
          <p className="text-xs font-sans text-[#5B6079]">
            {ABOUT_DATA.values[1].description}
          </p>
        </div>

        <div className="bg-[#FAF8F5] border-2 border-[#0E1330] rounded-[20px] p-5 shadow-[3px_3px_0px_#0E1330] space-y-2">
          <Compass className="w-6 h-6 text-[#2436F5]" />
          <h3 className="font-heading font-extrabold text-sm text-[#0E1330]">
            {ABOUT_DATA.values[2].title}
          </h3>
          <p className="text-xs font-sans text-[#5B6079]">
            {ABOUT_DATA.values[2].description}
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-[#0E1330] text-[#FFFFFF] rounded-[24px] p-8 text-center space-y-4 border-2 border-[#0E1330] shadow-[4px_4px_0px_#C9A227]">
        <h2
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
          className="text-2xl sm:text-3xl font-bold text-[#FFC933]"
        >
          {ABOUT_DATA.missionTitle}
        </h2>
        <p className="text-xs font-sans text-[#E8E2D6] max-w-lg mx-auto leading-relaxed">
          {ABOUT_DATA.missionText}
        </p>
        <a
          href="#/"
          className="inline-block px-8 py-3.5 bg-[#FFC933] text-[#0E1330] font-heading font-extrabold text-xs uppercase tracking-wider rounded-full border-2 border-[#0E1330] shadow-[3px_3px_0px_#FFFFFF] hover:bg-[#E5B520] transition-all cursor-pointer"
        >
          Shop Now
        </a>
      </div>
    </div>
  );
}
