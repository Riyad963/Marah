
import React, { useState } from 'react';
import { aiService } from '../services/aiService.ts';
import { soundService } from '../services/soundService.ts';

export default function SmartAdvisor() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setIsOpen(true);
    soundService.playClick();
    
    const result = await aiService.analyzeFarmStatus();
    setAnalysis(result);
    setLoading(false);
    
    if (result?.status === 'critical') soundService.playAlarm();
    else soundService.playSuccess();
  };

  const close = () => {
      setIsOpen(false);
      setAnalysis(null);
  };

  if (!isOpen && !loading) {
      return (
        <button 
            onClick={runAnalysis}
            className="w-full bg-gradient-to-r from-indigo-900 to-[#1D3C2B] p-1 rounded-2xl shadow-lg group active:scale-95 transition-all mb-6"
        >
            <div className="bg-[#051810]/80 backdrop-blur-sm rounded-xl py-3 px-4 flex items-center justify-between border border-white/10 group-hover:bg-[#051810]/60 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 relative">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping"></div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-black text-white block">المستشار الذكي</span>
                        <span className="text-[9px] font-bold text-indigo-300 block">اضغط لتحليل حالة القطيع</span>
                    </div>
                </div>
                <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
        </button>
      );
  }

  return (
    <div className="w-full mb-6 animate-fade-in relative z-20">
        <div className={`rounded-[2rem] p-6 border ${analysis?.status === 'critical' ? 'bg-red-900/20 border-red-500/50' : analysis?.status === 'warning' ? 'bg-amber-900/20 border-amber-500/50' : 'bg-[#1D3C2B]/90 border-indigo-500/30'} backdrop-blur-xl shadow-2xl`}>
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-xs font-black text-white animate-pulse">جاري تحليل البيانات...</p>
                </div>
            ) : analysis ? (
                <>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                {analysis.status === 'critical' && <span className="text-red-500">⚠️</span>}
                                تقرير الحالة
                            </h3>
                            <p className="text-[10px] text-white/70 font-bold mt-1 leading-relaxed max-w-[90%]">
                                {analysis.summary}
                            </p>
                        </div>
                        <button onClick={close} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Alerts */}
                        {analysis.alerts && analysis.alerts.length > 0 && (
                            <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                                <h4 className="text-[9px] font-black text-red-400 uppercase tracking-wider mb-2">تنبيهات عاجلة</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {analysis.alerts.map((alert: string, i: number) => (
                                        <li key={i} className="text-[10px] font-bold text-white/90">{alert}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Predictions & Recommendations Grid */}
                        <div className="grid grid-cols-1 gap-3">
                            {analysis.predictions && analysis.predictions.length > 0 && (
                                <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                                    <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-wider mb-2">توقعات (7 أيام)</h4>
                                    <ul className="space-y-1">
                                        {analysis.predictions.map((pred: string, i: number) => (
                                            <li key={i} className="text-[10px] font-bold text-white/80 flex items-center gap-2">
                                                <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                                {pred}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {analysis.recommendations && analysis.recommendations.length > 0 && (
                                <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
                                    <h4 className="text-[9px] font-black text-green-400 uppercase tracking-wider mb-2">توصيات عملية</h4>
                                    <ul className="space-y-2">
                                        {analysis.recommendations.map((rec: string, i: number) => (
                                            <li key={i} className="text-[10px] font-bold text-white flex gap-2">
                                                <span className="text-green-400">✓</span>
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    </div>
  );
}
