
import React, { useState, useEffect, useMemo } from 'react';
import FloatingBackButton from '../components/FloatingBackButton.tsx';
import { LivestockCategory } from '../types.ts';
import { storageService } from '../services/storageService.ts';
import { soundService } from '../services/soundService.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

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

const HerdPage: React.FC<{ 
  isDarkMode?: boolean; 
  selectedCategory: LivestockCategory; 
  userRole: string; 
  userCurrency: string; 
  onBack?: () => void 
}> = ({ isDarkMode, selectedCategory, userRole, userCurrency, onBack }) => {
  const { t } = useLanguage();
  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Livestock>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const loadedData = await storageService.load('marah_livestock', []);
    setLivestock(loadedData);
  };

  const filteredLivestock = useMemo(() => {
    return livestock.filter(item => 
      item.category === selectedCategory &&
      (item.tagId.toLowerCase().includes(searchQuery.toLowerCase()) || 
       item.subType.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [livestock, selectedCategory, searchQuery]);

  const handleUpdateStatus = async (animalId: string, newStatus: Livestock['healthStatus']) => {
    const updated = livestock.map(a => a.id === animalId ? { ...a, healthStatus: newStatus } : a);
    setLivestock(updated);
    await storageService.save('marah_livestock', updated);
    soundService.playSuccess();
    if (selectedAnimal?.id === animalId) {
        setSelectedAnimal({ ...selectedAnimal, healthStatus: newStatus });
    }
  };

  const handleDelete = async (animalId: string) => {
    if (confirm(t('confirm_delete'))) {
        const updated = livestock.filter(a => a.id !== animalId);
        setLivestock(updated);
        await storageService.save('marah_livestock', updated);
        soundService.playError();
        setSelectedAnimal(null);
    }
  };

  const handleSaveEdit = async () => {
    const updated = livestock.map(a => a.id === editFormData.id ? { ...a, ...editFormData } : a);
    setLivestock(updated);
    await storageService.save('marah_livestock', updated);
    soundService.playSuccess();
    setSelectedAnimal(editFormData as Livestock);
    setShowEditModal(false);
  };

  const recordBirth = (mother: Livestock) => {
    soundService.playClick();
    alert(`${t('action_birth')} #${mother.tagId}`);
  };

  const modalBorder = isDarkMode ? 'border-white/20' : 'border-[#1D3C2B]/10';
  const modalInputText = isDarkMode ? 'text-white' : 'text-[#1D3C2B]';

  // --- Professional Animal Card ---
  const LivestockCard: React.FC<{ livestock: Livestock }> = ({ livestock }) => {
    let healthColor = 'from-emerald-600 to-teal-800';
    if (livestock.healthStatus === 'مريض') healthColor = 'from-rose-600 to-red-900';
    if (livestock.healthStatus === 'يتعافى') healthColor = 'from-amber-500 to-orange-700';
    if (livestock.healthStatus === 'نفوق') healthColor = 'from-zinc-700 to-black';
    if (livestock.healthStatus === 'مباع') healthColor = 'from-sky-700 to-indigo-900';

    return (
      <div 
        onClick={() => { soundService.playClick(); setSelectedAnimal(livestock); }} 
        className={`relative aspect-[1/1.3] p-4 flex flex-col rounded-[2rem] border border-white/10 shadow-2xl bg-gradient-to-br ${healthColor} transition-all duration-300 active:scale-95 group cursor-pointer overflow-hidden`}
      >
        {/* Subtle Glass Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
        
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex justify-between items-start mb-2">
             <div className="bg-black/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                <span className="text-[11px] font-black text-white uppercase tracking-tighter">{t(livestock.subType)}</span>
             </div>
             <div className="flex items-center gap-1.5">
                {livestock.isPregnant && <span className="text-white text-xs animate-bounce">🤰</span>}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border border-white/20 ${livestock.gender === 'ذكر' ? 'bg-blue-400/20' : 'bg-pink-400/20'}`}>
                    <span className="text-white text-[10px] font-black">{livestock.gender === 'ذكر' ? '♂' : '♀'}</span>
                </div>
             </div>
          </div>
          
          <div className="mt-1">
            <span className="text-xs font-bold text-white/50 block">{t('tag_id')}</span>
            <h4 className="text-3xl font-black text-white tracking-tighter">#{livestock.tagId}</h4>
          </div>

          <div className="mt-3 flex flex-col gap-0.5">
             <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-white/50"></div>
                <span className="text-xs font-bold text-white/80">{livestock.breed}</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-white/50"></div>
                <span className="text-xs font-bold text-white/80">{livestock.age.split(',')[0]}</span>
             </div>
          </div>

          <div className="mt-auto">
            <div className="w-full py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-widest bg-black/30 text-white border border-white/10 backdrop-blur-md">
                {t(livestock.healthStatus)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DetailItem = ({ label, value, icon, fullWidth = false }: any) => (
    <div className={`flex flex-col gap-0.5 p-4 rounded-[1.8rem] border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'} ${fullWidth ? 'col-span-2' : ''}`}>
        <div className="flex items-center gap-1.5 opacity-50 mb-0.5">
            <span className="text-sm">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <span className={`text-base font-black truncate ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}>{value || '---'}</span>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative pb-32 no-scrollbar overflow-y-auto">
      
      {/* Search Header */}
      <div className="flex flex-col items-center justify-center py-6 px-5">
        <span className={`${isDarkMode ? 'text-white/40' : 'text-[#1D3C2B]/40'} text-xs font-black uppercase tracking-[0.4em] mb-3`}>{t('livestock_reports')} • {t(selectedCategory)}</span>
        <div className="w-full relative" id="search-input-container">
             <input 
                type="text" 
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-12 px-6 pr-12 rounded-2xl border-2 ${modalBorder} bg-white/5 font-bold text-sm outline-none ${modalInputText} focus:bg-white/10 transition-all shadow-lg`}
             />
             <svg className="search-icon w-5 h-5 text-white/30 absolute right-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-5 animate-fade-in pb-24">
        {filteredLivestock.length > 0 ? (
            filteredLivestock.map((item) => <LivestockCard key={item.id} livestock={item} />)
        ) : (
            <div className="col-span-2 py-32 text-center opacity-30 flex flex-col items-center">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <p className="text-lg font-black uppercase tracking-[0.2em]">{t('empty_record')}</p>
            </div>
        )}
      </div>

      {/* --- PROFESSIONAL ANIMAL DETAILS OVERLAY --- */}
      {selectedAnimal && (
        <div className={`fixed inset-0 z-[150] flex flex-col animate-fade-in ${isDarkMode ? 'bg-[#051810]' : 'bg-[#F4F7F2]'} overflow-y-auto no-scrollbar`}>
           
           {/* Top Sticky Header */}
           <div className="sticky top-0 z-50 px-5 py-4 flex justify-between items-center backdrop-blur-md bg-transparent shrink-0">
              <button onClick={() => setSelectedAnimal(null)} className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center ${isDarkMode ? 'bg-white/10 border border-white/10' : 'bg-black/5 border border-black/5'} text-current active:scale-90 transition-all`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <div className="text-center">
                  <h3 className={`${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'} text-lg font-black uppercase tracking-widest`}>{t('animal_data')}</h3>
                  <div className="h-0.5 w-6 bg-green-500 rounded-full mx-auto mt-0.5"></div>
              </div>

              <button 
                onClick={() => { setEditFormData(selectedAnimal); setShowEditModal(true); }}
                className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'} active:scale-90 transition-all`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
           </div>

           <div className="flex-1 px-5 pb-48">
              {/* Cinematic Hero Banner */}
              <div className={`w-full bg-gradient-to-br from-[#1D3C2B] to-[#0A2617] p-8 rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] text-center mb-8 border border-white/10 relative overflow-hidden`}>
                 <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                 <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -ml-12 -mb-12"></div>
                 
                 <span className="text-xs font-black text-green-400/80 uppercase tracking-[0.4em] block mb-1">{t(selectedAnimal.subType)}</span>
                 <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">#{selectedAnimal.tagId}</h2>
                 
                 <div className="flex justify-center gap-3 mt-6">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black text-white border border-white/10">
                        {t(selectedAnimal.healthStatus)}
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-black text-white border border-white/10">
                        {t(selectedAnimal.gender)}
                    </div>
                 </div>
              </div>

              {/* Information Bento Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                  <div className="col-span-2 mb-1 px-1">
                     <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-[#1D3C2B]/30'}`}>{t('identity_origin')}</h4>
                  </div>
                  <DetailItem label={t('breed_opt')} value={selectedAnimal.breed} icon="🧬" />
                  <DetailItem label={t('completed_age')} value={selectedAnimal.age.split(',')[0]} icon="⏳" />
                  <DetailItem label={t('birth_date')} value={selectedAnimal.dob} icon="📅" fullWidth />
                  
                  <div className="col-span-2 mt-4 mb-1 px-1">
                     <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-[#1D3C2B]/30'}`}>{t('reproduction_record')}</h4>
                  </div>
                  <DetailItem label={t('father_tag')} value={selectedAnimal.fatherId} icon="♂" />
                  <DetailItem label={t('mother_tag')} value={selectedAnimal.motherId} icon="♀" />
                  
                  {selectedAnimal.gender === 'أنثى' && (
                      <div className="col-span-2 grid grid-cols-2 gap-3.5 animate-fade-in mt-1">
                        <DetailItem label={t('pregnancy_status')} value={selectedAnimal.isPregnant ? t('is_pregnant') : t('not_pregnant')} icon="🤰" fullWidth={!selectedAnimal.isPregnant} />
                        {selectedAnimal.isPregnant && (
                            <>
                                <DetailItem label={t('expected_delivery')} value={selectedAnimal.deliveryDate} icon="🐣" />
                                <DetailItem label={t('expected_fetus')} value={selectedAnimal.fetusCount} icon="💎" fullWidth />
                            </>
                        )}
                        <DetailItem label={t('milk_prod')} value={`${selectedAnimal.dailyMilk} ${t('liter')}/${t('day')}`} icon="🥛" fullWidth />
                      </div>
                  )}

                  <div className="col-span-2 mt-4 mb-1 px-1">
                     <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/30' : 'text-[#1D3C2B]/30'}`}>{t('admin_care')}</h4>
                  </div>
                  <DetailItem label={t('feed_quota')} value={selectedAnimal.feedAmount} icon="🌾" />
                  <DetailItem label={t('last_vax')} value={selectedAnimal.vaccination || t('none')} icon="💉" />
                  
                  {selectedAnimal.notes && (
                      <div className={`col-span-2 p-5 rounded-[2rem] border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                         <span className="text-[10px] font-black opacity-30 block mb-2 uppercase tracking-widest">{t('tech_notes')}</span>
                         <p className={`text-sm font-bold leading-relaxed ${isDarkMode ? 'text-white/80' : 'text-[#1D3C2B]/80'}`}>{selectedAnimal.notes}</p>
                      </div>
                  )}
              </div>
           </div>

           {/* --- STYLISED FLOATING ACTION BAR --- */}
           <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] z-[160] rounded-[2.5rem] p-3 shadow-[0_15px_40px_rgba(0,0,0,0.4)] border flex items-center justify-between gap-2.5 ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/90 border-black/10'} backdrop-blur-2xl animate-fade-in`}>
                {selectedAnimal.gender === 'أنثى' && selectedAnimal.isPregnant && (
                    <button 
                        onClick={() => recordBirth(selectedAnimal)}
                        className="flex-1 h-14 bg-pink-600 hover:bg-pink-500 text-white rounded-[1.8rem] flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-lg"
                    >
                        <span className="text-xl">🍼</span>
                        <span className="text-[10px] font-black uppercase tracking-tight">{t('action_birth')}</span>
                    </button>
                )}
                
                <button 
                    onClick={() => handleUpdateStatus(selectedAnimal.id, 'نفوق')}
                    className="flex-1 h-14 bg-zinc-800 hover:bg-zinc-700 text-white rounded-[1.8rem] flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-lg"
                >
                    <span className="text-xl">💀</span>
                    <span className="text-[10px] font-black uppercase tracking-tight">{t('action_death')}</span>
                </button>

                <button 
                    onClick={() => handleUpdateStatus(selectedAnimal.id, 'مباع')}
                    className="flex-1 h-14 bg-sky-700 hover:bg-sky-600 text-white rounded-[1.8rem] flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-lg"
                >
                    <span className="text-xl">💰</span>
                    <span className="text-[10px] font-black uppercase tracking-tight">{t('action_sell')}</span>
                </button>

                <button 
                    onClick={() => handleDelete(selectedAnimal.id)}
                    className="w-14 h-14 bg-rose-600/20 text-rose-500 border border-rose-500/30 rounded-[1.8rem] flex items-center justify-center active:scale-95 transition-all"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
           </div>
        </div>
      )}

      {/* EDIT MODAL OVERLAY */}
      {showEditModal && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-5 animate-fade-in" dir="rtl">
              <div className={`w-full max-w-sm rounded-[3rem] p-8 relative flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl ${isDarkMode ? 'bg-[#051810] border border-white/10' : 'bg-white border border-gray-100'}`}>
                  <h3 className={`text-2xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'}`}>{t('edit')}</h3>
                  
                  <div className="space-y-5">
                      <div className="space-y-1.5">
                          <label className="text-[11px] font-black opacity-40 uppercase tracking-[0.2em] block px-1">{t('tag_id')}</label>
                          <input 
                            type="text" 
                            value={editFormData.tagId} 
                            onChange={(e) => setEditFormData({ ...editFormData, tagId: e.target.value })}
                            className={`w-full h-12 rounded-xl px-5 font-black text-lg bg-white/5 border border-white/10 text-current outline-none focus:border-green-400`}
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[11px] font-black opacity-40 uppercase tracking-[0.2em] block px-1">{t('breed_opt')}</label>
                          <input 
                            type="text" 
                            value={editFormData.breed} 
                            onChange={(e) => setEditFormData({ ...editFormData, breed: e.target.value })}
                            className={`w-full h-12 rounded-xl px-5 font-black text-lg bg-white/5 border border-white/10 text-current outline-none focus:border-green-400`}
                          />
                      </div>
                      <div className="space-y-1.5">
                          <label className="text-[11px] font-black opacity-40 uppercase tracking-[0.2em] block px-1">{t('health_status')}</label>
                          <select 
                            value={editFormData.healthStatus}
                            onChange={(e) => setEditFormData({ ...editFormData, healthStatus: e.target.value as any })}
                            className={`w-full h-12 rounded-xl px-5 font-black text-lg bg-transparent border border-white/10 text-current outline-none focus:border-green-400`}
                          >
                             <option value="سليم" className="text-black">{t('healthy')}</option>
                             <option value="يتعافى" className="text-black">{t('recovering')}</option>
                             <option value="مريض" className="text-black">{t('sick')}</option>
                             <option value="نفوق" className="text-black">{t('dead')}</option>
                             <option value="مباع" className="text-black">{t('sold')}</option>
                          </select>
                      </div>
                  </div>

                  <div className="flex flex-col gap-3.5 mt-10">
                      <button 
                        onClick={handleSaveEdit}
                        className="h-14 bg-green-600 text-white rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all"
                      >
                        {t('save_changes')}
                      </button>
                      <button 
                        onClick={() => setShowEditModal(false)}
                        className="h-14 bg-white/5 text-current rounded-2xl font-black text-base border border-white/10 active:scale-95 transition-all"
                      >
                        {t('cancel')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {onBack && !selectedAnimal && <FloatingBackButton onClick={onBack} />}
    </div>
  );
};

export default HerdPage;
