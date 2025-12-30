
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface FloatingBackButtonProps {
  onClick: () => void;
  label?: string;
}

export default function FloatingBackButton({ onClick }: FloatingBackButtonProps) {
  const { language } = useLanguage();
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-[120] w-10 h-10 bg-[#1D3C2B] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all duration-300 border border-white/40 group hover:bg-[#254d37]`}
      aria-label="Back"
    >
      <div className={`group-hover:${language === 'ar' ? '-translate-x-0.5' : 'translate-x-0.5'} transition-transform duration-300 transform ${language === 'en' ? 'rotate-180' : ''}`}>
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    </button>
  );
}
