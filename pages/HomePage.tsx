
import React, { useState, useEffect, useMemo } from 'react';
import { LivestockCategory } from '../types.ts';
import { storageService } from '../services/storageService.ts';
import { soundService } from '../services/soundService.ts';
import SmartAdvisor from '../components/SmartAdvisor.tsx'; // Import the new component
import { useLanguage } from '../contexts/LanguageContext.tsx';

const Card: React.FC<{ card: any }> = ({ card }) => (
  <div className={`relative overflow-hidden rounded-[2rem] p-4 h-40 flex flex-col justify-between shadow-lg border border-white/10 bg-gradient-to-br ${card.color} transition-all duration-300 hover:scale-[1.02] active:scale-95 group`}>
    {/* Decoration */}
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
    <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/10 rounded-tr-full -ml-6 -mb-6"></div>

    <div className="relative z-10 flex justify-between items-start">
       <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10 text-white shadow-inner">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{card.icon}</svg>
       </div>
       {card.isAlert && (
         <span className="animate-pulse bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">{card.alertText}</span>
       )}
       {card.isWarning && (
         <span className="animate-pulse bg-amber-500 text-black text-[10px] font-black px-2 py-1 rounded-full shadow-lg">{card.warningText}</span>
       )}
    </div>

    <div className="relative z-10 mt-auto">
       <p className="text-white text-xs font-black uppercase tracking-wider mb-0.5">{card.title}</p>
       <h3 className="text-white text-3xl font-black tracking-tight leading-none mb-1">{card.value}</h3>
       <div className="flex justify-between items-end">
          <p className="text-white text-[11px] font-bold leading-tight max-w-[70%]">{card.subtext}</p>
          <span className="bg-black/20 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm">{card.status}</span>
       </div>
    </div>
  </div>
);

const HomePage: React.FC<{ selectedCategory: LivestockCategory; isDarkMode?: boolean; userRole: string; userCurrency: string }> = ({ selectedCategory, isDarkMode, userRole, userCurrency }) => {
  const { t } = useLanguage();
  // --- Constants (From HerdPage) ---
  const SUB_CATEGORIES: Record<LivestockCategory, string[]> = {
    'أغنام': ['نعجة', 'كبش', 'خروف/طلي'],
    'ماعز': ['معزة', 'تيس', 'جدي'],
    'أبقار': ['بقرة', 'ثور', 'عجل']
  };

  const GESTATION_DAYS: Record<LivestockCategory, number> = {
    'أغنام': 150,
    'ماعز': 150,
    'أبقار': 283
  };

  const MATURITY_MONTHS: Record<LivestockCategory, number> = {
    'أغنام': 6,
    'ماعز': 7,
    'أبقار': 15
  };

  const FEED_TYPES = ['شعير', 'برسيم', 'تبن', 'شوفان', 'ذرة', 'نخالة'];
  const FEED_UNITS = ['كلغ', 'قنطار', 'طن', 'بالة'];

  // --- Stats State ---
  const [stats, setStats] = useState({
    herdCount: 0,
    sickCount: 0,
    pregnantCount: 0,
    newBorns: 0,
    feedStock: 0,
    feedDays: 0,
    fencesCount: 0,
    devicesCount: 0,
    activeDevices: 0
  });

  // --- Quick Add Menu State ---
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'animal' | 'feed' | 'device' | 'worker'>('none');

  // ==================== FORMS STATE ====================

  // 1. ANIMAL FORM (Full Detail)
  const initialAnimalState = {
    subType: '',
    tagId: '',
    breed: '',
    gender: 'أنثى',
    dob: '',
    fatherId: '',
    motherId: '',
    matingDate: '',
    isPregnant: false,
    fetusCount: 1,
    healthStatus: 'سليم' as const,
    vaccination: '',
    dailyMilk: '', // New Field
    notes: ''
  };
  const [animalForm, setAnimalForm] = useState(initialAnimalState);

  // 2. FEED FORM (Full Detail)
  const [feedForm, setFeedForm] = useState({
    type: 'شعير',
    quantity: '',
    unit: 'كلغ',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  // 3. DEVICE FORM (Full Detail)
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    serial: '',
    type: 'طوق ذكي',
    brand: ''
  });

  // 4. WORKER / INVITE FORM (Code Generation)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    role: 'عامل', // عامل | مشرف | بيطري
    generatedCode: ''
  });

  // ==================== LOGIC & CALCULATIONS ====================

  // --- Animal Logic (From HerdPage) ---
  
  // Auto-detect Gender
  useEffect(() => {
    if (activeModal !== 'animal') return;
    const maleTypes = ['كبش', 'تيس', 'ثور'];
    const femaleTypes = ['نعجة', 'معزة', 'بقرة'];
    
    if (maleTypes.includes(animalForm.subType)) {
      setAnimalForm(prev => ({ ...prev, gender: 'ذكر', isPregnant: false }));
    } else if (femaleTypes.includes(animalForm.subType)) {
      setAnimalForm(prev => ({ ...prev, gender: 'أنثى' }));
    }
  }, [animalForm.subType, activeModal]);

  // Calculate Age (Detailed) & Feed & Readiness
  const calculatedAnimalStats = useMemo(() => {
    if (!animalForm.dob) return { age: '---', ready: false, feed: '---' };

    const birthDate = new Date(animalForm.dob);
    const today = new Date();
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const ageParts = [];
    if (years > 0) ageParts.push(`${years} ${t('year')}`);
    if (months > 0) ageParts.push(`${months} ${t('months')}`);
    if (days > 0) ageParts.push(`${days} ${t('day')}`);
    
    const ageString = ageParts.length > 0 ? ageParts.join(' , ') : t('born_today');
    const totalMonths = (years * 12) + months;
    const isReady = totalMonths >= MATURITY_MONTHS[selectedCategory];

    let feedAmount = '0';
    if (selectedCategory === 'أبقار') {
       feedAmount = totalMonths < 3 ? t('حليب فقط') : totalMonths < 12 ? '4 - 6 KG' : '10 - 15 KG';
    } else {
       feedAmount = totalMonths < 2 ? t('حليب فقط') : totalMonths < 6 ? '0.5 - 1 KG' : '1.5 - 2.5 KG';
    }

    return { age: ageString, ready: isReady, feed: feedAmount };
  }, [animalForm.dob, selectedCategory, t]);

  // Delivery Date
  const deliveryDate = useMemo(() => {
    if (!animalForm.matingDate || !animalForm.isPregnant) return '---';
    const mating = new Date(animalForm.matingDate);
    const daysToAdd = GESTATION_DAYS[selectedCategory];
    mating.setDate(mating.getDate() + daysToAdd);
    // Force English locale for consistent date digits, or adjust if needed.
    // Assuming simple date string is universally readable.
    return mating.toLocaleDateString('en-GB');
  }, [animalForm.matingDate, animalForm.isPregnant, selectedCategory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'سليم': return isDarkMode ? 'bg-white border-white text-[#1D3C2B]' : 'bg-[#1D3C2B] border-[#1D3C2B] text-white';
      case 'يتعافى': return 'bg-yellow-400 border-yellow-400 text-black';
      case 'مريض': return 'bg-red-500 border-red-500 text-white';
      default: return 'bg-gray-400';
    }
  };


  // ==================== DATA LOADING ====================
  // FIX: Added async/await to handle storageService.load Promise
  const loadStats = async () => {
    const livestock: any[] = await storageService.load('marah_livestock', []);
    const feed: any[] = await storageService.load('marah_feed', []);
    const fences: any[] = await storageService.load('marah_fences', []);
    const devices: any[] = await storageService.load('marah_devices', []);

    const filteredLivestock = livestock.filter(a => a.category === selectedCategory);
    
    const herdCount = filteredLivestock.length;
    const sickCount = filteredLivestock.filter(a => a.healthStatus === 'مريض').length;
    const pregnantCount = filteredLivestock.filter(a => a.isPregnant).length;
    const newBorns = filteredLivestock.filter(a => {
         return a.age && (a.age.includes('يوم') || a.age.includes('اشهر')) && !a.age.includes('سنة');
    }).length;

    let totalStockKg = 0;
    feed.forEach(item => {
        let weight = Number(item.stock) || 0; 
        if (item.unit === 'طن') weight = weight * 1000;
        if (item.unit === 'قنطار') weight = weight * 100;
        if (item.unit === 'بالة') weight = weight * 20;
        totalStockKg += weight;
    });

    const dailyConsumption = herdCount * 1.5; 
    const daysLeft = dailyConsumption > 0 ? Math.floor(totalStockKg / dailyConsumption) : 0;
    const devicesCount = devices.length;
    const activeDevices = devices.filter(d => d.status === 'online').length;

    setStats({
       herdCount, sickCount, pregnantCount, newBorns,
       feedStock: Math.round(totalStockKg), feedDays: daysLeft,
       fencesCount: fences.length, devicesCount, activeDevices
    });
  };

  useEffect(() => {
    loadStats();
  }, [selectedCategory]);

  // ==================== SUBMISSION HANDLERS ====================

  // FIX: Added async/await to handle storageService.load Promise
  const submitAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animalForm.tagId) return;
    
    const currentList = await storageService.load('marah_livestock', []);
    const newAnimal = {
      id: Date.now().toString(),
      tagId: animalForm.tagId,
      name: animalForm.tagId,
      category: selectedCategory,
      subType: animalForm.subType || SUB_CATEGORIES[selectedCategory][0],
      breed: animalForm.breed || 'غير محدد',
      gender: animalForm.gender,
      dob: animalForm.dob,
      age: calculatedAnimalStats.age,
      fatherId: animalForm.fatherId || '-',
      motherId: animalForm.motherId || '-',
      matingDate: animalForm.matingDate,
      deliveryDate: animalForm.isPregnant ? deliveryDate : undefined,
      isPregnant: animalForm.isPregnant,
      fetusCount: animalForm.fetusCount,
      healthStatus: animalForm.healthStatus,
      gpsStatus: 'نشط',
      feedAmount: calculatedAnimalStats.feed,
      vaccination: animalForm.vaccination,
      dailyMilk: animalForm.dailyMilk || '0',
      notes: animalForm.notes
    };
    
    storageService.save('marah_livestock', [newAnimal, ...currentList]);
    soundService.playSuccess();
    setActiveModal('none');
    setAnimalForm(initialAnimalState);
    loadStats();
  };

  // FIX: Added async/await to handle storageService.load Promise
  const submitFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedForm.quantity) return;
    const qty = parseFloat(feedForm.quantity);
    
    let status: 'كافٍ' | 'منخفض' | 'حرج' = 'كافٍ';
    if (feedForm.unit === 'طن' && qty < 1) status = 'منخفض';
    else if (feedForm.unit === 'كلغ' && qty < 100) status = 'حرج';

    const currentList = await storageService.load('marah_feed', []);
    const newItem = {
        id: Date.now().toString(),
        type: feedForm.type,
        stock: qty,
        quantityStr: `${qty} ${feedForm.unit}`,
        unit: feedForm.unit,
        price: feedForm.price,
        date: feedForm.date,
        status: status
    };
    storageService.save('marah_feed', [newItem, ...currentList]);
    soundService.playSuccess();
    setActiveModal('none');
    setFeedForm({ type: 'شعير', quantity: '', unit: 'كلغ', price: '', date: new Date().toISOString().split('T')[0] });
    loadStats();
  };

  // FIX: Added async/await to handle storageService.load Promise
  const submitDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceForm.name) return;
    const currentList = await storageService.load('marah_devices', []);
    const newItem = {
      id: deviceForm.serial || Date.now().toString(),
      name: deviceForm.name,
      type: deviceForm.type,
      battery: 100,
      signal: 'قوية',
      status: 'online',
      lastSeen: 'جديد'
    };
    storageService.save('marah_devices', [newItem, ...currentList]);
    soundService.playSuccess();
    setActiveModal('none');
    setDeviceForm({ name: '', serial: '', type: 'طوق ذكي', brand: '' });
    loadStats();
  };

  // FIX: Added async/await to handle storageService.load Promise
  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const prefix = inviteForm.role === 'مشرف' ? 'SUP' : inviteForm.role === 'بيطري' ? 'VET' : 'WRK';
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6 digit
    const code = `${prefix}-${randomNum}`;
    
    // Save to workers list as "Pending" or active with code
    const currentList = await storageService.load('marah_workers', []);
    const newItem = {
      id: Date.now().toString(),
      name: inviteForm.name || 'مستخدم جديد',
      role: inviteForm.role,
      phone: '-',
      accessCode: code,
      status: 'متاح',
      image: 'https://i.ibb.co/Hfp1H3rT/pngtree-farmer-3d-icon-emoji-style-png-image-14296463-removebg-preview.png'
    };
    storageService.save('marah_workers', [newItem, ...currentList]);
    soundService.playSuccess();
    
    setInviteForm(prev => ({ ...prev, generatedCode: code }));
    loadStats();
  };

  const copyCode = () => {
    if (inviteForm.generatedCode) {
        navigator.clipboard.writeText(inviteForm.generatedCode);
        soundService.playClick();
        alert('تم نسخ الكود!');
    }
  };

  const openModal = (modal: any) => {
      soundService.playClick();
      setActiveModal(modal);
      setIsFabOpen(false);
  }

  // --- UI Cards Configuration ---
  const cards = [
    {
      title: t('health_status'),
      value: stats.sickCount.toString(),
      subtext: stats.sickCount > 0 ? t('check_vet') : t('herd_healthy'),
      status: stats.sickCount > 0 ? t('urgent_action') : t('stable'),
      isAlert: stats.sickCount > 0, 
      alertText: t('alert'),
      warningText: t('warning'),
      color: stats.sickCount > 0 ? 'from-[#780000] to-[#c1121f]' : 'from-[#1D3C2B] to-[#356148]',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    },
    {
      title: `${t('herd_count')} ${t(selectedCategory)}`,
      value: stats.herdCount.toString(),
      subtext: `${stats.newBorns} ${t('new_borns')}`,
      status: t('stable_growth'),
      color: 'from-[#1D3C2B] to-[#356148]',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    },
    {
      title: t('tracking_devices'),
      value: stats.devicesCount.toString(),
      subtext: `${stats.devicesCount - stats.activeDevices} ${t('out_of_range')}`,
      status: stats.activeDevices === stats.devicesCount && stats.devicesCount > 0 ? t('excellent_signal') : t('check_network'),
      color: 'from-[#1D3C2B] to-[#4C7A5D]',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    },
    {
      title: t('grazing_range'),
      value: stats.fencesCount > 0 ? t('active') : t('undefined'),
      subtext: stats.fencesCount > 0 ? `${stats.fencesCount} ${t('defined_zones')}` : t('no_fence'),
      status: stats.fencesCount > 0 ? t('enabled') : t('setup_required'),
      color: 'from-[#1D3C2B] to-[#4A6741]',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    },
    {
      title: t('production'),
      value: stats.pregnantCount.toString(),
      subtext: t('confirmed_pregnancy'),
      status: t('promising_season'),
      color: 'from-[#1D3C2B] to-[#1D3C2B]',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    },
    {
      title: t('feed_stock'),
      value: `${stats.feedStock} KG`,
      subtext: t('total_stock'),
      status: t('days_left', { days: stats.feedDays }),
      isWarning: stats.feedDays < 7,
      warningText: t('warning'),
      color: stats.feedDays < 7 && stats.feedStock > 0 ? 'from-[#780000] to-[#c1121f]' : 'from-[#1D3C2B] to-[#8FB996]',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    },
  ];

  // --- FAB Item Restrictions based on User Role ---
  const allFabItems = [
    { 
      id: 'worker', 
      label: t('invite_team'), 
      icon: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      action: () => { openModal('worker'); setInviteForm({ name: '', role: 'عامل', generatedCode: '' }); },
      allowedRoles: ['مالك', 'مشرف']
    },
    { 
      id: 'device', 
      label: t('link_device'), 
      icon: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2-2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>,
      action: () => { openModal('device'); },
      allowedRoles: ['مالك', 'مشرف']
    },
    { 
      id: 'feed', 
      label: t('add_feed'), 
      icon: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
      action: () => { openModal('feed'); },
      allowedRoles: ['مالك', 'مشرف', 'عامل']
    },
    { 
      id: 'animal', 
      label: t('add_animal'), 
      icon: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      action: () => { openModal('animal'); setAnimalForm({ ...initialAnimalState, subType: SUB_CATEGORIES[selectedCategory][0] }); },
      allowedRoles: ['مالك', 'مشرف']
    }
  ];

  const fabItems = allFabItems.filter(item => item.allowedRoles.includes(userRole));

  // Dynamic colors for Light/Dark mode
  const modalText = isDarkMode ? 'text-white' : 'text-[#1D3C2B]';
  const modalInputText = isDarkMode ? 'text-white' : 'text-[#1D3C2B]';
  const modalBorder = isDarkMode ? 'border-white/40' : 'border-[#1D3C2B]/20';
  const modalPlaceholder = isDarkMode ? 'placeholder-white/30' : 'placeholder-[#1D3C2B]/40';

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2 h-full overflow-y-auto no-scrollbar relative">
      <div className="flex flex-col gap-5 animate-fade-in pb-32">
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-1 mt-2">
          <div className="flex flex-col">
            <h2 className="text-[#1D3C2B] text-xl font-black tracking-tight">{t('dashboard')}</h2>
            <p className="text-[#1D3C2B]/50 text-[11px] font-black uppercase tracking-widest italic">{t('live_dashboard')}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-[#1D3C2B]/10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#1D3C2B] animate-ping"></div>
          </div>
        </div>

        {/* AI ADVISOR - NEW COMPONENT */}
        <SmartAdvisor />

        {/* STRICT MOBILE 2-COLUMN GRID */}
        <div className="grid grid-cols-2 gap-4">
          {cards.map((c, i) => <Card key={i} card={c} />)}
        </div>

        {/* Global Stats Footer Card */}
        <div className="bg-[#1D3C2B] p-5 rounded-3xl shadow-xl flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                 </svg>
              </div>
              <div>
                <p className="text-white text-sm font-black">{t('system_efficiency')}</p>
                <p className="text-white text-[10px] font-bold">{t('all_synced')}</p>
              </div>
           </div>
           <span className="text-white text-sm font-black bg-white/10 px-4 py-2 rounded-xl border border-white/10">100%</span>
        </div>

      </div>

      {/* ==================== FLOATING ADD MENU (LEFT BOTTOM) ==================== */}
      
      {fabItems.length > 0 && (
          <>
            {isFabOpen && <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" onClick={() => setIsFabOpen(false)}></div>}

            <div className={`fixed ${useLanguage().language === 'ar' ? 'left-4 lg:left-8' : 'right-4 lg:right-8'} bottom-6 z-[90] flex flex-col items-center gap-4`}>
                <div className="flex flex-col items-center gap-3 mb-2">
                    {fabItems.map((item, index) => (
                        <button 
                        key={item.id}
                        onClick={item.action}
                        style={{ 
                            transitionDelay: isFabOpen ? `${(fabItems.length - 1 - index) * 50}ms` : '0ms',
                            transform: isFabOpen ? 'translateY(0)' : `translateY(${(fabItems.length - index) * 20}px)`,
                            opacity: isFabOpen ? 1 : 0,
                            pointerEvents: isFabOpen ? 'auto' : 'none'
                        }}
                        className="w-14 h-14 lg:w-16 lg:h-16 flex flex-col items-center justify-center rounded-full transition-all duration-500 border-2 shadow-lg overflow-hidden bg-[#1D3C2B] border-white hover:bg-[#1D3C2B]/90 hover:border-white/80"
                        >
                            {item.icon}
                            <span className="text-[10px] lg:text-xs font-bold text-center mt-0.5 text-white opacity-70">{item.label}</span>
                        </button>
                    ))}
                </div>

                <button 
                onClick={() => { soundService.playClick(); setIsFabOpen(!isFabOpen); }}
                className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-[#1D3C2B] border-2 border-white flex items-center justify-center shadow-2xl transition-all duration-500 group active:scale-90 relative overflow-hidden pointer-events-auto z-[91] ${isFabOpen ? 'brightness-110' : 'hover:brightness-105'}`}
                >
                    <div className={`transition-all duration-500`}>
                    {isFabOpen ? (
                        <svg className="w-8 h-8 text-white animate-fade-in" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                        <span className="text-white font-black text-sm tracking-widest animate-fade-in">{t('add_button')}</span>
                    )}
                    </div>
                    
                    {!isFabOpen && (
                    <span className="absolute inset-0 rounded-full bg-white/5 animate-ping opacity-20 pointer-events-none"></span>
                    )}
                </button>
            </div>
          </>
      )}

      {/* ==================== QUICK ACTION MODALS ==================== */}

      {activeModal !== 'none' && (
         <div className="fixed inset-0 z-[100] flex flex-col p-4 animate-fade-in bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-sm rounded-[2rem] p-6 relative flex flex-col max-h-full mx-auto shadow-2xl ${isDarkMode ? 'bg-[#051810]' : 'bg-[#EBF2E5]'} border-2 ${modalBorder}`}>
               
               <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className={`text-xl font-black ${modalText}`}>
                    {activeModal === 'animal' && t('add_animal')}
                    {activeModal === 'feed' && t('add_feed')}
                    {activeModal === 'device' && t('link_device')}
                    {activeModal === 'worker' && t('invite_team')}
                  </h3>
                  <button onClick={() => { soundService.playClick(); setActiveModal('none'); }} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-[#1D3C2B]/10 hover:bg-[#1D3C2B]/20'}`}>
                     <svg className={`w-4 h-4 ${modalText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
                  
                  {/* --- 1. DETAILED ANIMAL FORM --- */}
                  {activeModal === 'animal' && (
                     <form onSubmit={submitAnimal} className="flex flex-col gap-6">
                        
                        {/* 1. Basic Info */}
                        <div className="space-y-4">
                           <h4 className={`text-xs font-black uppercase tracking-wider text-green-500`}>{t('basic_info')}</h4>
                           <div className="grid grid-cols-3 gap-3">
                              {SUB_CATEGORIES[selectedCategory].map((type) => (
                                 <button
                                   key={type}
                                   type="button"
                                   onClick={() => setAnimalForm({ ...animalForm, subType: type })}
                                   className={`py-3 rounded-2xl font-black text-xs transition-all border-2 ${
                                     animalForm.subType === type 
                                       ? (isDarkMode ? 'bg-white text-[#1D3C2B] border-white' : 'bg-[#1D3C2B] text-white border-[#1D3C2B]')
                                       : `bg-white/5 ${modalText} ${modalBorder}`
                                   }`}
                                 >
                                   {t(type)}
                                 </button>
                              ))}
                           </div>

                           <div className="flex gap-4">
                              <div className="flex-1 space-y-2">
                                 <label className={`text-xs font-bold ${modalText}`}>{t('tag_id')}</label>
                                 <input 
                                    required
                                    type="text" 
                                    value={animalForm.tagId}
                                    onChange={(e) => setAnimalForm({...animalForm, tagId: e.target.value})}
                                    className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-base outline-none ${modalInputText}`}
                                 />
                              </div>
                              <div className="flex-1 space-y-2">
                                 <label className={`text-xs font-bold ${modalText}`}>{t('breed_opt')}</label>
                                 <input 
                                    type="text" 
                                    value={animalForm.breed}
                                    onChange={(e) => setAnimalForm({...animalForm, breed: e.target.value})}
                                    className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-base outline-none ${modalInputText}`}
                                 />
                              </div>
                           </div>

                           {/* GENDER & PARENTS */}
                           <div className="space-y-4">
                              <div className={`flex gap-4 items-center p-2 rounded-xl border ${isDarkMode ? 'bg-white/5' : 'bg-black/5'} ${modalBorder}`}>
                                 <span className={`text-xs font-bold px-2 ${modalText}`}>{t('gender')}:</span>
                                 <div className="flex gap-2 flex-1">
                                    {['ذكر', 'أنثى'].map(g => (
                                       <button
                                          key={g}
                                          type="button"
                                          onClick={() => setAnimalForm({...animalForm, gender: g})}
                                          className={`flex-1 py-1.5 rounded-lg text-sm font-black transition-all ${
                                          animalForm.gender === g 
                                             ? (g === 'ذكر' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white')
                                             : modalText
                                          }`}
                                       >
                                          {t(g)}
                                       </button>
                                    ))}
                                 </div>
                              </div>

                              {/* PARENT IDs */}
                              <div className="flex gap-3">
                                 <div className="flex-1 space-y-1">
                                    <label className={`text-[11px] font-bold ${modalText}`}>{t('father_tag')}</label>
                                    <input 
                                       type="text"
                                       placeholder={t('optional')}
                                       value={animalForm.fatherId}
                                       onChange={(e) => setAnimalForm({...animalForm, fatherId: e.target.value})}
                                       className={`w-full h-10 px-3 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-sm outline-none ${modalInputText} ${modalPlaceholder}`}
                                    />
                                 </div>
                                 <div className="flex-1 space-y-1">
                                    <label className={`text-[11px] font-bold ${modalText}`}>{t('mother_tag')}</label>
                                    <input 
                                       type="text"
                                       placeholder={t('optional')}
                                       value={animalForm.motherId}
                                       onChange={(e) => setAnimalForm({...animalForm, motherId: e.target.value})}
                                       className={`w-full h-10 px-3 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-sm outline-none ${modalInputText} ${modalPlaceholder}`}
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* 2. Biological */}
                        <div className="space-y-4">
                           <h4 className={`text-xs font-black uppercase tracking-wider text-green-500`}>{t('bio_data')}</h4>
                           <div className="space-y-2">
                              <label className={`text-xs font-bold ${modalText}`}>{t('birth_date')}</label>
                              <input 
                                type="date" 
                                required
                                value={animalForm.dob}
                                onChange={(e) => setAnimalForm({...animalForm, dob: e.target.value})}
                                className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-base outline-none ${modalInputText}`}
                              />
                           </div>
                           
                           {/* Detailed Age Calculation Display */}
                           {animalForm.dob && (
                              <div className="grid grid-cols-1 gap-2 animate-fade-in">
                                 <div className={`p-4 rounded-2xl border-2 ${modalBorder} text-center ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}`}>
                                    <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${modalText} opacity-70`}>{t('completed_age')}</p>
                                    <p className={`text-base font-black leading-relaxed ${modalText}`}>{calculatedAnimalStats.age}</p>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                    <div className={`p-3 rounded-xl border-2 ${modalBorder} text-center ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                        <p className={`text-[10px] font-bold ${modalText} opacity-60`}>{t('est_feed')}</p>
                                        <p className={`text-sm font-black text-amber-600`}>{calculatedAnimalStats.feed}</p>
                                    </div>
                                    <div className={`p-3 rounded-xl border-2 ${modalBorder} text-center ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                        <p className={`text-[10px] font-bold ${modalText} opacity-60`}>{t('mating')}</p>
                                        <p className={`text-sm font-black ${calculatedAnimalStats.ready ? 'text-green-600' : 'text-red-500'}`}>
                                        {calculatedAnimalStats.ready ? t('ready') : t('not_ready')}
                                        </p>
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* 3. Reproduction (If Female & Ready) */}
                        {animalForm.gender === 'أنثى' && calculatedAnimalStats.ready && (
                           <div className="space-y-4">
                              <div className={`flex justify-between items-center p-3 rounded-xl border-2 ${modalBorder} ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                 <span className={`text-xs font-bold ${modalText}`}>{t('pregnant_q')}</span>
                                 <button 
                                   type="button"
                                   onClick={() => setAnimalForm({...animalForm, isPregnant: !animalForm.isPregnant})}
                                   className={`w-10 h-6 rounded-full p-1 transition-colors ${animalForm.isPregnant ? 'bg-green-500' : 'bg-gray-400'}`}
                                 >
                                   <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${animalForm.isPregnant ? (useLanguage().language === 'ar' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`}></div>
                                 </button>
                              </div>
                              {animalForm.isPregnant && (
                                 <div className="space-y-4 animate-fade-in bg-green-500/10 p-3 rounded-2xl border-2 border-green-500">
                                    <div className="space-y-2">
                                       <label className={`text-xs font-bold ${modalText}`}>{t('mating_date')}</label>
                                       <input 
                                          type="date" 
                                          value={animalForm.matingDate}
                                          onChange={(e) => setAnimalForm({...animalForm, matingDate: e.target.value})}
                                          className={`w-full h-10 px-3 rounded-lg border-2 ${modalBorder} bg-transparent font-bold text-sm outline-none ${modalInputText}`}
                                       />
                                    </div>
                                    
                                    <div className="space-y-2">
                                       <label className={`text-xs font-bold ${modalText}`}>{t('expected_fetus')}</label>
                                       <div className="flex gap-2">
                                          {[1, 2, 3].map(count => (
                                             <button
                                                key={count}
                                                type="button"
                                                onClick={() => setAnimalForm({...animalForm, fetusCount: count})}
                                                className={`flex-1 py-2 rounded-lg font-black text-xs transition-all border ${
                                                   animalForm.fetusCount === count 
                                                   ? 'bg-green-500 text-white border-green-600 shadow-md' 
                                                   : `bg-white/5 ${modalBorder} ${modalText}`
                                                }`}
                                             >
                                                {count}
                                             </button>
                                          ))}
                                       </div>
                                    </div>

                                    <div className={`bg-green-500/20 p-2 rounded-lg text-center border-2 ${modalBorder}`}>
                                       <p className={`text-[11px] ${modalText} font-bold`}>{t('expected_delivery')}: {deliveryDate}</p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        )}

                        {/* 4. Milk Production (Females Only) */}
                        {animalForm.gender === 'أنثى' && (
                           <div className="space-y-3">
                              <h4 className={`text-xs font-black uppercase tracking-wider text-green-500`}>{t('milk_prod')}</h4>
                              <div className="flex gap-3">
                                 <div className="flex-1 space-y-2">
                                    <label className={`text-[11px] font-bold ${modalText}`}>{t('daily_prod')}</label>
                                    <input 
                                       type="number" 
                                       step="0.1"
                                       value={animalForm.dailyMilk}
                                       onChange={(e) => setAnimalForm({...animalForm, dailyMilk: e.target.value})}
                                       className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-base outline-none ${modalInputText} ${modalPlaceholder}`}
                                       placeholder="0.0"
                                    />
                                 </div>
                                 <div className="flex-1 space-y-2">
                                    <label className={`text-[11px] font-bold ${modalText}`}>{t('monthly_prod')}</label>
                                    <div className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} flex items-center font-black text-base ${modalText}`}>
                                       {animalForm.dailyMilk ? (parseFloat(animalForm.dailyMilk) * 30).toFixed(1) : '0'} {t('liter')}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* 5. Health & Notes */}
                        <div className="space-y-3">
                           <h4 className={`text-xs font-black uppercase tracking-wider text-green-500`}>{t('health_notes')}</h4>
                           
                           {/* Health Status */}
                           <div className="flex gap-2">
                              {['سليم', 'يتعافى', 'مريض'].map(status => (
                                 <button
                                   key={status}
                                   type="button"
                                   disabled={userRole === 'عامل'}
                                   onClick={() => setAnimalForm({...animalForm, healthStatus: status as any})}
                                   className={`flex-1 h-9 rounded-xl font-bold text-sm border-2 transition-all ${
                                      animalForm.healthStatus === status 
                                      ? getStatusColor(status) 
                                      : `${modalBorder} ${modalText}`
                                   }`}
                                 >
                                    {t(status)}
                                 </button>
                              ))}
                           </div>

                           {/* Vaccination */}
                           <div className="space-y-1 mt-2">
                                <label className={`text-[11px] font-bold ${modalText}`}>{t('vaccinations')}</label>
                                <input 
                                    type="text"
                                    placeholder=""
                                    value={animalForm.vaccination}
                                    onChange={(e) => setAnimalForm({...animalForm, vaccination: e.target.value})}
                                    className={`w-full h-10 px-3 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-sm outline-none ${modalInputText} ${modalPlaceholder}`}
                                />
                           </div>

                           {/* Notes */}
                           <div className="space-y-1">
                                <label className={`text-[11px] font-bold ${modalText}`}>{t('notes')}</label>
                                <textarea 
                                    rows={3}
                                    value={animalForm.notes}
                                    onChange={(e) => setAnimalForm({...animalForm, notes: e.target.value})}
                                    className={`w-full p-3 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-sm outline-none resize-none ${modalInputText} ${modalPlaceholder}`}
                                    placeholder=""
                                />
                           </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                           <button type="submit" className="h-14 w-full bg-[#1D3C2B] text-white rounded-[1.5rem] font-black shadow-lg border-2 border-white/40">{t('save_record')}</button>
                           <button type="button" onClick={() => setActiveModal('none')} className={`h-12 w-full bg-white/5 rounded-[1.5rem] font-bold text-sm border-2 ${modalBorder} ${modalText} active:scale-95 transition-all`}>{t('cancel')}</button>
                        </div>
                     </form>
                  )}

                  {/* --- 2. DETAILED FEED FORM --- */}
                  {activeModal === 'feed' && (
                     <form onSubmit={submitFeed} className="flex flex-col gap-6">
                        <div className="space-y-4">
                           <h4 className={`text-xs font-black uppercase tracking-wider text-green-500`}>{t('feed_details')}</h4>
                           <div className="space-y-2">
                              <label className={`text-xs font-bold ${modalText}`}>{t('feed_type')}</label>
                              <div className="grid grid-cols-3 gap-2">
                                 {FEED_TYPES.map(type => (
                                    <button
                                       key={type}
                                       type="button"
                                       onClick={() => setFeedForm({...feedForm, type})}
                                       className={`py-2 rounded-xl text-sm font-black border-2 transition-all ${feedForm.type === type ? (isDarkMode ? 'bg-white text-[#1D3C2B] border-white' : 'bg-[#1D3C2B] text-white border-[#1D3C2B]') : `bg-white/5 ${modalText} ${modalBorder}`}`}
                                    >
                                       {t(type)}
                                    </button>
                                 ))}
                              </div>
                           </div>
                           <div className="flex gap-3">
                              <div className="flex-1 space-y-2">
                                 <label className={`text-xs font-bold ${modalText}`}>{t('quantity')}</label>
                                 <input type="number" required value={feedForm.quantity} onChange={(e) => setFeedForm({...feedForm, quantity: e.target.value})} className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-base outline-none ${modalInputText} ${modalPlaceholder}`} />
                              </div>
                              <div className="flex-1 space-y-2">
                                 <label className={`text-xs font-bold ${modalText}`}>{t('unit')}</label>
                                 <div className="grid grid-cols-2 gap-1">
                                    {FEED_UNITS.map(u => (
                                       <button key={u} type="button" onClick={() => setFeedForm({...feedForm, unit: u})} className={`py-1 rounded-lg text-xs font-black border-2 transition-all ${feedForm.unit === u ? 'bg-green-600 text-white border-green-600' : `bg-white/5 ${modalText} ${modalBorder}`}`}>{t(u)}</button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                           <div className="flex gap-3">
                              <div className="flex-1 space-y-2">
                                 <label className={`text-xs font-bold ${modalText}`}>{t('price')} ({userCurrency})</label>
                                 <input type="number" value={feedForm.price} onChange={(e) => setFeedForm({...feedForm, price: e.target.value})} className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-base outline-none ${modalInputText}`} />
                              </div>
                              <div className="flex-1 space-y-2">
                                 <label className={`text-xs font-bold ${modalText}`}>{t('supply_date')}</label>
                                 <input type="date" value={feedForm.date} onChange={(e) => setFeedForm({...feedForm, date: e.target.value})} className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-base outline-none ${modalInputText}`} />
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col gap-3 mt-4">
                           <button type="submit" className="h-14 w-full bg-[#1D3C2B] text-white rounded-[1.5rem] font-black shadow-lg border-2 border-white/40">{t('add_stock')}</button>
                           <button type="button" onClick={() => setActiveModal('none')} className={`h-12 w-full bg-white/5 rounded-[1.5rem] font-bold text-sm border-2 ${modalBorder} ${modalText} active:scale-95 transition-all`}>{t('cancel')}</button>
                        </div>
                     </form>
                  )}

                  {/* --- 3. DETAILED DEVICE FORM --- */}
                  {activeModal === 'device' && (
                     <form onSubmit={submitDevice} className="flex flex-col gap-6">
                        <div className="space-y-4">
                           <h4 className={`text-xs font-black uppercase tracking-wider text-green-500`}>{t('device_data')}</h4>
                           <div className="space-y-2">
                              <label className={`text-xs font-bold ${modalText}`}>{t('device_name')}</label>
                              <input type="text" required placeholder="" value={deviceForm.name} onChange={(e) => setDeviceForm({...deviceForm, name: e.target.value})} className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-base outline-none ${modalInputText} ${modalPlaceholder}`} />
                           </div>
                           <div className="space-y-2">
                              <label className={`text-xs font-bold ${modalText}`}>{t('serial_no')}</label>
                              <input type="text" placeholder={t('optional')} value={deviceForm.serial} onChange={(e) => setDeviceForm({...deviceForm, serial: e.target.value})} className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-base outline-none ${modalInputText} ${modalPlaceholder}`} />
                           </div>
                           <div className="flex gap-3">
                              <div className="flex-1 space-y-2">
                                 <label className={`text-xs font-bold ${modalText}`}>{t('device_type')}</label>
                                 <select value={deviceForm.type} onChange={(e) => setDeviceForm({...deviceForm, type: e.target.value})} className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-base outline-none ${modalInputText}`}>
                                    <option value="طوق ذكي" className="text-black">{t('smart_collar')}</option>
                                    <option value="شريحة" className="text-black">{t('chip')}</option>
                                    <option value="كاميرا" className="text-black">{t('camera')}</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col gap-3 mt-4">
                           <button type="submit" className="h-14 w-full bg-[#1D3C2B] text-white rounded-[1.5rem] font-black shadow-lg border-2 border-white/40">{t('link_device_btn')}</button>
                           <button type="button" onClick={() => setActiveModal('none')} className={`h-12 w-full bg-white/5 rounded-[1.5rem] font-bold text-sm border-2 ${modalBorder} ${modalText} active:scale-95 transition-all`}>{t('cancel')}</button>
                        </div>
                     </form>
                  )}

                  {/* --- 4. DETAILED WORKER INVITE FORM --- */}
                  {activeModal === 'worker' && (
                     <form onSubmit={submitInvite} className="flex flex-col gap-6">
                        {!inviteForm.generatedCode ? (
                           <>
                              <div className="space-y-4">
                                 <h4 className={`text-xs font-black uppercase tracking-wider text-green-500`}>{t('invite_team')}</h4>
                                 <div className="space-y-2">
                                    <label className={`text-xs font-bold ${modalText}`}>{t('worker_name')}</label>
                                    <input type="text" required value={inviteForm.name} onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})} className={`w-full h-12 px-4 rounded-xl border-2 ${modalBorder} bg-transparent font-bold text-base outline-none ${modalInputText}`} />
                                 </div>
                                 <div className="space-y-2">
                                    <label className={`text-xs font-bold ${modalText}`}>{t('role')}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                       {['عامل', 'مشرف', 'بيطري'].map(role => (
                                          <button key={role} type="button" onClick={() => setInviteForm({...inviteForm, role})} className={`py-3 rounded-xl text-sm font-black border-2 transition-all ${inviteForm.role === role ? 'bg-[#1D3C2B] text-white border-[#1D3C2B]' : `bg-white/5 ${modalText} ${modalBorder}`}`}>{t(role)}</button>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                              <div className="flex flex-col gap-3 mt-4">
                                 <button type="submit" className="h-14 w-full bg-[#1D3C2B] text-white rounded-[1.5rem] font-black shadow-lg border-2 border-white/40">{t('create_code')}</button>
                                 <button type="button" onClick={() => setActiveModal('none')} className={`h-12 w-full bg-white/5 rounded-[1.5rem] font-bold text-sm border-2 ${modalBorder} ${modalText} active:scale-95 transition-all`}>{t('cancel')}</button>
                              </div>
                           </>
                        ) : (
                           <div className={`flex flex-col items-center gap-6 py-6 font-bold ${modalText}`}>
                               <div className="text-center space-y-2">
                                   <h3 className="text-xl font-black">{t('code_created')}</h3>
                                   <p className="text-sm">{t('share_code')}</p>
                               </div>
                               <div className={`w-full p-4 rounded-2xl border-2 ${modalBorder} ${isDarkMode ? 'bg-black/20' : 'bg-black/5'} flex items-center justify-between`}>
                                  <span className="text-2xl font-mono font-black tracking-widest">{inviteForm.generatedCode}</span>
                                  <button onClick={copyCode} className={`bg-[#1D3C2B] text-white px-4 py-2 rounded-xl text-xs font-bold`}>{t('copy')}</button>
                               </div>
                               <button type="button" onClick={() => setActiveModal('none')} className={`h-12 w-full rounded-[1.5rem] font-bold text-sm bg-white/5 border-2 ${modalBorder}`}>{t('close')}</button>
                           </div>
                        )}
                     </form>
                  )}

               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default HomePage;
