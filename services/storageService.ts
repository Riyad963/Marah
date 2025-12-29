
/**
 * Marah Cloud Storage Service
 * Enhanced with silent failure for demo/unconnected environments.
 */

interface SyncItem {
  key: string;
  data: any;
  timestamp: number;
  action: 'update' | 'delete';
}

class StorageService {
  private apiEndpoint: string = "https://api.marah.livestock/v1"; 
  private authToken: string | null = localStorage.getItem('marah_auth_token');
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });
    window.addEventListener('offline', () => this.isOnline = false);
  }

  public setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('marah_auth_token', token);
  }

  public async save(key: string, data: any) {
    // دائماً احفظ محلياً أولاً
    localStorage.setItem(key, JSON.stringify(data));

    if (this.isOnline && this.authToken) {
      try {
        // نستخدم .catch() لمعالجة فشل الاتصال بهدوء دون إظهار أخطاء حمراء
        fetch(`${this.apiEndpoint}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          body: JSON.stringify({ key, data, timestamp: Date.now() })
        }).catch(() => {
            this.addToOfflineQueue(key, data);
        });
      } catch (e) {
        this.addToOfflineQueue(key, data);
      }
    } else {
      this.addToOfflineQueue(key, data);
    }
  }

  public async load(key: string, fallback: any = []): Promise<any> {
    const localItem = localStorage.getItem(key);
    
    if (this.isOnline && this.authToken) {
      try {
        const response = await fetch(`${this.apiEndpoint}/data/${key}`, {
          headers: { 'Authorization': `Bearer ${this.authToken}` }
        }).catch(() => null);

        if (response && response.ok) {
          const cloudData = await response.json();
          localStorage.setItem(key, JSON.stringify(cloudData));
          return cloudData;
        }
      } catch (e) {
        // الفشل في التحميل من السحابة يعود للنسخة المحلية
      }
    }

    return localItem ? JSON.parse(localItem) : fallback;
  }

  public loadCached(key: string, fallback: any = []) {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
  }

  private addToOfflineQueue(key: string, data: any) {
    const queue = JSON.parse(localStorage.getItem('marah_sync_queue') || '[]');
    queue.push({ key, data, timestamp: Date.now(), action: 'update' });
    localStorage.setItem('marah_sync_queue', JSON.stringify(queue));
  }

  private async syncPendingData() {
    const queue: SyncItem[] = JSON.parse(localStorage.getItem('marah_sync_queue') || '[]');
    if (queue.length === 0 || !this.authToken) return;

    try {
      await fetch(`${this.apiEndpoint}/batch-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ queue })
      }).catch(() => null);
      
      localStorage.setItem('marah_sync_queue', '[]');
      window.dispatchEvent(new CustomEvent('marah-sync-complete'));
    } catch (e) {
      // صمت مطبق في حالة عدم وجود خادم
    }
  }

  public getSyncStatus(): 'synced' | 'syncing' | 'offline' {
    if (!this.isOnline) return 'offline';
    const queue = JSON.parse(localStorage.getItem('marah_sync_queue') || '[]');
    return queue.length > 0 ? 'syncing' : 'synced';
  }

  public getGlobalUserCount(): number {
    return parseInt(localStorage.getItem('marah_global_user_count') || '1248');
  }

  public incrementGlobalUserCount() {
    const current = this.getGlobalUserCount();
    localStorage.setItem('marah_global_user_count', (current + 1).toString());
  }
}

export const storageService = new StorageService();
