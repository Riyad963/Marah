
import React, { useState, useEffect } from 'react';
import FloatingBackButton from '../components/FloatingBackButton.tsx';
import { storageService } from '../services/storageService.ts';
import { soundService } from '../services/soundService.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

const DevicesPage: React.FC<{ isDarkMode?: boolean; onBack?: () => void }> = ({ isDarkMode, onBack }) => {
  const { t } = useLanguage();
  const [devices, setDevices] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ name: '', type: 'طوق ذكي', serial: '' });

  useEffect(() => {
    const fetchData = async () => {
      const savedDevices = await storageService.load('marah_devices', []);
      setDevices(savedDevices);
    };
    fetchData();
  }, []);

  useEffect(() => { storageService.save('marah_devices', devices); }, [devices]);

  const handleDelete = (id: string) => {
      if (confirm(t('confirm_delete'))) {
          setDevices(devices.filter(d => d.id !== id));
          soundService.playError();
      }
  };

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative pb-32 no-scrollbar overflow-y-auto px-4">
      <div className="flex flex-col items-center justify-center py-8">
        <h2 className={`${isDarkMode ? 'text-white' : 'text-[#1D3C2B]'} text-3xl font-black`}>{t('tracking_devices_title')}</h2>
      </div>
      <div className="flex flex-col gap-4">
        {devices.map((device) => (
          <div key={device.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
            <div><h4 className="text-white font-black text-base">{device.name}</h4><span className="text-white/40 text-[11px]">{device.id}</span></div>
            <button onClick={() => handleDelete(device.id)} className="text-red-500 text-sm font-bold">{t('delete')}</button>
          </div>
        ))}
      </div>
      {onBack && <FloatingBackButton onClick={onBack} />}
    </div>
  );
};

export default DevicesPage;
