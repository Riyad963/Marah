
import React, { useState, useEffect } from 'react';
import { LivestockCategory, ActivePage } from '../types.ts';
import FloatingBackButton from '../components/FloatingBackButton.tsx';
import { storageService } from '../services/storageService.ts';
import { soundService } from '../services/soundService.ts';
import { paymentService } from '../services/paymentService.ts';

interface SettingsPageProps {
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  selectedCategory: LivestockCategory;
  setCategory: (category: LivestockCategory) => void;
  userCurrency: string;
  userRole: string;
  onBack?: () => void;
  onOpenKeySelector?: () => void;
  onNavigate?: (page: ActivePage) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  isDarkMode = false, 
  toggleTheme, 
  selectedCategory, 
  setCategory, 
  userCurrency, 
  userRole,
  onBack, 
  onOpenKeySelector,
  onNavigate
}) => {
  const [userData, setUserData] = useState({
    name: 'مستخدم جديد',
    plan: 'مجاني',
    role: userRole || 'مالك',
    farmName: 'مراح البركة',
    phone: '',
    country: ''
  });

  const [settings, setSettings] = useState({
    soundEnabled: true,
    notificationsEnabled: true,
    language: 'ar',
    gpsFrequency: '30',
    autoSync: true
  });

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalUserCount, setGlobalUserCount] = useState(1248);

  useEffect(() => {
    const profile = storageService.loadCached('marah_user_profile', null);
    if (profile) setUserData(prev => ({ ...prev, ...profile }));
    
    const savedSettings = storageService.loadCached('marah_app_settings', { soundEffects: true, language: 'ar', gpsFrequency: '30' });
    setSettings(prev => ({ 
      ...prev, 
      soundEnabled: savedSettings.soundEffects,
      language: savedSettings.language || 'ar',
      gpsFrequency: savedSettings.gpsFrequency || '30'
    }));

    setGlobalUserCount(storageService.getGlobalUserCount());
  }, []);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    storageService.save('marah_app_settings', { 
        soundEffects: newSettings.soundEnabled,
        language: newSettings.language,
        gpsFrequency: newSettings.gpsFrequency
    });
    soundService.playClick();
  };

  const handleUpgrade = async (planId: string) => {
    setIsProcessing(true);
    soundService.playClick();
    try {
      await paymentService.createCheckoutSession(planId, "user_123");
    } catch (e) {
      alert("فشل بدء عملية الدفع. يرجى المحاولة لاحقاً.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAppCache = () => {
      if(confirm('سيتم تسجيل خروجك وحذف البيانات المؤقتة. هل أنت متأكد؟')) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const sectionClass = `rounded-[2rem] border p-6 mb-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`;
  const labelClass = `text-[10px] font-black uppercase tracking-widest mb-5 block ${isDarkMode ? 'text-green-400/80' : 'text-[#1D3C2B]/60'}`;
  const itemClass = `flex items-center justify-between py-4 border-b last:border-0 ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`;
  const iconBox = (color: string) => `w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/10 text-${color}-500`;

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col pb-40 px-4 overflow-y-auto no-scrollbar" dir="rtl">
      
      <div className="py-10 flex flex-col items-center">
        <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#1D3C2B] to-[#051810] flex items-center justify-center shadow-2xl mb-4 border border-white/10 relative group">
           <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <img src="https://i.ibb.co/Tx36fB5C/20251228-105841.png" className="w-14 h-14 relative z-10" />
        </div>
        <h2 className={`${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'} text-2xl font-black`}>إعدادات المؤسسة</h2>
        <div className="flex flex-col items-center gap-1 mt-1">
          <p className={`${isDarkMode ? 'text-white/40' : 'text-[#1D3C2B]/40'} text-[10px] font-bold uppercase tracking-widest`}>Marah Control Center v2.0</p>
          <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-black text-green-500 uppercase tracking-tighter">إجمالي المستخدمين: {globalUserCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <span className={labelClass}>الملف الشخصي والحساب</span>
        <div className={itemClass}>
           <div className="flex items-center gap-4">
              <div className={iconBox('indigo')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div className="flex flex-col">
                 <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}>{userData.name}</span>
                 <span className="text-[10px] font-bold opacity-40">{userData.role} • {userData.farmName !== '-' ? userData.farmName : 'لا توجد مزرعة'}</span>
              </div>
           </div>
           <button className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-lg border border-indigo-400/20">تعديل</button>
        </div>
        <div className={itemClass}>
           <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>رقم الهاتف</span>
           <span className="text-xs font-black opacity-60 tracking-wider" dir="ltr">{userData.phone || '---'}</span>
        </div>
        <div className={itemClass}>
           <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>الدولة</span>
           <span className="text-xs font-black opacity-60">{userData.country || '---'}</span>
        </div>
      </div>

      <div className={sectionClass}>
        <span className={labelClass}>اللغة والتوطين</span>
        <div className={itemClass}>
           <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>لغة النظام والتقارير</span>
           <select 
             value={settings.language} 
             onChange={(e) => updateSetting('language', e.target.value)}
             className={`text-xs font-black bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}
           >
              <option value="ar" className="text-black">العربية</option>
              <option value="en" className="text-black">English</option>
              <option value="tr" className="text-black">Türkçe</option>
           </select>
        </div>
        <div className={itemClass}>
           <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>العملة المعتمدة</span>
           <span className="text-xs font-black opacity-40">{userCurrency}</span>
        </div>
      </div>

      <div className={sectionClass}>
        <span className={labelClass}>المظهر والتجربة</span>
        <div className={itemClass}>
           <div className="flex items-center gap-4">
              <div className={iconBox('yellow')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>الوضع الليلي (Dark)</span>
           </div>
           <button onClick={toggleTheme} className={`w-12 h-6 rounded-full p-1 transition-all ${isDarkMode ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-0' : '-translate-x-6'}`}></div>
           </button>
        </div>
      </div>

      <div className={sectionClass}>
        <span className={labelClass}>إدارة فئة الماشية النشطة</span>
        <div className={itemClass}>
            <div className="flex items-center gap-4">
                <div className={iconBox('green')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>الفئة المحددة للتطبيق</span>
            </div>
            <select 
                value={selectedCategory}
                onChange={(e) => { soundService.playClick(); setCategory(e.target.value as LivestockCategory); }}
                className={`text-xs font-black bg-transparent outline-none border-b-2 border-green-500 pb-1 ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}
            >
                <option value="أغنام" className="text-black">أغنام</option>
                <option value="ماعز" className="text-black">ماعز</option>
                <option value="أبقار" className="text-black">أبقار</option>
            </select>
        </div>
      </div>

      <div className={sectionClass}>
        <span className={labelClass}>البيانات والتخزين</span>
        <div className={itemClass}>
           <button onClick={clearAppCache} className="text-xs font-bold text-red-500">حذف التخزين المؤقت وتسجيل الخروج</button>
        </div>
      </div>

      <div className="mb-6">
        <button 
          onClick={() => setShowSubscriptionModal(true)}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-700 text-black p-6 rounded-[2rem] font-black text-sm flex items-center justify-between shadow-xl active:scale-95 transition-all border-2 border-white/20"
        >
          <div className="flex items-center gap-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
              <div className="text-right">
                <span className="block">إدارة باقات الاشتراك</span>
                <span className="text-[9px] font-bold opacity-60">اختر الخطة المناسبة لاحتياجاتك</span>
              </div>
          </div>
          <span className="bg-black/10 px-4 py-2 rounded-xl">عرض الخطط</span>
        </button>
      </div>

      <div className="mt-6 flex justify-between items-center opacity-40 px-6">
          <span className="text-[8px] font-black uppercase tracking-widest text-white">Marah OS v2.0.5</span>
          <span className="text-[8px] font-black uppercase tracking-widest text-white">Enterprise Edition</span>
      </div>

      {showSubscriptionModal && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col p-6 animate-fade-in text-right overflow-y-auto no-scrollbar" dir="rtl">
           <div className="flex justify-between items-center mb-8 shrink-0">
                <h2 className="text-white text-2xl font-black">خطط الاشتراك السنوية</h2>
                <button onClick={() => setShowSubscriptionModal(false)} className="text-white/50 p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
           </div>
           <div className="flex flex-col gap-6 pb-20">
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="text-white text-xl font-black">Free Plan</h3>
                          <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">الخطة المجانية</p>
                      </div>
                      <span className="text-white font-black text-lg">0$ <span className="text-[10px] opacity-40">/ سنوياً</span></span>
                  </div>
                  <button className="w-full py-4 rounded-2xl bg-white/10 text-white font-black text-sm opacity-50 cursor-default">خطتك الحالية</button>
              </div>
           </div>
        </div>
      )}

      {onBack && <FloatingBackButton onClick={onBack} label="رجوع" />}
    </div>
  );
};

export default SettingsPage;
