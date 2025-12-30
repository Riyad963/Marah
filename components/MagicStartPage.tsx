
import React, { useEffect, useState } from 'react';

const MagicStartPage: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [stage, setStage] = useState(0); // 0: Start, 1: Energy Forming, 2: Logo Emergence, 3: Stable

  useEffect(() => {
    // Sequence timing
    const timers = [
      setTimeout(() => setStage(1), 100),   // Start forming energy field
      setTimeout(() => setStage(2), 1200),  // Logo emerges
      setTimeout(() => setStage(3), 4000),  // Stabilization
      setTimeout(() => setIsExiting(true), 4500), // Start fade out
      setTimeout(onFinish, 5300)            // Complete
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden bg-black transition-opacity duration-[800ms] ease-in-out ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 1. Subtle Cyan Ambient Glow */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${stage >= 1 ? 'opacity-30' : 'opacity-0'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-[radial-gradient(circle,rgba(0,242,255,0.2)_0%,transparent_70%)] blur-[80px]"></div>
      </div>

      {/* 2. Energy Force Field & Shockwaves */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Core Pulsing Ring */}
        <div className={`absolute border-[0.5px] border-cyan-400/30 rounded-full transition-all duration-1000 ease-out ${
          stage >= 1 ? 'w-64 h-64 opacity-100 scale-100' : 'w-0 h-0 opacity-0 scale-50'
        }`}>
          <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.2),inset_0_0_15px_rgba(34,211,238,0.1)]"></div>
        </div>

        {/* Dynamic Shockwaves */}
        {stage >= 1 && (
          <>
            <div className="absolute w-64 h-64 border border-cyan-500/20 rounded-full animate-shockwave-1"></div>
            <div className="absolute w-64 h-64 border border-cyan-500/10 rounded-full animate-shockwave-2"></div>
            <div className="absolute w-64 h-64 border border-cyan-500/5 rounded-full animate-shockwave-3"></div>
          </>
        )}
        
        {/* Spatial Distortion Hint (Simulated with rotating gradient) */}
        <div className={`absolute w-72 h-72 rounded-full transition-opacity duration-1000 ${stage >= 1 ? 'opacity-20' : 'opacity-0'} animate-[spin_10s_linear_infinite]`}>
           <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent,rgba(34,211,238,0.3),transparent)] blur-xl"></div>
        </div>
      </div>

      {/* 3. Main Subject: App Logo */}
      <div className="relative z-50 flex flex-col items-center justify-center">
        <div 
          className="transition-all duration-[2000ms] cubic-bezier(0.19, 1, 0.22, 1)"
          style={{
            transform: stage === 0 
              ? 'perspective(1200px) translateZ(-400px) rotateX(25deg) scale(0.6)' 
              : stage === 1 
              ? 'perspective(1200px) translateZ(-350px) rotateX(20deg) scale(0.7)'
              : stage === 2 
              ? 'perspective(1200px) translateZ(0px) rotateX(0deg) scale(1)'
              : 'perspective(1200px) translateZ(20px) rotateX(0deg) scale(1.02)',
            filter: stage < 2 ? 'blur(15px)' : 'blur(0px)',
            opacity: stage < 2 ? 0 : 1
          }}
        >
          <img 
            src="https://i.ibb.co/Tx36fB5C/20251228-105841.png" 
            alt="Marah Logo" 
            className="w-32 h-32 lg:w-40 lg:h-40 object-contain brightness-200 contrast-125"
            style={{ 
               filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.4))'
            }}
          />
        </div>
        
        {/* Subtle Brand Tagline */}
        <div className={`mt-8 transition-all duration-1000 ${stage >= 2 ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-4'}`}>
           <span className="text-white text-[10px] font-black uppercase tracking-[0.6em]">Premium Livestock OS</span>
        </div>
      </div>

      <style>{`
        @keyframes shockwave-1 {
          0% { transform: scale(0.8); opacity: 0; }
          20% { opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes shockwave-2 {
          0% { transform: scale(0.8); opacity: 0; }
          30% { opacity: 0.3; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes shockwave-3 {
          0% { transform: scale(0.8); opacity: 0; }
          40% { opacity: 0.1; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .animate-shockwave-1 { animation: shockwave-1 3s cubic-bezier(0.19, 1, 0.22, 1) infinite; }
        .animate-shockwave-2 { animation: shockwave-2 3s cubic-bezier(0.19, 1, 0.22, 1) infinite; animation-delay: 1s; }
        .animate-shockwave-3 { animation: shockwave-3 3s cubic-bezier(0.19, 1, 0.22, 1) infinite; animation-delay: 2s; }
      `}</style>
    </div>
  );
};

export default MagicStartPage;
