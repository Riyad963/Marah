
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
    farmName: 'مراح البركة'
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

  // Styles
  const sectionClass = `rounded-[2rem] border p-6 mb-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`;
  const labelClass = `text-[10px] font-black uppercase tracking-widest mb-5 block ${isDarkMode ? 'text-green-400/80' : 'text-[#1D3C2B]/60'}`;
  const itemClass = `flex items-center justify-between py-4 border-b last:border-0 ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`;
  const iconBox = (color: string) => `w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/10 text-${color}-500`;

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col pb-40 px-4 overflow-y-auto no-scrollbar" dir="rtl">
      
      {/* 1. Header Visual */}
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

      {/* 2. الملف الشخصي (Profile) */}
      <div className={sectionClass}>
        <span className={labelClass}>الملف الشخصي والمزرعة</span>
        <div className={itemClass}>
           <div className="flex items-center gap-4">
              <div className={iconBox('indigo')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div className="flex flex-col">
                 <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}>{userData.name}</span>
                 <span className="text-[10px] font-bold opacity-40">{userData.role} • {userData.farmName}</span>
              </div>
           </div>
           <button className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-lg border border-indigo-400/20">تعديل</button>
        </div>
      </div>

      {/* 3. اللغة والتوطين (Language & Localization) */}
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

      {/* 4. المظهر (Appearance) */}
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

      {/* 5. إدارة القطيع (Herd Config) */}
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
        <p className={`text-[8px] font-bold opacity-40 mt-3 ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}>* سيقوم التطبيق بعرض بيانات الفئة المختارة فقط وتصفية بقية المحتوى.</p>
      </div>

      {/* إدارة العمال (Workers Management) */}
      <div className={sectionClass}>
        <span className={labelClass}>إدارة الموارد البشرية</span>
        <div className={itemClass} onClick={() => onNavigate?.('العمال')}>
            <div className="flex items-center gap-4">
                <div className={iconBox('blue')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>سجلات العمال والموظفين</span>
            </div>
            <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </div>
      </div>

      {/* 6. الأجهزة والتتبع (Devices & GPS) */}
      <div className={sectionClass}>
        <span className={labelClass}>الأجهزة وتكنولوجيا التتبع</span>
        <div className={itemClass}>
           <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>تكرار تحديث الـ GPS</span>
           <select 
             value={settings.gpsFrequency}
             onChange={(e) => updateSetting('gpsFrequency', e.target.value)}
             className={`text-xs font-black bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}
           >
              <option value="10" className="text-black">كل 10 ثوانٍ</option>
              <option value="30" className="text-black">كل 30 ثانية</option>
              <option value="60" className="text-black">كل دقيقة</option>
              <option value="300" className="text-black">كل 5 دقائق</option>
           </select>
        </div>
        <div className={itemClass}>
           <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>حساسية السياج الجغرافي</span>
           <span className="text-[10px] font-black text-green-500">عالية</span>
        </div>
      </div>

      {/* 7. التنبيهات والذكاء (Alerts & AI) */}
      <div className={sectionClass}>
        <span className={labelClass}>نظام التنبيهات والذكاء</span>
        <div className={itemClass}>
           <div className="flex items-center gap-4">
              <div className={iconBox('red')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              </div>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>التنبيهات الصوتية</span>
           </div>
           <button onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)} className={`w-12 h-6 rounded-full p-1 transition-all ${settings.soundEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.soundEnabled ? 'translate-x-0' : '-translate-x-6'}`}></div>
           </button>
        </div>
      </div>

      {/* 8. البيانات والتخزين (Data & Storage) */}
      <div className={sectionClass}>
        <span className={labelClass}>البيانات والتخزين السحابي</span>
        <div className={itemClass}>
           <span className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>المزامنة التلقائية</span>
           <button onClick={() => updateSetting('autoSync', !settings.autoSync)} className={`w-12 h-6 rounded-full p-1 transition-all ${settings.autoSync ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.autoSync ? 'translate-x-0' : '-translate-x-6'}`}></div>
           </button>
        </div>
        <div className={itemClass}>
           <button onClick={clearAppCache} className="text-xs font-bold text-red-500">حذف التخزين المؤقت (Reset)</button>
        </div>
      </div>

      {/* 9. الاشتراك (Subscription) */}
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

      {/* Footer Info */}
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
              
              {/* 1. Free Plan */}
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="text-white text-xl font-black">Free Plan</h3>
                          <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">الخطة المجانية</p>
                      </div>
                      <span className="text-white font-black text-lg">0$ <span className="text-[10px] opacity-40">/ سنوياً</span></span>
                  </div>
                  <div className="space-y-3 mb-6">
                      <div className="flex gap-2 text-white/70 text-xs font-bold items-start"><span className="text-green-500">✓</span> إدارة الماشية الأساسية (إضافة، فئات، ملاحظات)</div>
                      <div className="flex gap-2 text-white/70 text-xs font-bold items-start"><span className="text-green-500">✓</span> سجلات صحية أساسية (ملاحظات يدوية فقط)</div>
                      <div className="flex gap-2 text-white/70 text-xs font-bold items-start"><span className="text-green-500">✓</span> عرض البيانات داخل التطبيق (بدون تصدير)</div>
                      <div className="flex gap-2 text-white/70 text-xs font-bold items-start"><span className="text-green-500">✓</span> استخدام بدون إنترنت (تخزين محلي فقط)</div>
                  </div>
                  <button className="w-full py-4 rounded-2xl bg-white/10 text-white font-black text-sm opacity-50 cursor-default">خطتك الحالية</button>
              </div>

              {/* 2. Advanced Plan */}
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-600/20 border border-blue-500/30 rounded-[2.5rem] p-6 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 bg-blue-500 text-white text-[8px] font-black px-4 py-1 rounded-br-2xl">الأكثر طلباً</div>
                  <div className="flex justify-between items-start mb-4 mt-2">
                      <div>
                          <h3 className="text-white text-xl font-black">Advanced Plan</h3>
                          <p className="text-blue-300 text-[10px] font-bold tracking-widest uppercase">الخطة المتقدمة</p>
                      </div>
                      <span className="text-white font-black text-lg">20 USD <span className="text-[10px] opacity-40">/ سنوياً</span></span>
                  </div>
                  <div className="space-y-3 mb-6">
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-blue-400">✓</span> تتبع GPS أساسي (عرض الموقع + سياج واحد)</div>
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-blue-400">✓</span> إدارة الأعلاف (حاسبة الاستهلاك + تنبيهات المخزون)</div>
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-blue-400">✓</span> سجلات صحية متقدمة (تطعيمات + سجلات ولادة)</div>
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-blue-400">✓</span> تقارير احترافية (تصدير PDF و Excel)</div>
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-blue-400">✓</span> مستخدم واحد (المالك)</div>
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-blue-400">✓</span> استخدام بدون إنترنت + مزامنة أساسية</div>
                  </div>
                  <button 
                    onClick={() => handleUpgrade('advanced_20')}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm shadow-lg active:scale-95 transition-all"
                  >
                    {isProcessing ? "جاري..." : "اشترك الآن"}
                  </button>
              </div>

              {/* 3. Pro Plan */}
              <div className="bg-gradient-to-br from-amber-600/40 to-amber-900/20 border border-amber-500/50 rounded-[2.5rem] p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="text-amber-400 text-xl font-black">Pro Plan</h3>
                          <p className="text-amber-400/60 text-[10px] font-bold tracking-widest uppercase">باقة المحترفين</p>
                      </div>
                      <span className="text-white font-black text-lg">60 USD <span className="text-[10px] opacity-40">/ سنوياً</span></span>
                  </div>
                  <div className="space-y-3 mb-6">
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-amber-500">✓</span> المستشار الذكي AI (تحليل صحي + أمني + توصيات)</div>
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-amber-500">✓</span> تتبع GPS متطور (سياجات متعددة + تنبيهات مجدولة)</div>
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-amber-500">✓</span> شجرة العائلة الوراثية وسجلات التكاثر كاملة</div>
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-amber-500">✓</span> إدارة الموارد البشرية (أدوار وصلاحيات + سجلات عمال)</div>
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-amber-500">✓</span> تقارير مؤسسية (PDF و Excel جاهزة للتدقيق)</div>
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-amber-500">✓</span> دعم فني ذو أولوية</div>
                      <div className="flex gap-2 text-white text-xs font-bold items-start"><span className="text-amber-500">✓</span> مزامنة سحابية كاملة + وضع الأوفلاين</div>
                  </div>
                  <button 
                    onClick={() => handleUpgrade('pro_60')}
                    disabled={isProcessing}
                    className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black text-sm shadow-lg active:scale-95 transition-all"
                  >
                    {isProcessing ? "جاري..." : "تفعيل باقة الاحتراف"}
                  </button>
              </div>

           </div>
        </div>
      )}

      {onBack && <FloatingBackButton onClick={onBack} label="رجوع" />}
    </div>
  );
};

export default SettingsPage;
