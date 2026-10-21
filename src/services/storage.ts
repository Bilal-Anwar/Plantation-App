import { Worker, Pineapple, Nourishment, Payment, AppSettings, AdminUser, AdminAuditLog } from '../types';

const STORAGE_KEYS = {
  WORKERS: 'pineapple_workers_v1',
  PINEAPPLES: 'pineapple_batches_v1',
  NOURISHMENTS: 'pineapple_nourishments_v1',
  PAYMENTS: 'pineapple_payments_v1',
  SETTINGS: 'pineapple_settings_v1',
  ADMINS: 'pineapple_admins_v1',
  CURRENT_USER: 'pineapple_current_user_v1',
  AUDIT_LOGS: 'pineapple_audit_logs_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  plantCost: 50000,
  nourishCost: 14000,
  totalNourishments: 7,
  intervalHours: 1.0,
  currency: '$',
  businessName: 'Golden Crown Pineapple Plantation',
  timezone: 'Asia/Karachi',
  dueAlertMinutes: 10,
  soundAlerts: true,
  theme: 'light',
};

/**
 * Storage API - LocalStorage repository
 */
export const StorageService = {
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Error loading settings', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getWorkers(): Worker[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading workers', e);
    }
    return [];
  },

  saveWorkers(workers: Worker[]): void {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
  },

  getPineapples(): Pineapple[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PINEAPPLES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading pineapples', e);
    }
    return [];
  },

  savePineapples(pineapples: Pineapple[]): void {
    localStorage.setItem(STORAGE_KEYS.PINEAPPLES, JSON.stringify(pineapples));
  },

  getNourishments(): Nourishment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOURISHMENTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading nourishments', e);
    }
    return [];
  },

  saveNourishments(nourishments: Nourishment[]): void {
    localStorage.setItem(STORAGE_KEYS.NOURISHMENTS, JSON.stringify(nourishments));
  },

  getPayments(): Payment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Remove legacy fake $100,000 demo payments
          const cleaned = parsed.filter(p => p && p.id !== 'pay-1' && p.id !== 'pay-2');
          if (cleaned.length !== parsed.length) {
            this.savePayments(cleaned);
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.error('Error loading payments', e);
    }
    return [];
  },

  savePayments(payments: Payment[]): void {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  },

  getAdmins(): AdminUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMINS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading admins', e);
    }
    return [];
  },

  saveAdmins(admins: AdminUser[]): void {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
  },

  getCurrentUser(): AdminUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error loading current user', e);
    }
    return null;
  },

  saveCurrentUser(user: AdminUser | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  },

  getAuditLogs(): AdminAuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading audit logs', e);
    }
    return [];
  },

  saveAuditLogs(logs: AdminAuditLog[]): void {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
  },

  addAuditLog(actorUsername: string, action: AdminAuditLog['action'], details: string): void {
    const logs = this.getAuditLogs();
    const newLog: AdminAuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      actorUsername,
      action,
      details,
    };
    this.saveAuditLogs([newLog, ...logs]);
  },

  exportFullBackup(): string {
    const backup = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      workers: this.getWorkers(),
      pineapples: this.getPineapples(),
      nourishments: this.getNourishments(),
      payments: this.getPayments(),
      admins: this.getAdmins(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(backup, null, 2);
  },

  restoreBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.workers && Array.isArray(parsed.workers)) {
        this.saveWorkers(parsed.workers);
      }
      if (parsed.pineapples && Array.isArray(parsed.pineapples)) {
        this.savePineapples(parsed.pineapples);
      }
      if (parsed.nourishments && Array.isArray(parsed.nourishments)) {
        this.saveNourishments(parsed.nourishments);
      }
      if (parsed.payments && Array.isArray(parsed.payments)) {
        this.savePayments(parsed.payments);
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }
      if (parsed.admins && Array.isArray(parsed.admins)) {
        this.saveAdmins(parsed.admins);
      }
      if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) {
        this.saveAuditLogs(parsed.auditLogs);
      }
      return true;
    } catch (err) {
      console.error('Failed to parse backup JSON', err);
      return false;
    }
  },
};

export function removeLegacySamples(): void {
  const marker = 'pineapple_samples_removed_v1';
  if (localStorage.getItem(marker)) return;
  const sampleBatches = new Set(['PINE-101','PINE-102','PINE-103']);
  const sampleWorkers = new Set(['w-1','w-2','w-3']);
  const sampleAdmins = new Set(['admin-super-1','admin-sub-1']);
  const clean = (key: string, keep: (row: any) => boolean) => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const rows = JSON.parse(raw);
    if (Array.isArray(rows)) localStorage.setItem(key, JSON.stringify(rows.filter(keep)));
  };
  clean(STORAGE_KEYS.PINEAPPLES, row => !sampleBatches.has(row.id));
  clean(STORAGE_KEYS.NOURISHMENTS, row => !sampleBatches.has(row.pineappleId));
  clean(STORAGE_KEYS.WORKERS, row => !sampleWorkers.has(row.id));
  clean(STORAGE_KEYS.PAYMENTS, row => !['pay-1','pay-2'].includes(row.id));
  clean(STORAGE_KEYS.ADMINS, row => !sampleAdmins.has(row.id));
  clean(STORAGE_KEYS.AUDIT_LOGS, row => row.id !== 'log-init');
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.setItem(marker, 'true');
}
