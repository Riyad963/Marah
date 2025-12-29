
import { LogEntry } from '../types.ts';

const LOG_KEY = 'anwaa_system_logs';
const MAX_LOGS = 100;

export const analyticsService = {
  /**
   * Logs an event to local storage
   */
  log: (type: LogEntry['type'], eventName: string, metadata?: any) => {
    try {
      const logs: LogEntry[] = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      
      const newEntry: LogEntry = {
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toISOString(),
        type,
        eventName,
        metadata
      };

      // Add to start and limit size
      const updatedLogs = [newEntry, ...logs].slice(0, MAX_LOGS);
      localStorage.setItem(LOG_KEY, JSON.stringify(updatedLogs));
      
      // Development console output
      if (type === 'error') {
        console.error(`[ANWAA ERROR] ${eventName}:`, metadata);
      } else {
        console.debug(`[ANWAA ${type.toUpperCase()}] ${eventName}`);
      }
    } catch (e) {
      console.error('Failed to save log', e);
    }
  },

  /**
   * Retrieves all logs
   */
  getLogs: (): LogEntry[] => {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  },

  /**
   * Clears all logs
   */
  clearLogs: () => {
    localStorage.removeItem(LOG_KEY);
  }
};
