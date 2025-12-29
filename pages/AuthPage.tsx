
import React, { useState, useEffect } from 'react';
import { LivestockCategory } from '../types.ts';
import { storageService } from '../services/storageService.ts';

interface AuthPageProps {
  onLogin: (countryName: string, role: string, currency: string) => void;
}

type UserRole = 'مالك' | 'مشرف' | 'عامل' | 'بيطري';
type AuthMode = 'login' | 'signup';

const COUNTRIES = [
  { code: 'SA', name: 'السعودية', flag: '🇸🇦', prefix: '+966', currency: 'SAR' },
  { code: 'AE', name: 'الإمارات', flag: '🇦🇪', prefix: '+971', currency: 'AED' },
  { code: 'KW', name: 'الكويت', flag: '🇰🇼', prefix: '+965', currency: 'KWD' },
  { code: 'QA', name: 'قطر', flag: '🇶🇦', prefix: '+974', currency: 'QAR' },
  { code: 'OM', name: 'عمان', flag: '🇴🇲', prefix: '+968', currency: 'OMR' },
  { code: 'BH', name: 'البحرين', flag: '🇧🇭', prefix: '+973', currency: 'BHD' },
  { code: 'DZ', name: 'الجزائر', flag: '🇩🇿', prefix: '+213', currency: 'DZD' },
  { code: 'MA', name: 'المغرب', flag: '🇲🇦', prefix: '+212', currency: 'MAD' },
  { code: 'TN', name: 'تونس', flag: '🇹🇳', prefix: '+216', currency: 'TND' },
  { code: 'LY', name: 'ليبيا', flag: '🇱🇾', prefix: '+218', currency: 'LYD' },
  { code: 'EG', name: 'مصر', flag: '🇪🇬', prefix: '+20', currency: 'EGP' },
  { code: 'SD', name: 'السودان', flag: '🇸🇩', prefix: '+249', currency: 'SDG' },
  { code: 'MR', name: 'موريتانيا', flag: '🇲🇷', prefix: '+222', currency: 'MRU' },
  { code: 'JO', name: 'الأردن', flag: '🇯🇴', prefix: '+962', currency: 'JOD' },
  { code: 'LB', name: 'لبنان', flag: '🇱🇧', prefix: '+961', currency: 'LBP' },
  { code: 'SY', name: 'سوريا', flag: '🇸🇾', prefix: '+963', currency: 'SYP' },
  { code: 'IQ', name: 'العراق', flag: '🇮🇶', prefix: '+964', currency: 'IQD' },
  { code: 'PS', name: 'فلسطين', flag: '🇵🇸', prefix: '+970', currency: 'ILS' },
  { code: 'YE', name: 'اليمن', flag: '🇾🇪', prefix: '+967', currency: 'YER' },
  { code: 'SO', name: 'الصومال', flag: '🇸🇴', prefix: '+252', currency: 'SOS' },
  { code: 'DJ', name: 'جيبوتي', flag: '🇩🇯', prefix: '+253', currency: 'DJF' },
  { code: 'KM', name: 'جزر القمر', flag: '🇰🇲', prefix: '+269', currency: 'KMF' },
  { code: 'TR', name: 'تركيا', flag: '🇹🇷', prefix: '+90', currency: 'TRY' },
];

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'مالك', label: 'مالك' },
  { id: 'مشرف', label: 'مشرف' },
  { id: 'بيطري', label: 'بيطري' },
  { id: 'عامل', label: 'عامل' },
];

const CATEGORIES: { id: LivestockCategory }[] = [
  { id: 'أغنام' },
  { id: 'ماعز' },
  { id: 'أبقار' },
];

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
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

  // تصفير الحقول عند تغيير الوضع بين تسجيل الدخول والاشتراك
  useEffect(() => {
    setFormData({
      name: '',
      farmName: '',
      phone: '',
      password: '',
      role: 'مالك',
      category: 'أغنام',
      countryCode: 'SA'
    });
    setAccessCode('');
    setErrorMsg('');
  }, [mode]);

  const selectedCountry = COUNTRIES.find(c => c.code === formData.countryCode) || COUNTRIES[0];

  // FIX: Added async to handleSubmit to handle storageService.load Promise
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.role !== 'مالك') {
        const workersList: any[] = await storageService.load('marah_workers', []);
        const validInvitation = workersList.find(w => w.accessCode === accessCode && w.role === formData.role);
        if (!validInvitation) {
            setErrorMsg(`كود التفعيل غير صحيح أو لا يطابق صلاحية "${formData.role}"`);
            return;
        }
    }

    const userProfile = {
      name: formData.name || 'مستخدم جديد',
      farmName: formData.role === 'مالك' ? (formData.farmName || 'مزرعتي') : '-',
      phone: formData.phone || '',
      role: formData.role,
      country: selectedCountry.name,
      currency: selectedCountry.currency,
      email: '', 
      plan: 'مجاني' 
    };
    
    const existing = await storageService.load('marah_user_profile', null);
    if (mode === 'signup' || !existing) {
       storageService.save('marah_user_profile', userProfile);
       if (mode === 'signup') {
         storageService.incrementGlobalUserCount();
       }
    }

    onLogin(selectedCountry.name, formData.role, selectedCountry.currency);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, countryCode: e.target.value });
  };

  return (
    <div className="min-h-screen bg-[#051810] flex items-center justify-center p-4 relative overflow-hidden font-['Cairo']">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#1D3C2B] rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#356148] rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in">
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#1D3C2B] to-[#356148] rounded-[2rem] flex items-center justify-center shadow-2xl mb-4 border border-white/10 relative group">
             <div className="absolute inset-0 bg-white/10 rounded-[2rem] animate-pulse"></div>
             <img src="https://i.ibb.co/Tx36fB5C/20251228-105841.png" className="w-14 h-14 object-contain relative z-10" alt="Logo" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border-2 border-white/40 rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
          
          <div className="flex bg-black/20 p-1 rounded-2xl mb-6 relative">
            <div 
              className={`absolute top-1 bottom-1 w-[48%] bg-[#1D3C2B] rounded-xl shadow-lg transition-all duration-300 ${mode === 'signup' ? 'left-1' : 'left-[51%]'}`}
            ></div>
            <button 
              onClick={() => setMode('signup')}
              className={`flex-1 py-3 text-sm font-black relative z-10 transition-colors text-white`}
            >
              إنشاء حساب
            </button>
            <button 
              onClick={() => setMode('login')}
              className={`flex-1 py-3 text-sm font-black relative z-10 transition-colors text-white`}
            >
              تسجيل الدخول
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {mode === 'signup' && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                   <label className="text-[10px] text-white font-black px-2 uppercase tracking-wider">اختر الدور</label>
                   <div className="grid grid-cols-4 gap-2">
                      {ROLES.map((role) => (
                         <div 
                           key={role.id}
                           onClick={() => setFormData({...formData, role: role.id})}
                           className={`cursor-pointer rounded-xl py-3 px-1 border transition-all duration-300 flex flex-col items-center justify-center gap-1 h-12 ${formData.role === role.id ? 'bg-[#1D3C2B] border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-white/5 border-white/40 hover:bg-white/10'}`}
                         >
                            <span className={`text-[10px] font-black text-white`}>{role.label}</span>
                         </div>
                      ))}
                   </div>
                </div>

                {formData.role !== 'مالك' && (
                    <div className="space-y-1 animate-fade-in">
                        <label className="text-[10px] text-white font-black px-2 flex justify-between">
                            <span>كود التفعيل (مطلوب)</span>
                            <span className="opacity-80">اطلبه من المالك</span>
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                required
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                className="w-full h-14 bg-black/20 border-2 border-white/40 rounded-2xl px-4 text-white font-mono font-bold text-center text-[20px] focus:border-green-400 outline-none transition-all placeholder-white/30"
                                placeholder="XXX-000000"
                            />
                        </div>
                    </div>
                )}

                {formData.role === 'مالك' && (
                    <div className="space-y-2">
                    <label className="text-[10px] text-white font-black px-2 uppercase tracking-wider">نوع القطيع</label>
                    <div className="grid grid-cols-3 gap-3">
                        {CATEGORIES.map((cat) => (
                            <div 
                            key={cat.id}
                            onClick={() => setFormData({...formData, category: cat.id})}
                            className={`cursor-pointer rounded-2xl p-3 border-2 transition-all duration-300 relative overflow-hidden group flex items-center justify-center h-12 ${formData.category === cat.id ? 'bg-gradient-to-br from-[#1D3C2B] to-[#356148] border-green-500' : 'bg-white/5 border-white/40'}`}
                            >
                            <p className={`text-center text-[14px] font-black text-white`}>{cat.id}</p>
                            </div>
                        ))}
                    </div>
                    </div>
                )}

                <div className={`grid gap-3 ${formData.role === 'مالك' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                   {formData.role === 'مالك' && (
                       <div className="space-y-1 animate-fade-in">
                          <label className="text-[10px] text-white font-black px-2">اسم المزرعة</label>
                          <input 
                            type="text" 
                            required
                            value={formData.farmName}
                            onChange={(e) => setFormData({...formData, farmName: e.target.value})}
                            className="w-full h-12 bg-transparent border-2 border-white/40 rounded-2xl px-4 text-white font-bold text-[16px] focus:border-green-500 outline-none transition-all placeholder-white/30"
                            placeholder="أدخل اسم المزرعة"
                          />
                       </div>
                   )}
                   <div className="space-y-1">
                      <label className="text-[10px] text-white font-black px-2">الاسم الكامل</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full h-12 bg-transparent border-2 border-white/40 rounded-2xl px-4 text-white font-bold text-[16px] focus:border-green-500 outline-none transition-all placeholder-white/30"
                        placeholder="أدخل اسمك الكامل"
                      />
                   </div>
                </div>
                
                <div className="space-y-1">
                   <label className="text-[10px] text-white font-black px-2">الدولة</label>
                   <div className="relative">
                      <select 
                        value={formData.countryCode}
                        onChange={handleCountryChange}
                        className="w-full h-12 bg-transparent border-2 border-white/40 rounded-2xl pl-4 pr-12 text-white font-bold text-[16px] focus:border-green-500 outline-none appearance-none cursor-pointer"
                      >
                         {COUNTRIES.map(c => <option key={c.code} value={c.code} className="bg-[#051810] text-white">{c.name}</option>)}
                      </select>
                   </div>
                </div>
              </div>
            )}

            <div className="space-y-1 animate-fade-in">
               <label className="text-[10px] text-white font-black px-2">رقم الهاتف</label>
               <div className="flex gap-2 dir-ltr">
                  <div className="w-20 h-14 bg-transparent border-2 border-white/40 rounded-2xl flex items-center justify-center text-white font-mono font-bold text-[16px] tracking-wider">
                     {selectedCountry.prefix}
                  </div>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="flex-1 h-14 bg-transparent border-2 border-white/40 rounded-2xl px-4 text-white font-bold text-right text-[18px] focus:border-green-500 outline-none transition-all placeholder-white/30 dir-rtl"
                    placeholder="رقم الجوال"
                  />
               </div>
            </div>

            <div className="space-y-1 animate-fade-in">
               <label className="text-[10px] text-white font-black px-2">كلمة المرور</label>
               <div className="relative">
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full h-14 bg-transparent border-2 border-white/40 rounded-2xl px-4 text-white font-bold text-right text-[18px] focus:border-green-500 outline-none transition-all placeholder-white/30"
                    placeholder="كلمة المرور"
                  />
               </div>
            </div>

            {errorMsg && (
              <p className="text-red-400 text-[10px] font-bold px-2 text-center animate-shake">{errorMsg}</p>
            )}

            <button 
              type="submit"
              className="mt-2 w-full h-16 bg-gradient-to-r from-[#1D3C2B] to-[#356148] rounded-[1.5rem] text-white font-black text-lg shadow-[0_10px_30px_rgba(255,255,255,0.2)] border-2 border-white/40 active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-2 group"
            >
              <span>{mode === 'login' ? 'دخول آمن' : 'إنشاء الحساب'}</span>
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
