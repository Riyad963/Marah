
import React, { useState, useMemo, useEffect } from 'react';
import { storageService } from '../services/storageService.ts';
import { LivestockCategory } from '../types.ts';
import FloatingBackButton from '../components/FloatingBackButton.tsx';

interface AnimalNode {
  id: string;
  tagId: string;
  name?: string;
  gender: string;
  breed: string;
  healthStatus: string;
  age: string;
  fatherId?: string;
  motherId?: string;
  productionScore?: number; 
}

const BreedsPage: React.FC<{ 
  isDarkMode?: boolean; 
  userRole: string; 
  selectedCategory: LivestockCategory; 
  onBack?: () => void;
}> = ({ isDarkMode, selectedCategory, onBack }) => {
  const [livestock, setLivestock] = useState<any[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<string | null>(null);
  const [focusedAnimalId, setFocusedAnimalId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await storageService.load('marah_livestock', []);
      const categoryData = data.filter((l: any) => l.category === selectedCategory);
      setLivestock(categoryData);
      if (categoryData.length > 0 && !selectedBreed) setSelectedBreed(categoryData[0].breed || 'غير محدد');
    };
    fetchData();
  }, [selectedCategory]);

  const treeData = useMemo(() => {
    if (!focusedAnimalId) return null;
    const mainAnimal = livestock.find(a => a.id === focusedAnimalId);
    if (!mainAnimal) return null;
    return { main: mainAnimal, children: livestock.filter(a => a.fatherId === mainAnimal.tagId || a.motherId === mainAnimal.tagId) };
  }, [focusedAnimalId, livestock]);

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col relative pb-32 no-scrollbar overflow-y-auto bg-[#051810]">
      <div className="relative pt-8 pb-4 px-6">
         <h2 className="text-2xl font-black text-white">الخريطة الوراثية</h2>
      </div>
      <div className="flex-1 flex flex-col items-center py-6">
         {treeData ? (
             <div className="w-28 h-28 rounded-full bg-indigo-900/40 border-2 border-indigo-500/50 flex flex-col items-center justify-center">
                <span className="text-2xl">{treeData.main.gender === 'ذكر' ? '♂' : '♀'}</span>
                <span className="font-black text-sm text-white">#{treeData.main.tagId}</span>
             </div>
         ) : <div className="text-white/30 text-xs">اختر سلالة للبدء</div>}
      </div>
      {onBack && <FloatingBackButton onClick={onBack} />}
    </div>
  );
};

export default BreedsPage;
