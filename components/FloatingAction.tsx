
import React from 'react';

interface FloatingActionProps {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}

export default function FloatingAction({ onClick, label, icon }: FloatingActionProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-4 lg:left-8 z-[90] group flex items-center justify-center p-0.5 rounded-[2rem] bg-gradient-to-br from-[#1D3C2B] via-[#2F5E45] to-[#1D3C2B] border-2 border-white shadow-[0_10px_25px_rgba(29,60,43,0.5)] hover:shadow-[0_15px_35px_rgba(29,60,43,0.6)] transition-all duration-500 active:scale-95 animate-fade-in"
    >
      <div className="bg-[#1D3C2B] text-white h-16 min-w-[4rem] px-1 rounded-[1.8rem] flex items-center justify-center gap-3 relative overflow-hidden transition-all duration-500 group-hover:px-6">
        
        {/* Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out"></div>

        {/* Icon */}
        <div className="relative z-10 w-7 h-7 flex items-center justify-center">
            {icon || (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            )}
        </div>

        {/* Label - Hidden initially or small, expands on hover or just stays compact */}
        <span className="relative z-10 font-bold text-sm whitespace-nowrap overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-500 opacity-0 group-hover:opacity-100">
          {label}
        </span>
      </div>
    </button>
  );
}
