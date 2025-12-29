
import { storageService } from './storageService.ts';

// The AI-Defined Policy Object (Rural & Battery Aware)
// Saved locally to be executed Offline
const SOUND_POLICY = {
  country: "user_selected",
  region: "rural",
  severityRules: {
    low: "silent",
    medium: "silent", // Default silent for medium as per policy
    high: "loud",
    critical: "alarm"
  },
  antiSpamMinutes: 20,
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
  default: "silent"
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

  // FIX: Use loadCached instead of load for synchronous settings access
  private isSoundEnabled(): boolean {
    const settings = storageService.loadCached('marah_app_settings', { soundEffects: true });
    return settings.soundEffects;
  }

  /**
   * Smart Alert Player based on AI Policy
   * @param severity 'low' | 'medium' | 'high' | 'critical'
   * @param category The source of alert (e.g., 'GPS', 'Health')
   * @param activePage The page user is currently viewing
   */
  public playSmartAlert(severity: string, category: string, activePage: string) {
    if (!this.isSoundEnabled()) return;

    const now = Date.now();
    const policy = SOUND_POLICY;
    
    // 1. Check User Context (Rule: Silence if user is on the same screen)
    // Critical alerts bypass this check to ensure safety
    const isSameContext = (category === 'GPS' && activePage === 'GPS') || 
                          (category === 'Health' && activePage === 'القطيع');
    
    if (isSameContext && severity !== 'critical') {
        console.debug('[SoundPolicy] Silenced: User is on same screen.');
        return; 
    }

    // 2. Check Night Mode (Time String Parsing HH:MM)
    const date = new Date();
    const currentMins = date.getHours() * 60 + date.getMinutes();
    
    const [sH, sM] = policy.nightMode.start.split(':').map(Number);
    const [eH, eM] = policy.nightMode.end.split(':').map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    let isNight = false;
    if (startMins > endMins) {
        // Spans midnight (e.g. 21:00 to 06:00)
        isNight = currentMins >= startMins || currentMins < endMins;
    } else {
        isNight = currentMins >= startMins && currentMins < endMins;
    }
    
    if (isNight) {
        if (severity !== 'critical' || !policy.nightMode.allowCriticalOnly) {
            console.debug('[SoundPolicy] Silenced: Night Mode Active.');
            return;
        }
    }

    // 3. Anti-Spam (Rule: No sound if repeated within defined minutes)
    const lastPlayed = this.lastPlayedMap[category] || 0;
    const minutesSinceLast = (now - lastPlayed) / 60000;
    
    if (minutesSinceLast < policy.antiSpamMinutes && severity !== 'critical') {
        console.debug('[SoundPolicy] Silenced: Anti-Spam cooldown.');
        return;
    }

    // 4. Execute Sound based on Severity
    const soundType = (policy.severityRules as any)[severity] || policy.default;

    switch (soundType) {
        case 'silent':
            return;
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

    // Update Last Played
    this.lastPlayedMap[category] = now;
  }

  // --- Sound Generators ---

  private playSoftNotification() {
    this.playSound(440, 'sine', 0.1, 0.15); // A4, soft, short
  }

  private playLoudNotification() {
    // Two beeps
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    
    this.scheduleTone(now, 600, 'square', 0.1, 0.1);
    this.scheduleTone(now + 0.15, 600, 'square', 0.1, 0.1);
  }

  private scheduleTone(time: number, freq: number, type: OscillatorType, duration: number, vol: number) {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
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

  // --- Existing Methods (Kept for compatibility) ---

  public playClick() {
    this.playSound(800, 'sine', 0.1, 0.05);
  }

  public playSuccess() {
    if (!this.isSoundEnabled()) return;
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    // Arpeggio
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        this.scheduleTone(now + (i * 0.08), freq, 'triangle', 0.3, 0.1);
    });
  }

  public playError() {
    this.playSound(150, 'sawtooth', 0.3, 0.1);
  }

  public playAlarm() {
    if (!this.isSoundEnabled()) return;
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    
    // Siren effect
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(1760, now + 0.5);
    osc.frequency.linearRampToValueAtTime(880, now + 1.0);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 1.0);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.0);
  }
}

export const soundService = new SoundService();
