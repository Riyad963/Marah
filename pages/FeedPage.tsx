
import React, { useState, useMemo, useEffect } from 'react';
import { storageService } from '../services/storageService.ts';
import { soundService } from '../services/soundService.ts';
import { LivestockCategory } from '../types.ts';
import FloatingBackButton from '../components/FloatingBackButton.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface FeedItem {
  id: string;
  type: string;
  stock: number;
  quantityStr: string;
  unit: string;
  price: string;
  date: string;
  status: 'كافٍ' | 'منخفض' | 'حرج';
}

interface FeedRule {
  id: string;
  label: string;
  amount: string; 
  count: number;  
}

const DEFAULT_RULES: FeedRule[] = [
    { id: 'young', label: 'صغار (أقل من 3 أشهر)', amount: '0.2', count: 0 },
    { id: 'growing', label: 'نامي (3 - 6 أشهر)', amount: '0.6', count: 0 },
    { id: 'male_adult', label: 'ذكور / تسمين (+6 أشهر)', amount: '2.0', count: 0 },
    { id: 'female_empty', label: 'إناث (عادي / فارغ)', amount: '1.5', count: 0 },
    { id: 'preg_1', label: 'دافع (جنين واحد)', amount: '1.8', count: 0 },
    { id: 'preg_2', label: 'دافع (توأم 2)', amount: '2.3', count: 0 },
    { id: 'preg_3', label: 'دافع (توأم 3+)', amount: '2.8', count: 0 },
];

const FEED_TYPES = ['شعير', 'برسيم', 'تبن', 'شوفان', 'ذرة', 'نخالة'];
const FEED_UNITS = ['كلغ', 'قنطار', 'طن', 'بالة'];

const FeedPage: React.FC<{ 
  isDarkMode?: boolean; 
  userRole: string; 
  userCurrency: string;
  selectedCategory: LivestockCategory; 
  onBack?: () => void;
}> = ({ isDarkMode, userRole, userCurrency, selectedCategory, onBack }) => {
  const { t } = useLanguage();
  const [feedStock, setFeedStock] = useState<FeedItem[]>([]);
  const [activeTab, setActiveTab] = useState<'stock' | 'calculator'>('stock');
  const [pricePerKg, setPricePerKg] = useState('1.2');
  
  // Calculator State
  const [rules, setRules] = useState<FeedRule[]>(DEFAULT_RULES);
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [isRulesLoaded, setIsRulesLoaded] = useState(false);

  // Modals
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const [feedForm, setFeedForm] = useState({ type: 'شعير', quantity: '', unit: 'كلغ', price: '', date: new Date().toISOString().split('T')[0] });

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      setIsRulesLoaded(false);
      
      const loadedFeed = await storageService.load('marah_feed', []);
      setFeedStock(loadedFeed);
      
      // Load category-specific rules
      const savedRules = await storageService.load(`marah_feed_rules_${selectedCategory}`, null);
      if (savedRules) {
        setRules(savedRules);
      } else {
        setRules(DEFAULT_RULES);
      }
      setIsRulesLoaded(true);
    };
    fetchData();
  }, [selectedCategory]);

  // Auto-save Rules when they change (only after initial load)
  useEffect(() => {
    if (isRulesLoaded) {
      storageService.save(`marah_feed_rules_${selectedCategory}`, rules);
    }
  }, [rules, isRulesLoaded, selectedCategory]);

  const totalStockKg = useMemo(() => {
    return feedStock.reduce((acc, item) => {
        let weight = item.stock; 
        if (item.unit === 'طن') weight = item.stock * 1000;
        if (item.unit === 'قنطار') weight = item.stock * 100;
        return acc + weight;
    }, 0);
  }, [feedStock]);

  const calcResults = useMemo(() => {
      let dailyTotal = 0;
      rules.forEach(r => dailyTotal += (parseFloat(r.amount) || 0) * r.count);
      return { dailyTotal, monthlyTotal: dailyTotal * 30, monthlyCost: dailyTotal * 30 * (parseFloat(pricePerKg) || 0) };
  }, [rules, pricePerKg]);

  const submitFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedForm.quantity) return;
    const qty = parseFloat(feedForm.quantity);
    
    let status: 'كافٍ' | 'منخفض' | 'حرج' = 'كافٍ';
    if (feedForm.unit === 'طن' && qty < 0.5) status = 'حرج';
    else if (feedForm.unit === 'كلغ' && qty < 50) status = 'حرج';
    else if (feedForm.unit === 'طن' && qty < 1) status = 'منخفض';
    else if (feedForm.unit === 'كلغ' && qty < 100) status = 'منخفض';

    const newItem = { 
      id: editingItem?.id || Date.now().toString(), 
      type: feedForm.type, 
      stock: qty, 
      unit: feedForm.unit, 
      price: feedForm.price, 
      date: feedForm.date, 
      status: status, 
      quantityStr: `${qty} ${feedForm.unit}` 
    };
    setFeedStock(prev => editingItem ? prev.map(i => i.id === editingItem.id ? newItem : i) : [newItem, ...prev]);
    setShowFeedModal(false);
    storageService.save('marah_feed', editingItem ? feedStock.map(i => i.id === editingItem.id ? newItem : i) : [newItem, ...feedStock]);
    soundService.playSuccess();
  };

  const toggleEditMode = () => {
    if (isEditingRules) {
        soundService.playSuccess();
    } else {
        soundService.playClick();
    }
    setIsEditingRules(!isEditingRules);
  };

  const modalText = isDarkMode ? 'text-white' : 'text-[#1D3C2B]';
  const modalBorder = isDarkMode ? 'border-white/40' : 'border-[#1D3C2B]/20';

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative pb-32 no-scrollbar overflow-y-auto">
      <div className="flex flex-col items-center justify-center pt-8 pb-4">
        <span className="text-xs font-black uppercase tracking-[0.3em] mb-1 opacity-40 text-white">{t('feed_mgmt')}</span>
        <div className="flex bg-black/10 p-1 rounded-2xl gap-1 mt-2">
            <button onClick={() => setActiveTab('stock')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'stock' ? 'bg-[#1D3C2B] text-white' : 'text-white/60'}`}>{t('stock_tab')}</button>
            <button onClick={() => setActiveTab('calculator')} className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'calculator' ? 'bg-[#1D3C2B] text-white' : 'text-white/60'}`}>{t('calc_tab')}</button>
        </div>
      </div>

      {activeTab === 'stock' && (
        <div className="animate-fade-in px-4">
             <div className="text-center mb-6">
                <span className="text-4xl font-black text-white">{Math.round(totalStockKg)}<span className="text-xl">{t('كلغ')}</span></span>
                <button onClick={() => { setEditingItem(null); setFeedForm({type:'شعير', quantity:'', unit:'كلغ', price:'', date: new Date().toISOString().split('T')[0]}); setShowFeedModal(true); }} className="mt-4 bg-[#1D3C2B] text-white px-6 py-2 rounded-xl text-sm font-black mx-auto block border border-white/20">{t('add_stock')}</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {feedStock.map(item => (
                    <div key={item.id} className="p-4 rounded-[2rem] border border-white/10 shadow-lg bg-[#1D3C2B] flex flex-col justify-between aspect-[1/1.2] relative">
                        {item.status === 'حرج' && (
                          <div className="absolute top-4 left-4">
                            <span className="flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </span>
                            </span>
                          </div>
                        )}
                        <h4 className="text-white/60 text-[11px] font-black uppercase">{t(item.type)}</h4>
                        <span className="text-3xl font-black text-white">{item.stock} {t(item.unit)}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'calculator' && (
        <div className="animate-fade-in px-4 pb-24">
           {/* Summary Card */}
           <div className="bg-[#1D3C2B] p-5 rounded-[2rem] shadow-xl mb-6 border border-white/10">
              <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                 <div>
                    <p className="text-white/60 text-[10px] font-black uppercase">{t('daily_consumption')}</p>
                    <p className="text-2xl font-black text-white">{calcResults.dailyTotal.toFixed(1)} <span className="text-sm">{t('unit_kg')}</span></p>
                 </div>
                 <div className="text-right">
                    <p className="text-white/60 text-[10px] font-black uppercase">{t('monthly_cost')}</p>
                    <p className="text-2xl font-black text-[#4ade80]">{Math.round(calcResults.monthlyCost).toLocaleString()} <span className="text-sm">{userCurrency}</span></p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                 <span className="text-white text-xs font-bold whitespace-nowrap">{t('fodder_price')} ({userCurrency}/KG)</span>
                 <input 
                   type="number" 
                   value={pricePerKg} 
                   onChange={(e) => setPricePerKg(e.target.value)} 
                   className="w-full bg-transparent text-right text-white font-black outline-none border-b border-white/20 focus:border-[#4ade80]"
                 />
              </div>
           </div>

           {/* Edit/Save Header */}
           <div className="flex justify-end mb-4 px-1">
              <button 
                onClick={toggleEditMode}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95 ${
                    isEditingRules 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {isEditingRules ? t('save_changes') : t('edit')}
              </button>
           </div>

           {/* Rules List */}
           <div className="flex flex-col gap-3">
              {rules.map((rule, index) => (
                 <div key={rule.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all duration-300 ${isEditingRules ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex-1">
                       <p className="text-white font-bold text-sm mb-1">{t(`rule_${rule.id}`)}</p>
                       <div className="flex items-center gap-2">
                          {isEditingRules ? (
                              <input 
                                type="number" 
                                value={rule.amount}
                                onChange={(e) => {
                                   const newRules = [...rules];
                                   newRules[index].amount = e.target.value;
                                   setRules(newRules);
                                }}
                                className="w-20 bg-black/40 rounded-lg px-2 py-1.5 text-center text-white text-sm font-black outline-none border border-green-500/50 focus:border-green-400 focus:bg-black/60 transition-colors"
                              />
                          ) : (
                              <span className="text-white text-sm font-black bg-black/20 px-2 py-1 rounded-lg border border-white/5 min-w-[3rem] text-center">{rule.amount}</span>
                          )}
                          <span className="text-white/40 text-[10px] font-bold">KG/{t('head')}</span>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/20 rounded-xl p-1.5 border border-white/5">
                       <button 
                         onClick={() => {
                            const newRules = [...rules];
                            if(newRules[index].count > 0) newRules[index].count--;
                            setRules(newRules);
                            soundService.playClick();
                         }}
                         className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all border border-white/5"
                       >
                         -
                       </button>
                       <span className="w-8 text-center text-white font-black">{rule.count}</span>
                       <button 
                         onClick={() => {
                            const newRules = [...rules];
                            newRules[index].count++;
                            setRules(newRules);
                            soundService.playClick();
                         }}
                         className="w-8 h-8 rounded-lg bg-[#1D3C2B] flex items-center justify-center text-white hover:bg-[#2F5E45] active:scale-90 transition-all border border-white/20 shadow-md"
                       >
                         +
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {showFeedModal && (
         <div className="fixed inset-0 z-[120] flex flex-col p-4 bg-black/80 backdrop-blur-sm">
            <div className={`w-full max-w-sm rounded-[2rem] p-6 relative flex flex-col mx-auto ${isDarkMode ? 'bg-[#051810]' : 'bg-[#EBF2E5]'} border-2 ${modalBorder}`}>
               <h3 className={`text-xl font-black mb-6 ${modalText}`}>{t('add_stock')}</h3>
               <form onSubmit={submitFeed} className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-2">
                    {FEED_TYPES.map(ft => (
                      <button key={ft} type="button" onClick={() => setFeedForm({...feedForm, type: ft})} className={`py-2 rounded-xl text-[11px] font-black border ${feedForm.type === ft ? 'bg-[#1D3C2B] text-white' : 'bg-black/10 text-black'}`}>{t(ft)}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="number" required placeholder={t('quantity')} value={feedForm.quantity} onChange={(e) => setFeedForm({...feedForm, quantity: e.target.value})} className="flex-1 h-12 bg-white/5 border border-white/20 rounded-xl px-4 text-white" />
                    <select value={feedForm.unit} onChange={(e) => setFeedForm({...feedForm, unit: e.target.value})} className="w-24 h-12 bg-white/5 border border-white/20 rounded-xl px-2 text-white text-xs">
                      {FEED_UNITS.map(u => <option key={u} value={u} className="text-black">{t(u)}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="h-14 bg-[#1D3C2B] text-white rounded-2xl font-black border border-white/20">{t('save_record')}</button>
               </form>
               <button onClick={() => setShowFeedModal(false)} className="mt-4 text-white/50 text-xs font-bold uppercase tracking-widest">{t('cancel')}</button>
            </div>
         </div>
      )}

      {onBack && <FloatingBackButton onClick={onBack} />}
    </div>
  );
};

export default FeedPage;
