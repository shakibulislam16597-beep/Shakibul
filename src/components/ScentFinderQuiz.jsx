import React, { useState } from 'react';
import { SCENT_QUIZ_QUESTIONS } from '../data/banners';
import { MOCK_PRODUCTS } from '../data/products';
import { formatBDT } from '../utils/currency';
import { Sparkles, RotateCcw, ShoppingBag, ArrowRight, Check } from 'lucide-react';

/**
 * ScentFinderQuiz Component - Extrovat Lifestyle
 * Premium, clean fragrance recommendation quiz.
 */
export default function ScentFinderQuiz({ onAddToCart, products = MOCK_PRODUCTS }) {
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleSelectOption = (questionId, value) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);

    if (currentStep < SCENT_QUIZ_QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setShowResults(false);
  };

  const productsList = Array.isArray(products) && products.length > 0 ? products : MOCK_PRODUCTS;

  // Recommendations based on quiz answers
  const recommendedProducts = productsList.filter((p) => {
    if (answers.note && p.note === answers.note) return true;
    if (answers.strength && p.strength === answers.strength) return true;
    if (answers.occasion && p.occasion === answers.occasion) return true;
    return false;
  }).slice(0, 3);

  const activeQuestion = SCENT_QUIZ_QUESTIONS[currentStep];

  return (
    <section
      aria-label="Interactive fragrance quiz"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2"
    >
      <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 shadow-sm text-[#0E1330]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0E1330] text-[#FFC933]">
              <Sparkles className="w-4 h-4 fill-[#FFC933]" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-serif font-bold text-[#0E1330]">
                Fragrance Finder Quiz
              </h3>
              <p className="text-xs font-sans text-slate-500">
                Answer 3 quick questions to discover your signature scent
              </p>
            </div>
          </div>

          {showResults && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-[#0E1330] hover:text-[#C5A059] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retake
            </button>
          )}
        </div>

        {!showResults ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs font-sans font-semibold text-slate-500">
              <span>Question {currentStep + 1} of {SCENT_QUIZ_QUESTIONS.length}</span>
              <span className="text-[#C5A059]">
                {Math.round(((currentStep + 1) / SCENT_QUIZ_QUESTIONS.length) * 100)}% complete
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-serif font-semibold text-[#0E1330]">
              {activeQuestion.question}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {activeQuestion.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectOption(activeQuestion.id, opt.value)}
                  className="py-3.5 px-4 rounded-xl border border-slate-200 hover:border-[#0E1330] bg-slate-50/50 hover:bg-white text-[#0E1330] font-sans font-medium text-xs sm:text-sm transition-all text-left flex items-center justify-between cursor-pointer shadow-none hover:shadow-sm group active:scale-[0.99]"
                >
                  <span>{opt.label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0E1330] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/60 flex items-center gap-2.5">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs sm:text-sm font-sans font-semibold text-[#0E1330]">
                Based on your answers, we recommend these signature fragrances:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(recommendedProducts.length > 0 ? recommendedProducts : productsList.slice(0, 3)).map((prod) => (
                <div
                  key={prod.id}
                  className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-serif font-bold text-[#0E1330] truncate">
                        {prod.title}
                      </h5>
                      <span className="text-xs font-sans font-bold text-[#0E1330]">
                        {formatBDT(prod.price)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddToCart && onAddToCart(prod)}
                    className="w-full py-2 bg-[#0E1330] hover:bg-[#1e2550] text-white font-sans font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#FFC933]" />
                    <span>Add to cart</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
