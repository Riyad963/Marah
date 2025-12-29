
import React, { useState, useEffect, useMemo } from 'react';
import FloatingBackButton from '../components/FloatingBackButton.tsx';
import { LivestockCategory } from '../types.ts';
import { storageService } from '../services/storageService.ts';
import { soundService } from '../services/soundService.ts';

interface Livestock {
  id: string;
  tagId: string;
  name: string;
  category: LivestockCategory;
  subType: string;
  breed: string;
  gender: string;
  dob: string;
  age: string;
  fatherId: string;
  motherId: string;
  matingDate: string;
  deliveryDate?: string;
  isPregnant: boolean;
  fetusCount: number;
  healthStatus: 'سليم' | 'يتعافى' | 'مريض' | 'نفوق' | 'مباع';
  gpsStatus: 'نشط' | 'متوقف';
  feedAmount: string;
  vaccination?: string;
  dailyMilk?: string;
  notes?: string;
}

const HerdPage: React.FC<{ isDarkMode?: boolean; selectedCategory: LivestockCategory; userRole: string; userCurrency: string; onBack?: () => void }> = ({ isDarkMode, selectedCategory, userRole, userCurrency, onBack }) => {
  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModal, setActionModal] = useState<'delete' | 'death' | 'sale' | 'birth' | 'edit' | null>(null);
  const [actionData, setActionData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      const loadedData = await storageService.load('marah_livestock', []);
      setLivestock(loadedData);
    };
    fetchData();
  }, []);

  const filteredLivestock = useMemo(() => {
    return livestock.filter(item => 
      item.category === selectedCategory &&
      (item.tagId.toLowerCase().includes(searchQuery.toLowerCase()) || 
       item.subType.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [livestock, selectedCategory, searchQuery]);

  const modalBorder = isDarkMode ? 'border-white/20' : 'border-[#1D3C2B]/10';
  const modalInputText = isDarkMode ? 'text-white' : 'text-[#1D3C2B]';

  const LivestockCard: React.FC<{ livestock: Livestock }> = ({ livestock }) => {
    let gradientClass = 'from-[#1D3C2B] to-[#356148]';
    if (livestock.healthStatus === 'مريض') gradientClass = 'from-[#780000] to-[#c1121f]';
    if (livestock.healthStatus === 'يتعافى') gradientClass = 'from-yellow-600 to-yellow-500';
    if (livestock.healthStatus === 'نفوق') gradientClass = 'from-gray-700 to-gray-900';
    if (livestock.healthStatus === 'مباع') gradientClass = 'from-blue-800 to-blue-900';

    return (
      <div onClick={() => { soundService.playClick(); setSelectedAnimal(livestock); }} className={`relative aspect-[1/1.5] p-3 flex flex-col justify-between rounded-[2rem] border border-white/10 shadow-xl bg-gradient-to-br ${gradientClass} transition-all active:scale-95 overflow-hidden group cursor-pointer`}>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-1">
             <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">{livestock.subType}</span>
             <span className="text-white text-[10px]">{livestock.gender === 'ذكر' ? '♂' : '♀'}</span>
          </div>
          <h4 className="text-base font-black text-white tracking-tighter">#{livestock.tagId}</h4>
        </div>
        <div className="relative z-10 mt-auto">
          <div className={`w-full py-1.5 rounded-xl text-center text-[8px] font-black uppercase tracking-widest border border-white/20 bg-white/10 text-white`}>{livestock.healthStatus}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative pb-32 no-scrollbar overflow-y-auto">
      <div className="flex flex-col items-center justify-center py-4">
        <span className={`${isDarkMode ? 'text-white' : 'text-[#1D3C2B]/60'} text-[9px] font-black uppercase tracking-[0.2em] mb-1`}>إجمالي {selectedCategory}</span>
        <div className="relative mb-3">
           <span className={`${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'} text-3xl font-black`}>{filteredLivestock.length}</span>
           <div className="h-1 w-full bg-green-500 rounded-full mt-1"></div>
        </div>

        {/* حقل بحث مصغر */}
        <div className="px-12 w-full mb-2">
           <div className="relative" id="search-input-container">
             <input 
                type="text" 
                placeholder="بحث برقم الوسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-8 px-4 pr-10 rounded-full border ${modalBorder} bg-white/5 font-bold text-[11px] outline-none ${modalInputText} focus:bg-white/10 transition-all`}
             />
             <svg className="search-icon w-3.5 h-3.5 text-white/40 absolute right-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 animate-fade-in pb-20">
        {filteredLivestock.map((item) => <LivestockCard key={item.id} livestock={item} />)}
      </div>

      {selectedAnimal && (
        <div className={`fixed inset-0 z-[110] flex flex-col animate-fade-in ${isDarkMode ? 'bg-[#051810]' : 'bg-[#EBF2E5]'}`}>
           <div className="px-6 py-6 flex justify-between items-center relative z-10 shrink-0">
              <h3 className={`${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'} text-xl font-black`}>بطاقة التعريف</h3>
              <button onClick={() => setSelectedAnimal(null)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
           <div className="flex-1 p-6 flex flex-col items-center">
              <div className="w-full bg-gradient-to-br from-[#1D3C2B] to-[#356148] p-10 rounded-[2.5rem] shadow-2xl text-center mb-8">
                 <h2 className="text-5xl font-black text-white">#{selectedAnimal.tagId}</h2>
                 <p className="text-white/60 font-bold mt-2">{selectedAnimal.subType} - {selectedAnimal.breed}</p>
              </div>
           </div>
           <FloatingBackButton onClick={() => setSelectedAnimal(null)} />
        </div>
      )}

      {onBack && <FloatingBackButton onClick={onBack} />}
    </div>
  );
};

export default HerdPage;
