
import React, { useState } from 'react';
import { LivestockCategory } from '../types.ts';
import { storageService } from '../services/storageService.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface AuthPageProps {
  onLogin: (countryName: string, role: string, currency: string) => void;
}

type UserRole = 'مالك' | 'مشرف' | 'عامل' | 'بيطري';
type AuthMode = 'login' | 'signup';

const COUNTRIES = [
  { code: 'SA', name: 'saudi', flag: '🇸🇦', prefix: '+966', currency: 'SAR' },
  { code: 'AE', name: 'uae', flag: '🇦🇪', prefix: '+971', currency: 'AED' },
  { code: 'KW', name: 'kuwait', flag: '🇰🇼', prefix: '+965', currency: 'KWD' },
  { code: 'QA', name: 'qatar', flag: '🇶🇦', prefix: '+974', currency: 'QAR' },
  { code: 'OM', name: 'oman', flag: '🇴🇲', prefix: '+968', currency: 'OMR' },
  { code: 'BH', name: 'bahrain', flag: '🇧🇭', prefix: '+973', currency: 'BHD' },
  // ... other countries mapped similarly if needed, keeping it short for this implementation
];

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'مالك', label: 'owner' },
  { id: 'مشرف', label: 'supervisor' },
  { id: 'بيطري', label: 'vet' },
  { id: 'عامل', label: 'worker' },
];

const CATEGORIES: { id: LivestockCategory, label: string }[] = [
  { id: 'أغنام', label: 'sheep' },
  { id: 'ماعز', label: 'goats' },
  { id: 'أبقار', label: 'cows' },
];

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>('login');
  const [accessCode, setAccessCode] = useState(''); 
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    farmName: '',
    phone: '',
    password: '',
    role: 'مالك' as UserRole,
    category: 'أغنام' as LivestockCategory,
    countryCode: 'SA'
  });

  const selectedCountry = COUNTRIES.find(c => c.code === formData.countryCode) || COUNTRIES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'signup' && formData.role !== 'مالك') {
        const workersList: any[] = await storageService.load('marah_workers', []);
        const validInvitation = workersList.find(w => w.accessCode === accessCode && w.role === formData.role);
        if (!validInvitation) {
            setErrorMsg(t('error_code'));
            return;
        }
    }

    // تجهيز رقم الهاتف الدولي الكامل
    const fullPhone = `${selectedCountry.prefix} ${formData.phone}`;

    // Note: We are saving country *name key* or name? 
    // To respect "No Arabic", we should save the English name or Key?
    // User profile stores "country". Header uses it. 
    // Let's store the Key (e.g., 'saudi'). Header will translate it.
    
    const userProfile = {
      name: formData.name || 'User',
      farmName: formData.role === 'مالك' ? (formData.farmName || 'My Farm') : '-',
      phone: fullPhone,
      role: formData.role,
      country: selectedCountry.name, 
      currency: selectedCountry.currency,
      email: '', 
      plan: 'مجاني' 
    };
    
    // حفظ البيانات محلياً قبل الانتقال
    const existing = await storageService.load('marah_user_profile', null);
    
    // إذا كان وضع إنشاء حساب أو لا توجد بيانات سابقة، نحفظ البيانات الجديدة
    if (mode === 'signup' || !existing) {
       await storageService.save('marah_user_profile', userProfile);
       if (mode === 'signup') {
         storageService.incrementGlobalUserCount();
       }
    } else if (mode === 'login' && existing) {
       // في وضع تسجيل الدخول، إذا كانت هناك بيانات مخزنة، نستخدمها ونحدث الهاتف فقط إذا تم إدخاله
       const updatedProfile = { ...existing, phone: fullPhone };
       await storageService.save('marah_user_profile', updatedProfile);
    }

    onLogin(selectedCountry.name, formData.role, selectedCountry.currency);
  };

  const inputClasses = "w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-white font-bold text-base focus:border-green-400 focus:bg-white/10 outline-none transition-all placeholder-white/20";
  const labelClasses = "text-xs font-black text-white/50 mb-1.5 block uppercase tracking-wider px-1";

  return (
    <div className="min-h-screen bg-[#051810] flex items-center justify-center p-4 relative overflow-hidden font-['Cairo']">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-[#1D3C2B] rounded-full blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-[#356148] rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col">
        
        {/* Branding Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full"></div>
            <img 
              src="https://i.ibb.co/Tx36fB5C/20251228-105841.png" 
              className="w-28 h-28 object-contain relative z-10 animate-logo-cinematic" 
              alt="Marah Logo" 
            />
          </div>
        </div>

        {/* Auth Container */}
        <div className="glass-card rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden">
          
          {/* Mode Switcher */}
          <div className="flex bg-black/30 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all duration-500 ${mode === 'login' ? 'bg-[#1D3C2B] text-white shadow-lg border border-white/10' : 'text-white/40 hover:text-white/60'}`}
            >
              {t('login')}
            </button>
            <button 
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all duration-500 ${mode === 'signup' ? 'bg-[#1D3C2B] text-white shadow-lg border border-white/10' : 'text-white/40 hover:text-white/60'}`}
            >
              {t('signup')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {mode === 'signup' && (
              <div className="animate-fade-in space-y-5">
                
                {/* Role Selection */}
                <div className="space-y-2">
                  <label className={labelClasses}>{t('role_type')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((role) => (
                      <button 
                        key={role.id}
                        type="button"
                        onClick={() => setFormData({...formData, role: role.id})}
                        className={`flex items-center justify-center py-3.5 px-2 rounded-xl border transition-all duration-300 ${formData.role === role.id ? 'bg-[#1D3C2B] border-green-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                      >
                        <span className="text-xs font-black uppercase tracking-wide">{t(role.label)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Selection for Owner */}
                {formData.role === 'مالك' && (
                  <div className="space-y-2">
                    <label className={labelClasses}>{t('main_activity')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button 
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData({...formData, category: cat.id})}
                          className={`flex items-center justify-center py-3 rounded-xl border transition-all duration-300 ${formData.category === cat.id ? 'bg-[#1D3C2B] border-green-500 text-white' : 'bg-white/5 border-white/5 text-white/40'}`}
                        >
                          <span className="text-xs font-black uppercase tracking-tight">{t(cat.label)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activation Code for non-owners */}
                {formData.role !== 'مالك' && (
                  <div className="space-y-1.5">
                    <label className={labelClasses}>{t('activation_code')}</label>
                    <input 
                      type="text" 
                      required
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      className={`${inputClasses} text-center font-mono tracking-widest text-lg focus:border-amber-500`}
                      placeholder="XXX-000000"
                    />
                  </div>
                )}

                {/* Name & Farm Name */}
                <div className="grid grid-cols-1 gap-4">
                  {formData.role === 'مالك' && (
                    <div className="space-y-1.5">
                      <label className={labelClasses}>{t('farm_name')}</label>
                      <input 
                        type="text" 
                        required
                        value={formData.farmName}
                        onChange={(e) => setFormData({...formData, farmName: e.target.value})}
                        className={inputClasses}
                        placeholder=""
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className={labelClasses}>{t('user_name')}</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={inputClasses}
                      placeholder=""
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Common Phone Section */}
            <div className="space-y-1.5">
              <label className={labelClasses}>{t('phone')}</label>
              <div className="flex gap-2">
                <select 
                  value={formData.countryCode} 
                  onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                  className="w-24 h-12 bg-white/5 border border-white/10 rounded-2xl px-1 text-white text-xs font-black outline-none focus:border-green-400"
                >
                  {COUNTRIES.map(c => <option key={c.code} value={c.code} className="bg-[#051810]">{c.flag} {c.prefix}</option>)}
                </select>
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="5XXXXXXXX"
                  className={`${inputClasses} flex-1`}
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-1.5">
              <label className={labelClasses}>{t('password')}</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={inputClasses}
                placeholder="••••••••"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black text-center animate-pulse">
                {errorMsg}
              </div>
            )}

            <button 
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-[#1D3C2B] to-[#356148] border border-white/20 text-white rounded-2xl font-black text-base shadow-xl active:scale-[0.98] transition-all hover:brightness-110 mt-4"
            >
              {mode === 'login' ? t('enter_system') : t('create_account')}
            </button>

            {mode === 'login' && (
              <div className="flex justify-center pt-2">
                <button type="button" className="text-xs text-white/30 font-bold hover:text-white transition-colors">
                  {t('forgot_password')}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
