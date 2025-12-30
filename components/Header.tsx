
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ActivePage } from '../types.ts';
import { storageService } from '../services/storageService.ts';
import { soundService } from '../services/soundService.ts';
import { aiService } from '../services/aiService.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface HeaderProps {
  activePage: ActivePage;
  countryName: string;
}

export default function Header({ activePage, countryName }: HeaderProps) {
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  // Swipe logic refs
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  useEffect(() => {
    // Only used to keep Date updated if day changes
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    // Sync Status Logic
    const updateSyncStatus = () => {
      setSyncStatus(storageService.getSyncStatus());
    };

    window.addEventListener('online', updateSyncStatus);
    window.addEventListener('offline', updateSyncStatus);
    window.addEventListener('marah-sync-complete', () => setSyncStatus('synced'));
    
    // Check periodically for queue changes
    const syncCheck = setInterval(updateSyncStatus, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(syncCheck);
      window.removeEventListener('online', updateSyncStatus);
      window.removeEventListener('offline', updateSyncStatus);
    };
  }, []);

  // Fetch Smart Alerts on Mount
  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoadingAlerts(true);
      const aiAlerts = await aiService.generateSmartAlerts(language);
      
      if (aiAlerts && Array.isArray(aiAlerts)) {
        const formatted = aiAlerts.map((alert: any, index: number) => ({
          id: Date.now() + index,
          title: alert.title,
          message: `${alert.description} - ${alert.action}`,
          time: 'الآن',
          type: alert.severity === 'high' ? 'alert' : alert.severity === 'medium' ? 'warning' : 'success',
          originalSeverity: alert.severity, // Store original for sound logic
          source: alert.type === 'أمني' ? 'GPS' : 'Health' // Infer category
        }));
        
        setNotifications(formatted);
        setUnreadCount(formatted.length);
        
        // Smart Sound Logic Enforcement
        const criticalAlert = formatted.find((n: any) => n.originalSeverity === 'high');
        const warningAlert = formatted.find((n: any) => n.originalSeverity === 'medium');
        
        if (criticalAlert) {
            soundService.playSmartAlert('critical', criticalAlert.source, activePage);
        } else if (warningAlert) {
            soundService.playSmartAlert('medium', warningAlert.source, activePage);
        }
      }
      setIsLoadingAlerts(false);
    };

    fetchAlerts();
  }, [activePage, language]);

  const dateString = useMemo(() => {
    return currentTime.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, ' / ');
  }, [currentTime, language]);

  const isGPS = activePage === 'GPS';

  const getSyncIcon = () => {
    switch(syncStatus) {
      case 'offline': 
        return <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]"></span>;
      case 'syncing':
        return <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce shadow-[0_0_5px_orange]"></span>;
      default: // synced
        return <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_5px_lime]"></span>;
    }
  };

  const toggleNotifications = () => {
    soundService.playClick();
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
        setUnreadCount(0);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = (id: number) => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  // Helper to map page IDs to keys
  const getPageKey = (id: string) => {
    const map: Record<string, string> = {
        'الرئيسية': 'nav_home',
        'القطيع': 'nav_herd',
        'أعلاف': 'nav_feed',
        'GPS': 'nav_gps',
        'اجهزة': 'nav_devices',
        'السلالة': 'nav_breeds',
        'تقارير': 'nav_reports',
        'إعدادات': 'nav_settings',
        'العمال': 'work_team'
    };
    return map[id] || id;
  };

  return (
    <header className={`h-28 bg-gradient-to-b from-[#1D3C2B] via-[#1D3C2B]/80 to-transparent border-none shadow-none backdrop-blur-[2px] w-full transition-all duration-500 ${isGPS ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="max-w-full h-full px-4 lg:px-8 flex items-center justify-between relative">
        
        {showNotifications && (
            <div className={`absolute top-20 ${language === 'ar' ? 'left-8' : 'right-8'} w-80 bg-[#051810]/95 backdrop-blur-xl border border-white/20 rounded-[1.5rem] shadow-2xl z-[70] overflow-hidden animate-fade-in flex flex-col`}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h4 className="text-white text-sm font-black">{t('smart_alerts')}</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-white/50 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="max-h-60 overflow-y-auto no-scrollbar p-2 flex flex-col gap-2">
                    {isLoadingAlerts ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <p className="text-xs text-white/50">{t('analyzing')}</p>
                        </div>
                    ) : notifications.length > 0 ? notifications.map(notif => (
                        <div 
                            key={notif.id} 
                            className="bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer select-none touch-pan-y"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={() => onTouchEnd(notif.id)}
                        >
                            <div className="flex justify-between items-start mb-1 pointer-events-none">
                                <span className={`text-[11px] font-black ${notif.type === 'alert' ? 'text-red-400' : notif.type === 'warning' ? 'text-amber-400' : 'text-green-400'}`}>{notif.title}</span>
                                <span className="text-[10px] text-white/30 font-bold">{notif.time}</span>
                            </div>
                            <p className="text-[11px] text-white/80 font-bold pointer-events-none leading-relaxed">{notif.message}</p>
                        </div>
                    )) : (
                        <div className="p-4 text-center text-xs text-white/40">{t('no_alerts')}</div>
                    )}
                </div>
                <div className="p-3 border-t border-white/10 text-center">
                    <button onClick={() => setNotifications([])} className="text-[10px] text-white/50 font-bold hover:text-white">{t('clear_all')}</button>
                </div>
            </div>
        )}

        <div className="flex items-center gap-3 lg:gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full scale-150"></div>
            <img 
              src="https://i.ibb.co/Tx36fB5C/20251228-105841.png" 
              alt="Logo" 
              className="w-16 h-16 lg:w-28 lg:h-28 object-contain relative z-10 animate-logo-cinematic"
            />
          </div>

          <div className="flex flex-col justify-center items-start">
            <div className="text-white font-bold text-xl lg:text-3xl tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] leading-none whitespace-nowrap">
              {dateString}
            </div>
            <div className="flex items-center gap-2 mt-1 lg:mt-2">
              <div className="h-[2px] w-4 bg-white"></div>
              <span className="text-xs font-black text-white uppercase tracking-[0.25em] drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                {t(getPageKey(activePage))}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center items-end gap-3">
          <button 
            onClick={toggleNotifications}
            className="relative w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center border border-white/10 transition-all active:scale-95 group"
          >
             <svg className="w-5 h-5 text-white drop-shadow-md group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
             </svg>
             {unreadCount > 0 && (
                 <span className="absolute top-0 right-0 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 text-[8px] text-white items-center justify-center font-bold">{unreadCount}</span>
                 </span>
             )}
          </button>
          
          <div className="flex items-center gap-2 lg:gap-3">
             <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-full border border-white/5" title={syncStatus === 'offline' ? t('offline') : syncStatus === 'syncing' ? t('syncing') : t('synced')}>
               {getSyncIcon()}
               <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider hidden lg:block">
                 {syncStatus === 'offline' ? t('offline') : syncStatus === 'syncing' ? t('syncing') : 'SYNCED'}
               </span>
             </div>

             <div className="h-[2px] w-3 bg-white/20"></div>

             <div className="flex items-center gap-1.5">
               <span className="text-xs font-black text-white uppercase tracking-[0.1em] drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] whitespace-nowrap">
                  {t(countryName) !== countryName ? t(countryName) : countryName}
               </span>
               <svg className="w-3.5 h-3.5 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
               </svg>
             </div>
          </div>
        </div>
        
      </div>
    </header>
  );
}
