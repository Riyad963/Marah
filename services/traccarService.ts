
/**
 * Real Traccar Integration Service
 * Connects to live GPS devices via Traccar REST API
 */

export const traccarService = {
  baseUrl: "https://gps.marah.livestock/api", // Real Traccar Server
  auth: "Basic " + btoa("admin:password"), // Should be encrypted in production

  async getDevices(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/devices`, {
        headers: { 'Authorization': this.auth }
      });
      return await res.json();
    } catch (e) {
      console.error("Traccar: Failed to get devices", e);
      return [];
    }
  },

  async getLatestPositions(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/positions`, {
        headers: { 'Authorization': this.auth }
      });
      return await res.json();
    } catch (e) {
      console.error("Traccar: Failed to get positions", e);
      return [];
    }
  },

  async getHistory(deviceId: number, from: string, to: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({ deviceId: deviceId.toString(), from, to });
      const res = await fetch(`${this.baseUrl}/positions?${params}`, {
        headers: { 'Authorization': this.auth }
      });
      return await res.json();
    } catch (e) {
      return [];
    }
  },

  async getGeofences(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/geofences`, {
        headers: { 'Authorization': this.auth }
      });
      return await res.json();
    } catch (e) {
      return [];
    }
  }
};
