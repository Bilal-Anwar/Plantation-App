import type { Worker, Pineapple, Nourishment, Payment, AppSettings, AdminUser, AdminAuditLog } from '../types';
import { getFarmData, getCloudUser, updateFarm } from './cloudStore';
export const DEFAULT_SETTINGS: AppSettings = {
  plantCost: 50000, nourishCost: 14000, totalNourishments: 7, intervalHours: 1,
  currency: '$', businessName: 'Plantation Tracker', timezone: 'Asia/Karachi',
  dueAlertMinutes: 10, soundAlerts: true, theme: 'light',
};
export const StorageService = {
  getSettings: (): AppSettings => ({ ...DEFAULT_SETTINGS, ...getFarmData().settings }),
  saveSettings: (v: AppSettings) => updateFarm('settings',v),
  getWorkers: (): Worker[] => getFarmData().workers,
  saveWorkers: (v: Worker[]) => updateFarm('workers',v),
  getPineapples: (): Pineapple[] => getFarmData().pineapples,
  savePineapples: (v: Pineapple[]) => updateFarm('pineapples',v),
  getNourishments: (): Nourishment[] => getFarmData().nourishments,
  saveNourishments: (v: Nourishment[]) => updateFarm('nourishments',v),
  getPayments: (): Payment[] => getFarmData().payments,
  savePayments: (v: Payment[]) => updateFarm('payments',v),
  getAdmins: (): AdminUser[] => getCloudUser() ? [getCloudUser()!] : [],
  getCurrentUser: () => getCloudUser(),
  getAuditLogs: (): AdminAuditLog[] => [],
  exportFullBackup: () => JSON.stringify({ version: '2.0', exportedAt: new Date().toISOString(), ...getFarmData() },null,2),
  restoreBackup(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      for (const key of ['workers','pineapples','nourishments','payments']) {
        if (!Array.isArray(parsed[key])) return false;
      }
      if (!parsed.settings || typeof parsed.settings !== 'object' || Array.isArray(parsed.settings)) return false;
      // Server-side typed tables, foreign keys and constraints validate the transaction before commit.
      updateFarm('workers', parsed.workers); updateFarm('pineapples', parsed.pineapples);
      updateFarm('nourishments', parsed.nourishments); updateFarm('payments', parsed.payments);
      updateFarm('settings', parsed.settings);
      return true;
    } catch { return false; }
  },
};
export function removeLegacySamples(): void {
  // Remove legacy sample identities. Legacy real data is never uploaded automatically.
  for (const key of ['pineapple_admins_v1','pineapple_current_user_v1']) localStorage.removeItem(key);
}
