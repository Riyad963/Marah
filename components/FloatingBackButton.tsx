
import React from 'react';

interface FloatingBackButtonProps {
  onClick: () => void;
  label?: string;
}

export default function FloatingBackButton({ onClick }: FloatingBackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-[120] w-10 h-10 bg-[#1D3C2B] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all duration-300 border border-white/40 group hover:bg-[#254d37]"
      aria-label="رجوع"
    >
      <div className="group-hover:-translate-x-0.5 transition-transform duration-300">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    </button>
  );
}
