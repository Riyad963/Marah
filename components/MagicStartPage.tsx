
import React, { useEffect, useState } from 'react';

const MagicStartPage: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // إظهار اللوجو بعد لحظة قصيرة
    setTimeout(() => setShowLogo(true), 300);

    // مدة العرض قبل بدء الاختفاء
    const timer = setTimeout(() => {
      setIsExiting(true);
      // انتظار انتهاء أنيميشن الاختفاء قبل إلغاء التثبيت
      setTimeout(onFinish, 800);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#051810] transition-all duration-1000 ease-in-out ${
        isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* الخلفية الضبابية المتحركة - ألوان داكنة */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#1D3C2B] rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#356148] rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* الحاوية السحرية المركزية */}
      <div className="relative flex flex-col items-center justify-center">
        
        {/* الحلقة الخارجية - رادار */}
        <div className="absolute border border-white/5 w-80 h-80 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div className="absolute border border-white/5 w-60 h-60 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ animationDelay: '0.5s' }}></div>
        
        {/* الجوهر المشع والحاوية للوجو */}
        <div className="relative z-10 w-40 h-40 bg-gradient-to-br from-[#1D3C2B] via-[#2F5E45] to-[#1D3C2B] rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(47,94,69,0.5)] animate-[float_4s_ease-in-out_infinite]">
           {/* طبقة داخلية */}
           <div className="w-[9.5rem] h-[9.5rem] bg-[#051810] rounded-[2.2rem] flex items-center justify-center overflow-hidden relative border border-white/10">
              
              {/* حركة سائلة داخلية خلف اللوجو */}
              <div className="w-56 h-56 bg-white/5 rounded-[40%] animate-[spin_8s_linear_infinite] absolute -top-24 left-1/2 -translate-x-1/2 blur-md"></div>
              <div className="w-56 h-56 bg-white/5 rounded-[40%] animate-[spin_10s_linear_infinite] absolute -top-24 left-1/2 -translate-x-1/2 blur-md" style={{ animationDirection: 'reverse' }}></div>
              
              {/* شعار التطبيق */}
              <div className={`relative z-20 transition-all duration-1000 transform ${showLogo ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10'}`}>
                <img 
                   src="https://i.ibb.co/Tx36fB5C/20251228-105841.png" 
                   alt="Marah Logo" 
                   className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                />
                {/* لمعة على اللوجو */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent skew-x-12 translate-x-[-150%] animate-[shimmer_3s_infinite]"></div>
              </div>
           </div>
        </div>

      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(12deg); }
          50% { transform: translateX(150%) skewX(12deg); }
          100% { transform: translateX(150%) skewX(12deg); }
        }
      `}</style>
    </div>
  );
};

export default MagicStartPage;
