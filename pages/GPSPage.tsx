
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { LivestockCategory } from '../types.ts';
import { storageService } from '../services/storageService.ts';
import { soundService } from '../services/soundService.ts';

interface Fence {
  id: string;
  center: [number, number];
  radius: number; 
  type: 'circle' | 'square';
  width: number;
  height: number;
  rotation: number;
}

interface AlarmSchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface ShepherdInfo {
  name: string;
  status: 'online' | 'weak' | 'offline';
  battery: number;
  lastUpdate: string;
}

const INITIAL_CENTER: [number, number] = [34.759297, 3.588139]; 
const APP_LOGO_URL = "https://i.ibb.co/Tx36fB5C/20251228-105841.png";

const GPSPage: React.FC<{ isDarkMode?: boolean; selectedCategory: LivestockCategory }> = ({ isDarkMode, selectedCategory }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const livestockMarkerRef = useRef<L.Marker | null>(null);
  const fenceLayersRef = useRef<Record<string, L.Layer>>({});

  const [activeLayer, setActiveLayer] = useState<'street' | 'satellite'>('satellite');
  const [livestockPos, setLivestockPos] = useState({ lat: INITIAL_CENTER[0], lng: INITIAL_CENTER[1], speed: 0 });
  const [systemMode, setSystemMode] = useState<'IDLE' | 'FOLLOW' | 'ALERT'>('FOLLOW');
  const [fences, setFences] = useState<Fence[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false); 
  const [isLeftNavOpen, setIsLeftNavOpen] = useState(false);
  
  // حالات إدارة السياج المحدد
  const [selectedFenceId, setSelectedFenceId] = useState<string | null>(null);
  const [alarmSchedule, setAlarmSchedule] = useState<AlarmSchedule>({ enabled: false, start: '20:00', end: '06:00' });

  useEffect(() => {
    const fetchFences = async () => {
      const savedFences = await storageService.load('marah_fences', []);
      setFences(savedFences);
    };
    fetchFences();
  }, []);

  useEffect(() => { storageService.save('marah_fences', fences); }, [fences]);

  // دالة لحساب إحداثيات المستطيل المدوّر
  const getRotatedRectCoordinates = (center: [number, number], width: number, height: number, angleDeg: number) => {
    const lat = center[0];
    const lng = center[1];
    const angleRad = (angleDeg * Math.PI) / 180;
    const latOffset = height / 2 / 111320; 
    const lngOffset = width / 2 / (40075000 * Math.cos((lat * Math.PI) / 180) / 360);
    const corners = [
      { x: -lngOffset, y: latOffset }, 
      { x: lngOffset, y: latOffset }, 
      { x: lngOffset, y: -latOffset }, 
      { x: -lngOffset, y: -latOffset }
    ];
    return corners.map(p => {
      const rotatedX = p.x * Math.cos(angleRad) - p.y * Math.sin(angleRad);
      const rotatedY = p.x * Math.sin(angleRad) + p.y * Math.cos(angleRad);
      return [lat + rotatedY, lng + rotatedX] as [number, number];
    });
  };

  // رسم الأسيجة على الخريطة
  useEffect(() => {
    if (!mapRef.current) return;

    (Object.values(fenceLayersRef.current) as L.Layer[]).forEach(layer => layer.remove());
    fenceLayersRef.current = {};

    fences.forEach(f => {
      let layer: L.Layer;
      const isSelected = f.id === selectedFenceId;

      if (f.type === 'circle') {
        layer = L.circle(f.center, {
          radius: f.radius,
          color: isSelected ? '#f97316' : '#1D3C2B',
          fillColor: '#1D3C2B',
          fillOpacity: 0.2,
          weight: isSelected ? 4 : 2,
        }).addTo(mapRef.current!);
      } else {
        const coords = getRotatedRectCoordinates(f.center, f.width, f.height, f.rotation);
        layer = L.polygon(coords, {
          color: isSelected ? '#f97316' : '#1D3C2B',
          fillColor: '#1D3C2B',
          fillOpacity: 0.2,
          weight: isSelected ? 4 : 2,
        }).addTo(mapRef.current!);
      }

      layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (isEditMode) {
          setSelectedFenceId(f.id);
          soundService.playClick();
        }
      });

      fenceLayersRef.current[f.id] = layer;
    });
  }, [fences, isEditMode, selectedFenceId]);

  // إضافة سياج جديد
  const addNewFence = (type: 'circle' | 'square') => {
    const center = mapRef.current ? (mapRef.current.getCenter().lat ? [mapRef.current.getCenter().lat, mapRef.current.getCenter().lng] : INITIAL_CENTER) : INITIAL_CENTER;
    const newFence: Fence = {
      id: Date.now().toString(),
      center: center as [number, number],
      type,
      radius: type === 'circle' ? 100 : 0,
      width: type === 'square' ? 150 : 0,
      height: type === 'square' ? 150 : 0,
      rotation: 0
    };
    setFences([...fences, newFence]);
    setSelectedFenceId(newFence.id);
    soundService.playSuccess();
  };

  const updateSelectedFence = (changes: Partial<Fence>) => {
    if (!selectedFenceId) return;
    setFences(fences.map(f => f.id === selectedFenceId ? { ...f, ...changes } : f));
  };

  const deleteSelectedFence = () => {
    if (!selectedFenceId) return;
    setFences(fences.filter(f => f.id !== selectedFenceId));
    setSelectedFenceId(null);
    soundService.playError();
  };

  const triggerAlarm = useCallback(() => { soundService.playAlarm(); }, []);

  const checkGeofence = useCallback((lat: number, lng: number) => {
    if (fences.length === 0) return true;
    let isInsideAny = false;
    fences.forEach(f => {
      if (f.type === 'circle') {
        if (L.latLng(f.center).distanceTo(L.latLng(lat, lng)) <= f.radius) isInsideAny = true;
      } else {
        // التحقق من وجود النقطة داخل المضلع (المربع المدوّر)
        const coords = getRotatedRectCoordinates(f.center, f.width, f.height, f.rotation);
        const polygon = L.polygon(coords);
        if (polygon.getBounds().contains(L.latLng(lat, lng))) isInsideAny = true;
      }
    });
    return isInsideAny;
  }, [fences]);

  useEffect(() => {
    if (!isSimulation) return;
    const interval = setInterval(() => {
      setLivestockPos(prev => {
        const next = { ...prev, lat: prev.lat + (Math.random() - 0.5) * 0.0001, lng: prev.lng + (Math.random() - 0.5) * 0.0001 };
        const isSafe = checkGeofence(next.lat, next.lng);
        if (!isSafe) { triggerAlarm(); setSystemMode('ALERT'); } else { setSystemMode('FOLLOW'); }
        if (mapRef.current) {
          if (!livestockMarkerRef.current) {
            livestockMarkerRef.current = L.marker([next.lat, next.lng], {
              icon: L.divIcon({ className: 'custom-icon', html: `<div style="background:${!isSafe?'#ef4444':'#10b981'};width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>`, iconSize:[12,12]})
            }).addTo(mapRef.current);
          } else { livestockMarkerRef.current.setLatLng([next.lat, next.lng]); }
        }
        return next;
      });
    }, 2000); 
    return () => clearInterval(interval);
  }, [isSimulation, checkGeofence, triggerAlarm]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current, { center: INITIAL_CENTER, zoom: 15, zoomControl: false, attributionControl: false });
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(mapRef.current);
  }, []);

  const navTools = [
    { id: 'recenter', icon: <path d="M12 8v4m0 0v4m0-4h4m-4 0H8" strokeWidth="2" strokeLinecap="round" />, action: () => mapRef.current?.flyTo([livestockPos.lat, livestockPos.lng], 16), label: 'تمركز' },
    { id: 'layer', icon: <path d="M9 20l-5.447-2.724A2 2 0 013 15.483V8.517a2 2 0 011.553-1.943L9 5m6 15l5.447-2.724A2 2 0 0121 15.483V8.517a2 2 0 01-1.553-1.943L15 5" strokeWidth="2" strokeLinecap="round" />, action: () => setActiveLayer(l => l === 'satellite' ? 'street' : 'satellite'), label: 'خريطة', active: activeLayer === 'street' },
    { id: 'fence', icon: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth="2" strokeLinecap="round" />, action: () => { soundService.playClick(); setIsEditMode(!isEditMode); setSelectedFenceId(null); }, label: 'سياج', active: isEditMode },
    { id: 'simulation', icon: <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" strokeWidth="2" />, action: () => setIsSimulation(!isSimulation), label: 'محاكاة', active: isSimulation },
  ];

  const selectedFence = fences.find(f => f.id === selectedFenceId);

  return (
    <div className={`fixed inset-0 z-0 ${isDarkMode ? 'bg-[#051810]' : 'bg-[#EBF2E5]'}`}>
      <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />
      
      {/* شريط معلومات علوي */}
      <div className="absolute top-6 inset-x-0 flex justify-center z-10 px-8 pointer-events-none">
        <div className={`backdrop-blur-xl rounded-[2rem] px-8 py-3 flex items-center gap-8 shadow-2xl pointer-events-auto border border-white/10 ${systemMode === 'ALERT' ? 'bg-red-600' : 'bg-[#1D3C2B]/90'}`}>
          <div className="text-center min-w-[80px]">
            <p className="text-[7px] text-white/40 font-black uppercase tracking-widest">النظام الذكي</p>
            <p className="text-[11px] font-black text-white">{systemMode}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] text-white/40 font-black uppercase tracking-widest">السرعة</p>
            <p className="text-[11px] font-black text-white">{livestockPos.speed.toFixed(1)} ك/س</p>
          </div>
        </div>
      </div>

      {/* شريط الأدوات الأيسر */}
      <div className="fixed left-4 lg:left-8 bottom-6 z-50 flex flex-col items-center gap-4 pointer-events-none">
        <aside className="flex flex-col items-center gap-3 transition-all duration-700">
           {navTools.map((tool, index) => (
             <button key={tool.id} onClick={tool.action} style={{ transitionDelay: isLeftNavOpen ? `${(navTools.length-1-index)*50}ms` : '0ms', transform: isLeftNavOpen ? 'translateY(0)' : `translateY(${(navTools.length-index)*40}px)`, opacity: isLeftNavOpen ? 1 : 0, pointerEvents: isLeftNavOpen ? 'auto' : 'none' }} className={`w-14 h-14 lg:w-16 lg:h-16 flex flex-col items-center justify-center rounded-full transition-all duration-500 border shadow-lg bg-[#1D3C2B] ${tool.active ? 'border-orange-500 border-2 scale-110 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'border-white/20'}`}>
                <div className="flex flex-col items-center"><svg className={`w-5 h-5 ${tool.active ? 'text-orange-500' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{tool.icon}</svg><span className={`text-[8px] font-bold mt-0.5 ${tool.active ? 'text-orange-500' : 'text-white'}`}>{tool.label}</span></div>
             </button>
           ))}
        </aside>
        <button onClick={() => setIsLeftNavOpen(!isLeftNavOpen)} className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-[#1D3C2B] flex items-center justify-center shadow-2xl z-50 pointer-events-auto border-2 border-white/20 active:scale-90 transition-transform"><img src={APP_LOGO_URL} className="w-10 h-10 lg:w-14 lg:h-14 object-contain" /></button>
      </div>

      {/* شريط التحكم في السياج السفلي */}
      {isEditMode && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-xl border-t border-white/20 p-4 animate-fade-in flex flex-col gap-4">
          <div className="flex items-center overflow-x-auto no-scrollbar gap-4 pb-2">
            
            {/* إضافة سياج */}
            <div className="flex gap-2 shrink-0 border-l border-white/10 pl-4">
              <button onClick={() => addNewFence('circle')} className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black text-white hover:bg-white/20 flex flex-col items-center gap-1 border border-white/10">
                <div className="w-4 h-4 rounded-full border-2 border-white"></div>
                إضافة دائري
              </button>
              <button onClick={() => addNewFence('square')} className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black text-white hover:bg-white/20 flex flex-col items-center gap-1 border border-white/10">
                <div className="w-4 h-4 border-2 border-white"></div>
                إضافة مربع
              </button>
            </div>

            {/* أدوات التحكم في السياج المحدد */}
            {selectedFence && (
              <div className="flex items-center gap-6 shrink-0 border-l border-white/10 pl-4">
                {selectedFence.type === 'circle' ? (
                  <div className="flex flex-col gap-1 w-32">
                    <label className="text-[8px] text-white/50 font-bold">القطر: {selectedFence.radius}م</label>
                    <input type="range" min="50" max="1000" step="10" value={selectedFence.radius} onChange={(e) => updateSelectedFence({ radius: parseInt(e.target.value) })} className="w-full accent-orange-500" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1 w-24">
                      <label className="text-[8px] text-white/50 font-bold">العرض: {selectedFence.width}م</label>
                      <input type="range" min="50" max="1000" step="10" value={selectedFence.width} onChange={(e) => updateSelectedFence({ width: parseInt(e.target.value) })} className="w-full accent-orange-500" />
                    </div>
                    <div className="flex flex-col gap-1 w-24">
                      <label className="text-[8px] text-white/50 font-bold">الطول: {selectedFence.height}م</label>
                      <input type="range" min="50" max="1000" step="10" value={selectedFence.height} onChange={(e) => updateSelectedFence({ height: parseInt(e.target.value) })} className="w-full accent-orange-500" />
                    </div>
                    <div className="flex flex-col gap-1 w-24">
                      <label className="text-[8px] text-white/50 font-bold">التدوير: {selectedFence.rotation}°</label>
                      <input type="range" min="0" max="360" step="1" value={selectedFence.rotation} onChange={(e) => updateSelectedFence({ rotation: parseInt(e.target.value) })} className="w-full accent-orange-500" />
                    </div>
                  </>
                )}
                <button onClick={deleteSelectedFence} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-[10px] font-black border border-red-500/20">حذف</button>
              </div>
            )}

            {/* توقيت الإنذار */}
            <div className="flex items-center gap-3 shrink-0">
               <div className="flex flex-col gap-1">
                  <label className="text-[8px] text-white/50 font-bold">توقيت الإنذار (من-إلى)</label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={alarmSchedule.start} onChange={(e) => setAlarmSchedule({...alarmSchedule, start: e.target.value})} className="bg-white/10 text-white text-[10px] p-1 rounded border border-white/20" />
                    <input type="time" value={alarmSchedule.end} onChange={(e) => setAlarmSchedule({...alarmSchedule, end: e.target.value})} className="bg-white/10 text-white text-[10px] p-1 rounded border border-white/20" />
                  </div>
               </div>
               <button onClick={() => { soundService.playSuccess(); setIsEditMode(false); }} className="px-8 py-3 bg-[#1D3C2B] text-white rounded-2xl text-xs font-black shadow-xl border border-white/20">حفظ السياج</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default GPSPage;
