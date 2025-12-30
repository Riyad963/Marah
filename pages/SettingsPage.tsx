
import React, { useState, useEffect } from 'react';
import { LivestockCategory, ActivePage } from '../types.ts';
import FloatingBackButton from '../components/FloatingBackButton.tsx';
import { storageService } from '../services/storageService.ts';
import { soundService } from '../services/soundService.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

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
  const { t, language, setLanguage } = useLanguage();
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
    gpsAlerts: true,
    healthAlerts: true,
    feedAlerts: true,
    birthAlerts: true,
    language: language,
    gpsFrequency: '30',
    autoSync: true,
    cloudBackup: false
  });

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(storageService.getLastSyncTime());
  const [editFormData, setEditFormData] = useState({ ...userData });

  useEffect(() => {
    const profile = storageService.loadCached('marah_user_profile', null);
    if (profile) {
        const data = {
            name: profile.name || 'مستخدم جديد',
            plan: profile.plan || 'مجاني',
            role: profile.role || userRole || 'مالك',
            farmName: profile.farmName || 'مراح البركة',
            phone: profile.phone || '',
            country: profile.country || ''
        };
        setUserData(data);
        setEditFormData(data);
    }
    
    const savedSettings = storageService.loadCached('marah_app_settings', { 
        soundEffects: true, 
        notificationsEnabled: true,
        gpsAlerts: true,
        healthAlerts: true,
        feedAlerts: true,
        birthAlerts: true,
        language: language, 
        gpsFrequency: '30', 
        cloudBackup: false 
    });

    setSettings({ 
      soundEnabled: savedSettings.soundEffects ?? true,
      notificationsEnabled: savedSettings.notificationsEnabled ?? true,
      gpsAlerts: savedSettings.gpsAlerts ?? true,
      healthAlerts: savedSettings.healthAlerts ?? true,
      feedAlerts: savedSettings.feedAlerts ?? true,
      birthAlerts: savedSettings.birthAlerts ?? true,
      language: language,
      gpsFrequency: savedSettings.gpsFrequency || '30',
      autoSync: true,
      cloudBackup: savedSettings.cloudBackup || false
    });
  }, [userRole, language]);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (key === 'language') {
        setLanguage(value);
    }

    storageService.save('marah_app_settings', { 
        soundEffects: newSettings.soundEnabled,
        notificationsEnabled: newSettings.notificationsEnabled,
        gpsAlerts: newSettings.gpsAlerts,
        healthAlerts: newSettings.healthAlerts,
        feedAlerts: newSettings.feedAlerts,
        birthAlerts: newSettings.birthAlerts,
        language: value,
        gpsFrequency: newSettings.gpsFrequency,
        cloudBackup: newSettings.cloudBackup
    });
    soundService.playClick();
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    soundService.playClick();
    const success = await storageService.syncPendingData();
    if (success) {
      setLastSync(storageService.getLastSyncTime());
      soundService.playSuccess();
    } else {
      soundService.playError();
    }
    setIsSyncing(false);
  };

  const saveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setUserData(editFormData);
      await storageService.save('marah_user_profile', editFormData);
      soundService.playSuccess();
      setIsEditingProfile(false);
  };

  const clearAppCache = () => {
      if(confirm(t('confirm_logout'))) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const sectionClass = `rounded-[2.5rem] border p-6 mb-5 shadow-2xl backdrop-blur-md transition-all duration-500 ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-100'}`;
  const labelClass = `text-[11px] font-black uppercase tracking-[0.2em] mb-4 block ${isDarkMode ? 'text-green-400/60' : 'text-[#1D3C2B]/40'}`;
  const itemClass = `flex items-center justify-between py-4 border-b last:border-0 ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`;
  const iconBox = (color: string) => `w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/10 text-${color}-500 border border-${color}-500/20`;

  const inputClasses = `w-full h-12 rounded-xl px-4 font-bold text-sm outline-none transition-all ${isDarkMode ? 'bg-white/5 border border-white/10 text-white focus:border-green-400 focus:bg-white/10' : 'bg-gray-100 border border-gray-200 text-[#1D3C2B] focus:border-green-600 focus:bg-white'}`;

  const Toggle = ({ active, onClick, color = 'emerald' }: { active: boolean, onClick: () => void, color?: string }) => (
    <button 
      onClick={onClick} 
      className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${active ? `bg-${color}-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]` : 'bg-white/10'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${active ? (language === 'ar' ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'}`}></div>
    </button>
  );

  return (
    <div className={`w-full max-w-md mx-auto h-full flex flex-col pb-40 px-5 overflow-y-auto no-scrollbar scroll-smooth`}>
      
      {/* Header Profile Section */}
      <div className="py-10 flex flex-col items-center animate-fade-in">
        <div className="relative group">
            <div className="absolute inset-0 bg-green-500/30 blur-3xl rounded-full scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#1D3C2B] to-[#0A1A12] flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] mb-4 border border-white/10 relative z-10">
               <img src="https://i.ibb.co/Tx36fB5C/20251228-105841.png" className="w-14 h-14 animate-logo-cinematic" alt="Marah Logo" />
            </div>
            <div className={`absolute -bottom-2 ${language === 'ar' ? 'right-0' : 'left-0'} bg-green-500 w-7 h-7 rounded-full border-4 border-[#051810] flex items-center justify-center shadow-lg`}>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
            </div>
        </div>
        <h2 className={`${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'} text-2xl font-black tracking-tight`}>{t('settings_title')}</h2>
        <span className="text-[11px] font-bold opacity-30 tracking-[0.3em] uppercase mt-1">Marah Livestock OS</span>
      </div>

      {/* Account Card */}
      <div className={sectionClass}>
        <span className={labelClass}>{t('profile')}</span>
        <div className={itemClass}>
           <div className="flex items-center gap-4">
              <div className={iconBox('indigo')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div className="flex flex-col">
                 <span className={`text-base font-black leading-tight ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}>{userData.name}</span>
                 <span className="text-[11px] font-bold opacity-40 mt-1">
                    {t(userData.role.toLowerCase())} • {userData.farmName || 'مراح البركة'}
                 </span>
              </div>
           </div>
           <button 
             onClick={() => { soundService.playClick(); setIsEditingProfile(true); }}
             className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${isDarkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-black/5 text-[#1D3C2B]'} border border-white/5 shadow-inner`}
           >
             {t('edit')}
           </button>
        </div>
        <div className={itemClass}>
           <span className={`text-sm font-bold ${isDarkMode ? 'text-white/70' : 'text-[#1D3C2B]/70'}`}>{t('phone')}</span>
           <span className="text-sm font-black opacity-40 tracking-wider" dir="ltr">{userData.phone || t('not_registered')}</span>
        </div>
        <div className={itemClass}>
           <span className={`text-sm font-bold ${isDarkMode ? 'text-white/70' : 'text-[#1D3C2B]/70'}`}>{t('location')}</span>
           <span className="text-sm font-black opacity-40">{t(userData.country.toLowerCase()) !== userData.country.toLowerCase() ? t(userData.country.toLowerCase()) : userData.country}</span>
        </div>
      </div>

      {/* Notifications Card */}
      <div className={sectionClass}>
        <span className={labelClass}>{t('notifications_smart')}</span>
        
        <div className={itemClass}>
           <div className="flex items-center gap-4">
              <div className={iconBox('orange')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              </div>
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>{t('sound_effects')}</span>
           </div>
           <Toggle active={settings.soundEnabled} onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)} color="orange" />
        </div>

        <div className={itemClass}>
           <div className="flex items-center gap-4">
              <div className={iconBox('emerald')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>{t('system_notifs')}</span>
           </div>
           <Toggle active={settings.notificationsEnabled} onClick={() => updateSetting('notificationsEnabled', !settings.notificationsEnabled)} color="emerald" />
        </div>

        <div className="pt-5 mt-5 border-t border-white/5 space-y-4">
           <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDarkMode ? 'text-white/50' : 'text-[#1D3C2B]/50'}`}>{t('gps_alerts')}</span>
              <Toggle active={settings.gpsAlerts} onClick={() => updateSetting('gpsAlerts', !settings.gpsAlerts)} color="blue" />
           </div>
           <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDarkMode ? 'text-white/50' : 'text-[#1D3C2B]/50'}`}>{t('health_alerts')}</span>
              <Toggle active={settings.healthAlerts} onClick={() => updateSetting('healthAlerts', !settings.healthAlerts)} color="rose" />
           </div>
           <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isDarkMode ? 'text-white/50' : 'text-[#1D3C2B]/50'}`}>{t('feed_alerts')}</span>
              <Toggle active={settings.feedAlerts} onClick={() => updateSetting('feedAlerts', !settings.feedAlerts)} color="amber" />
           </div>
        </div>
      </div>

      {/* Cloud Sync Card */}
      <div className={sectionClass}>
        <span className={labelClass}>{t('cloud_backup')}</span>
        <div className={itemClass}>
           <div className="flex items-center gap-4">
              <div className={iconBox('blue')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
              </div>
              <div>
                <span className={`text-sm font-bold block ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>{t('cloud_active')}</span>
                <span className="text-[10px] opacity-40 font-bold block mt-1">{t('cloud_desc')}</span>
              </div>
           </div>
           <Toggle active={settings.cloudBackup} onClick={() => updateSetting('cloudBackup', !settings.cloudBackup)} color="blue" />
        </div>
        {settings.cloudBackup && (
          <div className="pt-5 mt-5 border-t border-white/5 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{t('last_sync')}</span>
                  <span className="text-xs font-black text-blue-400 mt-1">{lastSync}</span>
               </div>
               <button 
                onClick={handleManualSync}
                disabled={isSyncing}
                className={`px-5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black flex items-center gap-2 ${isSyncing ? 'opacity-50' : 'active:scale-95'}`}
               >
                 {isSyncing && <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>}
                 {t('manual_sync')}
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Card */}
      <div className="mb-8 px-1">
        <button 
          onClick={() => setShowSubscriptionModal(true)}
          className="w-full bg-gradient-to-br from-amber-500 to-amber-700 p-[1px] rounded-[2rem] shadow-[0_20px_40px_rgba(245,158,11,0.2)] active:scale-95 transition-all group"
        >
          <div className="bg-[#051810]/90 backdrop-blur-md rounded-[2rem] p-6 flex items-center justify-between border border-white/5">
              <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-amber-500/20 rounded-[1.5rem] flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
                  </div>
                  <div className={`text-${language === 'ar' ? 'right' : 'left'}`}>
                    <span className="block text-base font-black text-white leading-none">{t('subscriptions')}</span>
                    <span className="text-[10px] font-bold text-amber-500/60 mt-1 block">{t('upgrade_plan')}</span>
                  </div>
              </div>
              <svg className="w-5 h-5 text-amber-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>
      </div>

      {/* Language & Localisation */}
      <div className={sectionClass}>
        <span className={labelClass}>{t('lang_loc')}</span>
        <div className={itemClass}>
           <span className={`text-sm font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>{t('display_lang')}</span>
           <select 
             value={settings.language} 
             onChange={(e) => updateSetting('language', e.target.value)}
             className={`text-sm font-black bg-transparent outline-none border-b-2 border-green-500 pb-1 ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}
           >
              <option value="ar" className="text-black">العربية</option>
              <option value="en" className="text-black">English</option>
              <option value="tr" className="text-black">Türkçe</option>
           </select>
        </div>
        <div className={itemClass}>
           <span className={`text-sm font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>{t('currency')}</span>
           <span className="text-sm font-black opacity-40">{userCurrency}</span>
        </div>
      </div>

      {/* Active Category */}
      <div className={sectionClass}>
        <span className={labelClass}>{t('active_category')}</span>
        <div className={itemClass}>
            <div className="flex items-center gap-4">
                <div className={iconBox('emerald')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <span className={`text-sm font-bold ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]'}`}>{t('selected_category')}</span>
            </div>
            <select 
                value={selectedCategory}
                onChange={(e) => { soundService.playClick(); setCategory(e.target.value as LivestockCategory); }}
                className={`text-sm font-black bg-transparent outline-none border-b-2 border-green-500 pb-1 ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}
            >
                <option value="أغنام" className="text-black">{t('sheep')}</option>
                <option value="ماعز" className="text-black">{t('goats')}</option>
                <option value="أبقار" className="text-black">{t('cows')}</option>
            </select>
        </div>
      </div>

      {/* Storage & Danger Zone */}
      <div className={sectionClass}>
        <span className={labelClass}>{t('storage_system')}</span>
        <div className={itemClass}>
           <button onClick={clearAppCache} className="text-sm font-bold text-rose-500 hover:opacity-70 transition-all flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {t('clear_cache')}
           </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center opacity-20 px-6 gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Marah OS v2.1.0</span>
          <span className="text-[9px] font-bold text-white uppercase tracking-widest">Powered by Enterprise Neural Engine</span>
      </div>

      {/* Edit Profile Popup */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
            <div className={`w-full max-w-sm rounded-[3rem] p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative border border-white/10 ${isDarkMode ? 'bg-[#0A1A12]' : 'bg-white'}`}>
                <h3 className={`text-xl font-black mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}>{t('edit_profile')}</h3>
                <form onSubmit={saveProfile} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className={`text-[10px] font-black opacity-40 block px-1 tracking-widest uppercase`}>{t('user_name')}</label>
                        <input 
                            type="text" 
                            required 
                            value={editFormData.name} 
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className={inputClasses}
                        />
                    </div>
                    {userData.role === 'مالك' && (
                        <div className="space-y-1.5">
                            <label className={`text-[10px] font-black opacity-40 block px-1 tracking-widest uppercase`}>{t('farm_name')}</label>
                            <input 
                                type="text" 
                                required 
                                value={editFormData.farmName} 
                                onChange={(e) => setEditFormData({ ...editFormData, farmName: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label className={`text-[10px] font-black opacity-40 block px-1 tracking-widest uppercase`}>{t('phone')}</label>
                        <input 
                            type="tel" 
                            required 
                            value={editFormData.phone} 
                            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                            className={inputClasses}
                            dir="ltr"
                        />
                    </div>
                    <div className="flex flex-col gap-4 pt-4">
                        <button type="submit" className="h-14 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-emerald-500 transition-all active:scale-95">{t('save_changes')}</button>
                        <button type="button" onClick={() => setIsEditingProfile(false)} className={`h-14 rounded-2xl font-black text-sm ${isDarkMode ? 'bg-white/5 text-white border border-white/10' : 'bg-gray-100 text-gray-500'}`}>{t('cancel')}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {onBack && <FloatingBackButton onClick={onBack} />}
    </div>
  );
};

export default SettingsPage;
