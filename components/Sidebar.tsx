
import React from 'react';
import { ActivePage } from '../types.ts';
import NavIcon from './NavIcon.tsx';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  userRole: string;
}

export default function Sidebar({ isOpen, setIsOpen, activePage, setActivePage, userRole }: SidebarProps) {
  
  // Define available menus based on role
  const getNavItems = (role: string): ActivePage[] => {
    switch(role) {
      case 'عامل':
        // Worker: Home, Herd (View), Feed (Input)
        return ['الرئيسية', 'القطيع', 'أعلاف'];
      
      case 'بيطري':
        // Vet: Home, Herd (Health), Reports (Health), Breeds (Traceability)
        return ['الرئيسية', 'القطيع', 'السلالة', 'تقارير'];
      
      case 'مشرف':
        // Supervisor: Management + Lineage
        return ['الرئيسية', 'القطيع', 'أعلاف', 'GPS', 'اجهزة', 'السلالة', 'تقارير'];
      
      case 'مالك':
      default:
        // Owner: Full Access
        return ['الرئيسية', 'القطيع', 'أعلاف', 'GPS', 'اجهزة', 'السلالة', 'تقارير', 'إعدادات'];
    }
  };

  const navItems = getNavItems(userRole);

  const handleItemClick = (id: ActivePage) => {
    setActivePage(id);
    setIsOpen(false); // Auto-close menu after selection
  };

  return (
    <div className="fixed right-4 lg:right-8 bottom-6 z-50 flex flex-col items-center gap-4 pointer-events-none">
      {/* حاوية الأزرار - تنسيق المسبحة */}
      <aside 
        className={`flex flex-col items-center gap-3 transition-all duration-700 cubic-bezier(0.19, 1, 0.22, 1)`}
      >
        <nav className="flex flex-col items-center gap-3">
          {navItems.map((id, index) => (
            <button 
              key={id} 
              style={{ 
                transitionDelay: isOpen ? `${(navItems.length - 1 - index) * 50}ms` : '0ms',
                transform: isOpen ? 'translateY(0)' : `translateY(${(navItems.length - index) * 40}px)`,
                opacity: isOpen ? 1 : 0,
                pointerEvents: isOpen ? 'auto' : 'none'
              }}
              className={`w-14 h-14 lg:w-16 lg:h-16 flex flex-col items-center justify-center rounded-full transition-all duration-500 group relative border-2 shadow-lg overflow-hidden pointer-events-auto ${
                activePage === id 
                  ? 'bg-[#1D3C2B] border-orange-500 scale-110 shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
                  : 'bg-[#1D3C2B] border-white hover:bg-[#1D3C2B]/90 hover:border-white/80'
              }`} 
              onClick={() => handleItemClick(id)}
            >
              <div className={`transition-all duration-300 flex flex-col items-center ${activePage === id ? 'translate-y-[-2px]' : 'group-hover:translate-y-[-2px]'}`}>
                {/* الأيقونة - لونها يتغير داخل مكون NavIcon بناءً على الحالة */}
                <NavIcon name={id} active={activePage === id} />
                
                {/* العنوان */}
                <span className={`text-[8px] lg:text-[9px] font-bold text-center mt-0.5 transition-all duration-300 ${activePage === id ? 'text-orange-500 opacity-100' : 'text-white opacity-70'}`}>
                  {id}
                </span>
              </div>

              {/* تأثير توهج داخلي خفيف برتقالي عند الاختيار */}
              {activePage === id && (
                <div className="absolute inset-0 rounded-full bg-orange-500/10 pointer-events-none"></div>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* الزر الأساسي (خيط المسبحة) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-[#1D3C2B] border-2 border-white flex items-center justify-center shadow-2xl transition-all duration-500 group active:scale-90 relative overflow-hidden pointer-events-auto ${
          isOpen ? 'brightness-110' : 'hover:brightness-105'
        }`}
      >
        <div className={`transition-all duration-500 ${isOpen ? 'rotate-[360deg] scale-90' : 'rotate-0 scale-100'}`}>
           <img 
              src="https://i.ibb.co/Tx36fB5C/20251228-105841.png" 
              alt="Toggle Menu" 
              className={`w-10 h-10 lg:w-14 lg:h-14 object-contain transition-all duration-700 ${isOpen ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]' : 'opacity-80'}`}
           />
        </div>
        
        {/* سهم صغير للإشارة للحالة */}
        <div className={`absolute bottom-2 transition-all duration-500 ${isOpen ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
            <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
            </svg>
        </div>

        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-white/5 animate-ping opacity-20 pointer-events-none"></span>
        )}
      </button>
    </div>
  );
}
