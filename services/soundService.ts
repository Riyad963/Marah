
import { storageService } from './storageService.ts';

// The AI-Defined Policy Object (Rural & Battery Aware)
// Saved locally to be executed Offline
const SOUND_POLICY = {
  country: "user_selected",
  region: "rural",
  severityRules: {
    low: "soft",
    medium: "soft", 
    high: "loud",
    critical: "alarm"
  },
  antiSpamMinutes: 5, // Reduced for better testing
  nightMode: {
    start: "21:00",
    end: "06:00",
    allowCriticalOnly: true
  },
  autoAdjust: {
    batteryAware: true,
    networkAware: true,
    reduceSoundsOnLowBattery: true
  },
  default: "soft"
};

class SoundService {
  private audioContext: AudioContext | null = null;
  private lastPlayedMap: Record<string, number> = {}; // Tracks last play time for anti-spam

  private getContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private isSoundEnabled(): boolean {
    const settings = storageService.loadCached('marah_app_settings', { soundEffects: true });
    return settings.soundEffects;
  }

  /**
   * Smart Alert Player based on AI Policy
   * Improved to distinguish between notification types and alarms.
   */
  public playSmartAlert(severity: string, category: string, activePage: string) {
    if (!this.isSoundEnabled()) return;

    const now = Date.now();
    const policy = SOUND_POLICY;
    
    // 1. Check User Context (Silence if user is on the same screen, unless critical)
    const isSameContext = (category === 'GPS' && activePage === 'GPS') || 
                          (category === 'Health' && activePage === 'القطيع');
    
    if (isSameContext && severity !== 'critical' && severity !== 'high') {
        return; 
    }

    // 2. Check Night Mode
    const date = new Date();
    const currentMins = date.getHours() * 60 + date.getMinutes();
    const [sH, sM] = policy.nightMode.start.split(':').map(Number);
    const [eH, eM] = policy.nightMode.end.split(':').map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    let isNight = (startMins > endMins) 
        ? (currentMins >= startMins || currentMins < endMins)
        : (currentMins >= startMins && currentMins < endMins);
    
    if (isNight && severity !== 'critical') return;

    // 3. Anti-Spam
    const lastPlayed = this.lastPlayedMap[category] || 0;
    const minutesSinceLast = (now - lastPlayed) / 60000;
    if (minutesSinceLast < policy.antiSpamMinutes && severity !== 'critical') return;

    // 4. Execute Sound
    const soundType = (policy.severityRules as any)[severity] || policy.default;

    switch (soundType) {
        case 'soft':
            this.playSoftNotification();
            break;
        case 'loud':
            this.playLoudNotification();
            break;
        case 'alarm':
            this.playAlarm(); // Critical
            break;
    }

    this.lastPlayedMap[category] = now;
  }

  // --- Specialized Sound Generators ---

  /**
   * Soft Chime: For low priority info.
   * A clean, bright high-pitched ding.
   */
  private playSoftNotification() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    this.scheduleTone(now, 880, 'sine', 0.2, 0.1); 
    this.scheduleTone(now + 0.1, 1320, 'sine', 0.1, 0.05);
  }

  /**
   * Loud Notification: For high priority info (e.g., Sick Animal, Feed Empty).
   * A dual-tone professional chime.
   */
  private playLoudNotification() {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    
    // Major third chime
    this.scheduleTone(now, 523.25, 'triangle', 0.2, 0.15); // C5
    this.scheduleTone(now + 0.15, 659.25, 'triangle', 0.3, 0.15); // E5
  }

  /**
   * Emergency Alarm: For fence exit (Critical).
   * A high-intensity pulsing siren.
   */
  public playAlarm() {
    if (!this.isSoundEnabled()) return;
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    // Pulse 3 times for urgency
    for (let i = 0; i < 3; i++) {
        const now = ctx.currentTime + (i * 0.4);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }
  }

  private scheduleTone(time: number, freq: number, type: OscillatorType, duration: number, vol: number) {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + duration);
  }

  private playSound(freq: number, type: OscillatorType, duration: number, vol: number) {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume();
    this.scheduleTone(ctx.currentTime, freq, type, duration, vol);
  }

  public playClick() {
    this.playSound(900, 'sine', 0.08, 0.03);
  }

  public playSuccess() {
    if (!this.isSoundEnabled()) return;
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
        this.scheduleTone(now + (i * 0.06), freq, 'sine', 0.2, 0.08);
    });
  }

  public playError() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    this.scheduleTone(now, 220, 'sawtooth', 0.2, 0.1);
    this.scheduleTone(now + 0.1, 110, 'sawtooth', 0.2, 0.1);
  }
}

export const soundService = new SoundService();
