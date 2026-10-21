export interface Worker {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Nourishment {
  id: string;
  pineappleId: string;
  workerId?: string; // worker who executed the nourishment
  slotNumber: number; // 1, 2, ..., totalNourishmentsRequired
  dueAt: string; // ISO date string
  doneAt?: string; // ISO date string when completed
  cost: number; // e.g., $14,000
  status: 'pending' | 'done' | 'overdue' | 'skipped';
  notes?: string;
}

export interface Pineapple {
  id: string; // e.g. "PINE-101"
  name: string; // e.g. "Smooth Cayenne Lot A"
  plantedByWorkerId: string;
  plantedAt: string; // ISO date string
  plantCost: number; // e.g., $50,000
  status: 'active' | 'completed';
  totalNourishmentsRequired: number; // default 7
  intervalHours: number; // default 1.0
  completedAt?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  workerId: string;
  amount: number;
  date: string; // ISO date string
  note?: string;
}

export interface AppSettings {
  plantCost: number; // default 50000
  nourishCost: number; // default 14000
  totalNourishments: number; // default 7
  intervalHours: number; // default 1
  currency: string; // default "$"
  businessName: string; // default "Golden Crown Pineapple Plantation"
  timezone: string; // default "Asia/Karachi"
  dueAlertMinutes: number; // default 10
  soundAlerts: boolean; // default true
  theme: 'light' | 'dark';
  sheetSyncUrl?: string; // Google Sheet Web App / Webhook URL
  autoSyncToSheet?: boolean; // Automatically push updates when records change
  lastSheetSyncTime?: string; // ISO date of last successful sync
}

export type UserRole = 'super_admin' | 'admin';

export interface AdminUser {
  id: string;
  username: string; // unique, e.g. "superadmin" or "bilalanwar"
  password: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  canManageWorkers?: boolean;
  canRecordPayments?: boolean;
  canManageBatches?: boolean;
  canManageSettings?: boolean;
  canDeleteRecords?: boolean;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  actorUsername: string;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE_ADMIN' | 'UPDATE_ADMIN' | 'DELETE_ADMIN' | 'CHANGE_PASSWORD' | 'STATUS_CHANGE';
  details: string;
}

export type TabType = 'dashboard' | 'plantations' | 'workers' | 'ledger' | 'excel' | 'settings' | 'admins';

export interface WorkerHisabSummary {
  worker: Worker;
  plantingsCount: number;
  plantingsEarnings: number;
  nourishmentsCount: number;
  nourishmentsEarnings: number;
  totalEarnings: number;
  totalPaid: number;
  pendingBalance: number;
  recentPlantings: Pineapple[];
  recentNourishments: {
    nourishment: Nourishment;
    pineappleName: string;
    pineappleId: string;
  }[];
  payments: Payment[];
}

export interface LedgerEntry {
  id: string;
  pineappleId: string;
  pineappleName: string;
  workerId?: string;
  workerName: string;
  action: string; // "Collect & Plant" or "Nourish #X"
  actionType: 'plant' | 'nourish';
  slotNumber?: number;
  dateTime: string; // ISO string
  cost: number;
  status: 'completed' | 'pending' | 'overdue';
  timeLeftSeconds?: number;
}
