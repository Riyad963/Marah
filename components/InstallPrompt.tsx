
import React, { useState, useEffect } from 'react';
import { soundService } from '../services/soundService.ts';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Check if already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
          setShowPrompt(true);
      }
    });

    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('Marah App was installed');
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    soundService.playClick();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-[150] flex justify-center px-4 animate-bounce-in">
      <div className="bg-[#1D3C2B] border-2 border-white/20 rounded-[2.5rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 max-w-sm w-full backdrop-blur-xl">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
          <img src="https://i.ibb.co/Tx36fB5C/20251228-105841.png" className="w-10 h-10 object-contain" alt="Logo" />
        </div>
        <div className="flex-1">
          <h4 className="text-white text-base font-black">ثبت تطبيق "مراح"</h4>
          <p className="text-white/60 text-[10px] font-bold">للوصول السريع وتتبع القطيع بدون إنترنت</p>
        </div>
        <div className="flex flex-col gap-2">
           <button 
             onClick={handleInstall}
             className="bg-white text-[#1D3C2B] px-4 py-2 rounded-xl text-xs font-black shadow-lg active:scale-95 transition-transform"
           >
             تثبيت الآن
           </button>
           <button 
             onClick={() => setShowPrompt(false)}
             className="text-white/40 text-[10px] font-bold hover:text-white"
           >
             ليس الآن
           </button>
        </div>
      </div>
    </div>
  );
}
