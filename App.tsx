
import React, { useState, useEffect, useCallback } from 'react';
import { ActivePage, LivestockCategory } from './types.ts';
import { analyticsService } from './services/analyticsService.ts';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext.tsx';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

// Layout Components
import Header from './components/Header.tsx';
import Sidebar from './components/Sidebar.tsx';
import SplashScreen from './components/SplashScreen.tsx';
import AuthPage from './pages/AuthPage.tsx';
import InstallPrompt from './components/InstallPrompt.tsx'; 

// Pages
import HomePage from './pages/HomePage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import HerdPage from './pages/HerdPage.tsx';
import FeedPage from './pages/FeedPage.tsx';
import GPSPage from './pages/GPSPage.tsx';
import ReportsPage from './pages/ReportsPage.tsx';
import DevicesPage from './pages/DevicesPage.tsx';
import BreedsPage from './pages/BreedsPage.tsx';
import WorkersPage from './pages/WorkersPage.tsx';

function MainApp() {
  const { t, language } = useLanguage();
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>('الرئيسية');
  const [navigationHistory, setNavigationHistory] = useState<ActivePage[]>(['الرئيسية']);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userCountry, setUserCountry] = useState('السعودية');
  const [userCurrency, setUserCurrency] = useState('SAR'); 
  const [userRole, setUserRole] = useState<string>('مالك'); 
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<LivestockCategory>('أغنام');

  useEffect(() => {
    if (!showSplash && isAuthenticated) {
      analyticsService.log('view', `PAGE_VIEW: ${activePage}`);
    }
  }, [activePage, showSplash, isAuthenticated]);

  const navigateTo = useCallback((page: ActivePage) => {
    if (page === activePage) return;
    setNavigationHistory(prev => [...prev, page]);
    setActivePage(page);
  }, [activePage]);

  const goBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current
      const prevPage = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setActivePage(prevPage);
    } else {
      setActivePage('الرئيسية');
    }
  }, [navigationHistory]);

  // --- Capacitor Native Integration ---
  useEffect(() => {
    // 1. Handle Status Bar
    const configStatusBar = async () => {
      try {
        if (activePage === 'GPS') {
           await StatusBar.setOverlaysWebView({ overlay: true });
        } else {
           await StatusBar.setOverlaysWebView({ overlay: false });
           await StatusBar.setStyle({ style: isDarkMode ? Style.Dark : Style.Light });
           await StatusBar.setBackgroundColor({ color: isDarkMode ? '#1D3C2B' : '#EBF2E5' });
        }
      } catch (e) {
        // Fallback for web
        console.debug('StatusBar not available');
      }
    };
    configStatusBar();

    // 2. Handle Android Hardware Back Button
    const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (sidebarOpen) {
        setSidebarOpen(false);
      } else if (activePage === 'الرئيسية') {
        CapacitorApp.exitApp();
      } else {
        goBack();
      }
    });

    return () => {
      backButtonListener.then(handler => handler.remove());
    };
  }, [activePage, isDarkMode, sidebarOpen, goBack]);
  // ------------------------------------

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return (
      <AuthPage 
        onLogin={(countryName, role, currency) => {
          setUserCountry(countryName);
          setUserRole(role);
          setUserCurrency(currency);
          setIsAuthenticated(true);
        }} 
      />
    );
  }

  const renderPage = () => {
    const commonProps = { isDarkMode, userRole, userCurrency, onBack: goBack };
    switch (activePage) {
      case 'الرئيسية': return <HomePage {...commonProps} selectedCategory={selectedCategory} />;
      case 'القطيع': return <HerdPage {...commonProps} selectedCategory={selectedCategory} />;
      case 'أعلاف': return <FeedPage {...commonProps} selectedCategory={selectedCategory} />;
      case 'GPS': return <GPSPage {...commonProps} selectedCategory={selectedCategory} />;
      case 'اجهزة': return <DevicesPage {...commonProps} />;
      case 'السلالة': return <BreedsPage {...commonProps} selectedCategory={selectedCategory} />;
      case 'تقارير': return <ReportsPage {...commonProps} />;
      case 'العمال': return <WorkersPage {...commonProps} />;
      case 'إعدادات': return <SettingsPage {...commonProps} toggleTheme={() => setIsDarkMode(!isDarkMode)} selectedCategory={selectedCategory} setCategory={setSelectedCategory} onNavigate={navigateTo} />;
      default: return <HomePage {...commonProps} selectedCategory={selectedCategory} />;
    }
  };

  const isGPS = activePage === 'GPS';

  return (
    <div className={`min-h-screen font-['Cairo'] flex flex-col relative overflow-hidden transition-colors duration-700 ${isDarkMode ? 'bg-[#051810] text-gray-100' : 'bg-[#EBF2E5] text-white'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {!isGPS && (
        <div className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-20' : 'opacity-100'}`}>
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(29,60,43,0.05)_0%,transparent_100%)]"></div>
        </div>
      )}
      <div className={`transition-transform duration-700 ease-in-out z-[60] fixed top-0 left-0 right-0 ${isGPS ? '-translate-y-full' : 'translate-y-0'}`}>
        <Header activePage={activePage} countryName={userCountry} />
      </div>
      <div className={`flex flex-1 ${!isGPS ? 'pt-20' : 'pt-0'} relative transition-all duration-700`}>
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          activePage={activePage} 
          setActivePage={navigateTo}
          userRole={userRole}
        />
        <main className={`flex-1 relative z-10 transition-all duration-700 cubic-bezier(0.19, 1, 0.22, 1) ${!isGPS ? 'p-4 md:p-8' : ''}`}>
          <div className={`h-full flex flex-col items-center ${!isGPS ? '' : 'w-full h-screen'}`}>
            {renderPage()}
          </div>
        </main>
      </div>
      <InstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
