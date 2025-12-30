
import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [stage, setStage] = useState(0); // 0: Hidden, 1: Focus Entry, 2: Pulse, 3: Exit
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animation stages
    const timers = [
      setTimeout(() => setStage(1), 100),   // Start entry
      setTimeout(() => setStage(2), 1200),  // Start subtle pulse
      setTimeout(() => setStage(3), 3600),  // Start exit fade
      setTimeout(onFinish, 4000)            // Complete
    ];

    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 100 : p + 0.8));
    }, 20);

    return () => {
      timers.forEach(t => clearTimeout(t));
      clearInterval(interval);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[1000] bg-[#051810] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ${stage === 3 ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Ambient Moving Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,rgba(29,60,43,0.15)_0%,transparent_50%)] animate-slow-drift"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-[radial-gradient(circle_at_50%_50%,rgba(74,222,128,0.05)_0%,transparent_60%)] animate-slow-drift-reverse"></div>
      </div>

      {/* Logo Aura Glow */}
      <div className={`absolute w-64 h-64 bg-white/5 rounded-full blur-[60px] transition-all duration-1000 ${stage >= 1 ? 'opacity-40 scale-100' : 'opacity-0 scale-50'}`}></div>

      {/* Main Logo Subject */}
      <div className="relative z-10 flex flex-col items-center">
        <div 
          className="transition-all duration-[1500ms] cubic-bezier(0.19, 1, 0.22, 1)"
          style={{
            transform: stage === 0 
              ? 'perspective(1000px) translateZ(-100px) rotateX(20deg) scale(0.8)' 
              : stage >= 1 
              ? 'perspective(1000px) translateZ(0px) rotateX(0deg) scale(1)' 
              : 'scale(1)',
            filter: stage === 1 ? 'blur(10px)' : 'blur(0px)',
            opacity: stage >= 1 ? 1 : 0
          }}
        >
          <div className="relative group">
             {/* Inner Glow Pulse */}
             <div className={`absolute inset-0 bg-white/10 rounded-[2.5rem] blur-xl transition-opacity duration-1000 ${stage >= 2 ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
             
             <img 
                src="https://i.ibb.co/Tx36fB5C/20251228-105841.png" 
                alt="Marah Logo" 
                className={`w-36 h-36 lg:w-44 lg:h-44 object-contain relative z-10 transition-transform duration-[3000ms] ${stage >= 2 ? 'scale-105' : 'scale-100'}`}
                style={{
                  filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.2))'
                }}
             />
          </div>
        </div>

        {/* Elegant Minimal Progress Bar */}
        <div className={`mt-20 w-48 h-[2px] bg-white/5 rounded-full overflow-hidden transition-all duration-1000 delay-500 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          <div 
            className="h-full bg-gradient-to-r from-transparent via-[#4ade80] to-transparent transition-all duration-100 ease-out shadow-[0_0_15px_#4ade80]" 
            style={{ 
              width: `${progress}%`,
              boxShadow: '0 0 10px rgba(74,222,128,0.5)'
            }}
          ></div>
        </div>
      </div>

      <style>{`
        @keyframes slow-drift {
          0% { transform: translate(-5%, -5%) scale(1); }
          50% { transform: translate(5%, 5%) scale(1.1); }
          100% { transform: translate(-5%, -5%) scale(1); }
        }
        @keyframes slow-drift-reverse {
          0% { transform: translate(5%, 5%) scale(1.1); }
          50% { transform: translate(-5%, -5%) scale(1); }
          100% { transform: translate(5%, 5%) scale(1.1); }
        }
        .animate-slow-drift { animation: slow-drift 15s ease-in-out infinite; }
        .animate-slow-drift-reverse { animation: slow-drift-reverse 20s ease-in-out infinite; }
        
        .cubic-bezier-custom {
          transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
        }
      `}</style>
    </div>
  );
}
