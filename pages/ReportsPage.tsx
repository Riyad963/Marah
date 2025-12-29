
import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService.ts';
import { aiService } from '../services/aiService.ts';
import { soundService } from '../services/soundService.ts';
import FloatingBackButton from '../components/FloatingBackButton.tsx';

const APP_LOGO_URL = "https://i.ibb.co/Tx36fB5C/20251228-105841.png";

const ReportsPage: React.FC<{ userRole: string; userCurrency: string; isDarkMode?: boolean; onBack?: () => void }> = ({ userRole, userCurrency, isDarkMode = true, onBack }) => {
  const [data, setData] = useState({
    livestock: [] as any[],
    feed: [] as any[],
    sales: [] as any[],
    workers: [] as any[],
    devices: [] as any[]
  });

  useEffect(() => {
    const loadAll = async () => {
      const [livestock, feed, sales, workers, devices] = await Promise.all([
        storageService.load('marah_livestock', []),
        storageService.load('marah_feed', []),
        storageService.load('marah_sales', []),
        storageService.load('marah_workers', []),
        storageService.load('marah_devices', [])
      ]);
      setData({ livestock, feed, sales, workers, devices });
    };
    loadAll();
  }, []);

  const stats = useMemo(() => {
    const { livestock, feed, sales, workers } = data;
    const totalHeads = livestock.length;
    const sickHeads = livestock.filter(l => l.healthStatus === 'مريض').length;
    const pregnantCount = livestock.filter(l => l.isPregnant).length;
    const mortalityCount = livestock.filter(l => l.healthStatus === 'نفوق').length;
    
    let totalStockKg = feed.reduce((acc, f) => {
        let w = parseFloat(f.stock) || 0;
        if (f.unit === 'طن') w *= 1000;
        if (f.unit === 'قنطار') w *= 100;
        return acc + w;
    }, 0);

    const dailyMilkTotal = livestock.reduce((acc, l) => acc + (parseFloat(l.dailyMilk) || 0), 0);
    const totalRevenue = sales.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
    const feedCosts = feed.reduce((acc, f) => acc + (parseFloat(f.price) || 0), 0);
    const laborCosts = workers.reduce((acc, w) => acc + (parseFloat(w.salary) || 0), 0);

    return { totalHeads, sickHeads, pregnantCount, mortalityCount, totalStockKg, dailyMilkTotal, totalRevenue, feedCosts, laborCosts };
  }, [data]);

  const SectionCard = ({ title, color, children }: any) => (
    <div className={`p-5 rounded-[2rem] border mb-5 bg-white/5 border-white/10 shadow-xl`} dir="rtl">
      <div className="flex items-center gap-2 mb-4 border-r-4 border-green-500 pr-3">
        <h3 className="text-sm font-black text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  const StatItem = ({ label, value, unit, color = "white" }: any) => (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-[11px] font-bold text-white/60">{label}</span>
      <span className={`text-xs font-black text-${color}-400`}>{value} <span className="text-[9px] opacity-40">{unit}</span></span>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col pb-40 no-scrollbar overflow-y-auto px-4" dir="rtl">
      <div className="flex flex-col items-center py-8">
        <div className="w-16 h-16 bg-gradient-to-br from-[#1D3C2B] to-[#051810] rounded-2xl flex items-center justify-center mb-4 border border-white/10">
           <img src={APP_LOGO_URL} className="w-10 h-10" />
        </div>
        <h2 className="text-white text-xl font-black">تقارير المنشأة</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
         <button className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2.5}/></svg>
            <span className="text-[10px] font-black">تصدير Excel</span>
         </button>
         <button className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeWidth={2.5}/></svg>
            <span className="text-[10px] font-black">تصدير PDF</span>
         </button>
      </div>

      <SectionCard title="تقارير الثروة الحيوانية">
        <StatItem label="إجمالي عدد الرؤوس" value={stats.totalHeads} unit="رأس" />
        <StatItem label="الإناث الحوامل" value={stats.pregnantCount} unit="رأس" />
      </SectionCard>

      <SectionCard title="تقارير الصحة والبيطرة">
        <StatItem label="حالات مرضية" value={stats.sickHeads} unit="حالة" color="red" />
        <StatItem label="حالات النفوق" value={stats.mortalityCount} unit="حالة" color="red" />
      </SectionCard>

      <SectionCard title="تقارير الأعلاف والمخزون">
        <StatItem label="إجمالي المخزون" value={Math.round(stats.totalStockKg)} unit="كجم" />
        <StatItem label="تكاليف الأعلاف" value={stats.feedCosts.toLocaleString()} unit={userCurrency} />
      </SectionCard>

      <SectionCard title="تقارير إنتاج الحليب">
        <StatItem label="الإنتاج اليومي" value={stats.dailyMilkTotal} unit="لتر" color="blue" />
        <StatItem label="الإنتاج الشهري المتوقع" value={(stats.dailyMilkTotal * 30).toFixed(0)} unit="لتر" />
      </SectionCard>

      <SectionCard title="تقارير الموارد البشرية">
        <StatItem label="إجمالي العمال" value={data.workers.length} unit="موظف" />
        <StatItem label="رواتب الفريق" value={stats.laborCosts.toLocaleString()} unit={userCurrency} />
      </SectionCard>

      <SectionCard title="التقارير المالية">
        <StatItem label="إجمالي المبيعات" value={stats.totalRevenue.toLocaleString()} unit={userCurrency} color="green" />
        <StatItem label="صافي الربح التقديري" value={(stats.totalRevenue - stats.feedCosts - stats.laborCosts).toLocaleString()} unit={userCurrency} />
      </SectionCard>

      {onBack && <FloatingBackButton onClick={onBack} />}
    </div>
  );
};

export default ReportsPage;
