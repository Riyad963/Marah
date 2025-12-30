
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService.ts';
import { soundService } from '../services/soundService.ts';
import FloatingBackButton from '../components/FloatingBackButton.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface Worker {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: string;
  status: 'متاح' | 'إجازة' | 'مشغول';
  image: string;
}

const WorkersPage: React.FC<{ isDarkMode?: boolean; userCurrency: string; onBack?: () => void }> = ({ isDarkMode, userCurrency, onBack }) => {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const savedWorkers = await storageService.load('marah_workers', []);
      setWorkers(savedWorkers);
    };
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
      if (confirm(t('confirm_delete'))) {
          const updated = workers.filter(w => w.id !== id);
          setWorkers(updated);
          await storageService.save('marah_workers', updated);
          soundService.playError();
      }
  };

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative pb-32 no-scrollbar overflow-y-auto px-4">
      <div className="flex flex-col items-center justify-center py-8">
        <h2 className={`${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'} text-3xl font-black`}>{t('work_team')}</h2>
      </div>
      <div className="flex flex-col gap-4">
        {workers.map((worker) => (
          <div key={worker.id} className="p-4 rounded-[1.5rem] border bg-white/5 border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden"><img src={worker.image} className="w-full h-full object-cover" /></div>
              <div><h4 className="text-white font-black text-sm">{worker.name}</h4><p className="text-white/50 text-[11px]">{t(worker.role)}</p></div>
            </div>
            <button onClick={() => handleDelete(worker.id)} className="text-red-400 text-sm">{t('delete')}</button>
          </div>
        ))}
      </div>
      {onBack && <FloatingBackButton onClick={onBack} />}
    </div>
  );
};

export default WorkersPage;
