
import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [animate, setAnimate] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 100 : p + 1));
    }, 30);
    setTimeout(onFinish, 4000);
    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#EBF2E5] flex flex-col items-center justify-center">
      {/* Logo container using a darker shade or transparency for contrast */}
      <div className={`w-40 h-40 bg-[#1D3C2B]/10 rounded-3xl transition-all duration-1000 ${animate ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} flex items-center justify-center`}>
         <img 
            src="https://i.ibb.co/Tx36fB5C/20251228-105841.png" 
            alt="Logo" 
            className="w-24 h-24 object-contain"
         />
      </div>
      <div className="mt-20 w-80 h-1 bg-[#1D3C2B]/5 rounded-full overflow-hidden">
        <div className="h-full bg-[#1D3C2B] transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
