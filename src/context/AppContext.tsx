import { supabase } from '../lib/supabase';
import { flushFarm } from '../services/cloudStore';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Worker,
  Pineapple,
  Nourishment,
  Payment,
  AppSettings,
  TabType,
  WorkerHisabSummary,
  LedgerEntry,
  AdminUser,
  AdminAuditLog,
  UserRole,
} from '../types';
import { StorageService, DEFAULT_SETTINGS } from '../services/storage';
import { getRemainingSeconds, formatCountdown } from '../utils/dateUtils';
import { audioAlert } from '../utils/audioAlert';
import { buildSheetSyncPayload, pushToSheetUrl } from '../utils/sheetSyncService';

interface Toast {
  id: string;
  text: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface AppContextType {
  workers: Worker[];
  pineapples: Pineapple[];
  nourishments: Nourishment[];
  payments: Payment[];
  settings: AppSettings;
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  now: Date;

  // Selected entities for views/modals
  selectedWorkerId: string | null;
  setSelectedWorkerId: (id: string | null) => void;
  selectedPineappleId: string | null;
  setSelectedPineappleId: (id: string | null) => void;

  // Modals state
  isAddPineappleOpen: boolean;
  setIsAddPineappleOpen: (open: boolean) => void;
  isAddWorkerOpen: boolean;
  setIsAddWorkerOpen: (open: boolean) => void;
  editingWorker: Worker | null;
  setEditingWorker: (w: Worker | null) => void;
  isNourishModalOpen: boolean;
  setIsNourishModalOpen: (open: boolean) => void;
  nourishTarget: { pineappleId: string; slotNumber: number } | null;
  setNourishTarget: (target: { pineappleId: string; slotNumber: number } | null) => void;
  isRecordPaymentOpen: boolean;
  setIsRecordPaymentOpen: (open: boolean) => void;
  recordPaymentWorkerId: string | null;
  setRecordPaymentWorkerId: (id: string | null) => void;

  // Actions
  addWorker: (w: { name: string; phone?: string; notes?: string }) => Worker;
  updateWorker: (w: Worker) => void;
  deleteWorker: (id: string) => void;
  addPineapple: (data: {
    id?: string;
    name?: string;
    plantedByWorkerId: string;
    plantedAt: string;
    plantCost: number;
  }) => Pineapple;
  deletePineapple: (id: string) => void;
  markNourishmentDone: (
    pineappleId: string,
    slotNumber: number,
    workerId: string,
    doneAt: string,
    cost?: number,
    notes?: string
  ) => void;
  skipAndResetSlot: (pineappleId: string, slotNumber: number) => void;
  resetSlotOneHour: (pineappleId: string, slotNumber: number) => void;
  fastForwardSlotTimer: (pineappleId: string, slotNumber: number) => void;
  recordPayment: (workerId: string, amount: number, date: string, note?: string) => void;
  deletePayment: (paymentId: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  restoreFromBackup: (json: string) => boolean;
  importMergedData: (
    newWorkers: { name: string; phone?: string }[],
    newPineapples: { id: string; name: string; workerName: string; plantedAt: string; plantCost?: number; completedCount?: number }[]
  ) => { workersAdded: number; pineapplesAdded: number };
  syncToSheetNow: () => Promise<boolean>;
  isSyncingSheet: boolean;

  // Toast
  toast: Toast | null;
  showToast: (text: string, type?: 'success' | 'warning' | 'error' | 'info') => void;

  // Computed metrics
  workerHisabSummaries: WorkerHisabSummary[];
  urgentNourishments: {
    nourishment: Nourishment;
    pineapple: Pineapple;
    workerName?: string;
    secondsLeft: number;
    countdownText: string;
    isOverdue: boolean;
    isDueSoon: boolean;
  }[];
  ledgerEntries: LedgerEntry[];
  plantationStats: {
    totalPineapples: number;
    activeCount: number;
    completedCount: number;
    overdueCount: number;
    dueSoonCount: number;
    totalPlantCost: number;
    totalNourishCost: number;
    totalSpent: number;
    totalPaidWorkers: number;
    pendingBalance: number;
  };
  hasActiveBatch: boolean;
  activePineapple: Pineapple | null;

  // Auth & Admin Roles
  currentUser: AdminUser | null;
  admins: AdminUser[];
  auditLogs: AdminAuditLog[];
  isSuperAdmin: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  createAdmin: (adminData: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    status: 'active' | 'inactive';
    canManageWorkers?: boolean;
    canRecordPayments?: boolean;
    canManageBatches?: boolean;
    canManageSettings?: boolean;
    canDeleteRecords?: boolean;
  }) => { success: boolean; error?: string };
  updateAdmin: (id: string, updates: Partial<AdminUser>) => { success: boolean; error?: string };
  deleteAdmin: (id: string) => { success: boolean; error?: string };
  changePassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  hasPermission: (permission: keyof AdminUser) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<AppSettings>(() => StorageService.getSettings());
  const [workers, setWorkersState] = useState<Worker[]>(() => StorageService.getWorkers());
  const [pineapples, setPineapplesState] = useState<Pineapple[]>(() => StorageService.getPineapples());
  const [nourishments, setNourishmentsState] = useState<Nourishment[]>(() => StorageService.getNourishments());
  const [payments, setPaymentsState] = useState<Payment[]>(() => StorageService.getPayments());
  const [admins, setAdminsState] = useState<AdminUser[]>(() => StorageService.getAdmins());
  const [currentUser, setCurrentUserState] = useState<AdminUser | null>(() => StorageService.getCurrentUser());
  const [auditLogs, setAuditLogsState] = useState<AdminAuditLog[]>(() => StorageService.getAuditLogs());

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [now, setNow] = useState<Date>(new Date());

  // Navigation / Modal States
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedPineappleId, setSelectedPineappleId] = useState<string | null>(null);
  const [isAddPineappleOpen, setIsAddPineappleOpen] = useState(false);
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isNourishModalOpen, setIsNourishModalOpen] = useState(false);
  const [nourishTarget, setNourishTarget] = useState<{ pineappleId: string; slotNumber: number } | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [recordPaymentWorkerId, setRecordPaymentWorkerId] = useState<string | null>(null);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);

  // Sync mute state with settings
  useEffect(() => {
    audioAlert.setMuted(!settings.soundAlerts);
  }, [settings.soundAlerts]);

  // Sync theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Live timer tick every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setToast({ id: Date.now().toString(), text, type });
    setTimeout(() => {
      setToast(curr => (curr && curr.text === text ? null : curr));
    }, 4000);
  }, []);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const hasPermission = useCallback((permission: keyof AdminUser): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return Boolean(currentUser[permission]);
  }, [currentUser]);

  const login = () => ({ success: false, error: 'Sign in using Supabase Auth.' });
  const logout = () => { void flushFarm().then(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) showToast(error.message, 'error');
  }).catch(err => showToast(err.message,'error')); };
  const managedInSupabase = () => ({ success: false, error: 'Manage farm users in the Supabase dashboard.' });
  const createAdmin = managedInSupabase;
  const updateAdmin = managedInSupabase;
  const deleteAdmin = managedInSupabase;
  const changePassword = async (userId: string, password: string) => {
    if (userId !== currentUser?.id || password.length < 8) return {success:false,error:'Use at least 8 characters for your own account.'};
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return {success:false,error:error.message};
    showToast('Password updated.', 'success'); return {success:true};
  };

  // Update settings wrapper
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      StorageService.saveSettings(updated);
      return updated;
    });
    showToast('Settings saved successfully', 'success');
  }, [showToast]);

  // Workers CRUD
  const addWorker = useCallback((w: { name: string; phone?: string; notes?: string }): Worker => {
    const newWorker: Worker = {
      id: `w-${crypto.randomUUID()}`,
      name: w.name.trim(),
      phone: w.phone?.trim(),
      notes: w.notes?.trim(),
      createdAt: new Date().toISOString(),
    };
    setWorkersState(prev => {
      const next = [newWorker, ...prev];
      StorageService.saveWorkers(next);
      return next;
    });
    showToast(`Worker "${newWorker.name}" added`, 'success');
    return newWorker;
  }, [showToast]);

  const updateWorker = useCallback((w: Worker) => {
    setWorkersState(prev => {
      const next = prev.map(item => (item.id === w.id ? w : item));
      StorageService.saveWorkers(next);
      return next;
    });
    showToast(`Worker "${w.name}" updated`, 'success');
  }, [showToast]);

  const deleteWorker = useCallback((id: string) => {
    if (pineapples.some(p => p.plantedByWorkerId === id) || nourishments.some(n => n.workerId === id) || payments.some(p => p.workerId === id)) {
      showToast('This worker has historical records and cannot be deleted.', 'warning'); return;
    }
    setWorkersState(prev => {
      const next = prev.filter(w => w.id !== id);
      StorageService.saveWorkers(next);
      return next;
    });
    showToast('Worker deleted', 'info');
  }, [pineapples, nourishments, payments, showToast]);

  // Pineapples CRUD + Automatic 7-slot Schedule Creation
  const addPineapple = useCallback((data: {
    id?: string;
    name?: string;
    plantedByWorkerId: string;
    plantedAt: string;
    plantCost: number;
  }): Pineapple => {
    // Only 1 batch can be active at a time!
    if (pineapples.some(p => p.status === 'active')) {
      showToast('Ek batch pehle se chal raha hai. Pehle iske 7 nourishments mukammal karein.', 'warning');
      throw new Error('An active plantation is already in progress.');
    }

    const plantDate = new Date(data.plantedAt);
    const plantTimeMs = plantDate.getTime();

    // Auto-generate ID if empty (e.g. PINE-106)
    let assignedId = data.id?.trim();
    if (!assignedId) {
      const highestNum = pineapples.reduce((max, p) => {
        const match = p.id.match(/PINE-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 100);
      assignedId = `PINE-${highestNum + 1}`;
    }

    const assignedName = data.name?.trim() || `Pineapple Lot ${assignedId}`;
    const totalRequired = settings.totalNourishments;
    const intervalHours = settings.intervalHours;
    const ONE_HOUR = 60 * 60 * 1000;

    const newPineapple: Pineapple = {
      id: assignedId,
      name: assignedName,
      plantedByWorkerId: data.plantedByWorkerId,
      plantedAt: new Date(plantTimeMs).toISOString(),
      plantCost: data.plantCost,
      status: 'active',
      totalNourishmentsRequired: totalRequired,
      intervalHours: intervalHours,
    };

    // Auto-create nourishment schedule: 7 slots, each 1 hr after previous
    const newSlots: Nourishment[] = [];
    for (let slot = 1; slot <= totalRequired; slot++) {
      const dueTimeMs = plantTimeMs + slot * intervalHours * ONE_HOUR;
      newSlots.push({
        id: `nourish-${assignedId}-${slot}`,
        pineappleId: assignedId,
        slotNumber: slot,
        dueAt: new Date(dueTimeMs).toISOString(),
        cost: settings.nourishCost,
        status: Date.now() > dueTimeMs ? 'overdue' : 'pending',
      });
    }

    setPineapplesState(prev => {
      const next = [newPineapple, ...prev];
      StorageService.savePineapples(next);
      return next;
    });

    setNourishmentsState(prev => {
      const next = [...prev, ...newSlots];
      StorageService.saveNourishments(next);
      return next;
    });

    audioAlert.playSuccessChime();
    showToast(`Planted "${assignedName}" with ${totalRequired}-step schedule`, 'success');
    return newPineapple;
  }, [pineapples, settings.totalNourishments, settings.intervalHours, settings.nourishCost, showToast]);

  const deletePineapple = useCallback((id: string) => {
    setPineapplesState(prev => {
      const next = prev.filter(p => p.id !== id);
      StorageService.savePineapples(next);
      return next;
    });
    setNourishmentsState(prev => {
      const next = prev.filter(n => n.pineappleId !== id);
      StorageService.saveNourishments(next);
      return next;
    });
    showToast(`Pineapple ${id} deleted`, 'info');
  }, [showToast]);

  // Mark Nourishment Done
  const markNourishmentDone = useCallback((
    pineappleId: string,
    slotNumber: number,
    workerId: string,
    doneAt: string,
    cost?: number,
    notes?: string
  ) => {
    const slots = nourishments.filter(n => n.pineappleId === pineappleId);
    const target = slots.find(n => n.slotNumber === slotNumber);
    if (!target || target.status === 'done' || slots.some(n => n.slotNumber < slotNumber && n.status !== 'done')) {
      showToast('Complete the previous slots first. This slot may already be done.', 'warning'); return;
    }
    const finalCost = cost !== undefined ? cost : settings.nourishCost;

    const ONE_HOUR = settings.intervalHours * 60 * 60 * 1000;
    const doneTimeMs = new Date(doneAt).getTime();

    setNourishmentsState(prev => {
      const next = prev.map(n => {
        if (n.pineappleId === pineappleId) {
          if (n.slotNumber === slotNumber) {
            return {
              ...n,
              workerId,
              doneAt: new Date(doneAt).toISOString(),
              status: 'done' as const,
              cost: finalCost,
              notes: notes?.trim() || n.notes,
            };
          }
          // Chain next subsequent slots: next slot starts 1 full hour after done time
          if (n.slotNumber > slotNumber && n.status !== 'done' && n.status !== 'skipped') {
            const offset = (n.slotNumber - slotNumber) * ONE_HOUR;
            return {
              ...n,
              dueAt: new Date(doneTimeMs + offset).toISOString(),
              status: 'pending' as const,
            };
          }
        }
        return n;
      });
      StorageService.saveNourishments(next);
      return next;
    });

    // Check if this completes all slots or is the final slot
    setPineapplesState(prev => {
      const targetPineapple = prev.find(p => p.id === pineappleId);
      if (!targetPineapple) return prev;

      if (slotNumber >= targetPineapple.totalNourishmentsRequired) {
        const next = prev.map(p =>
          p.id === pineappleId
            ? { ...p, status: 'completed' as const, completedAt: new Date(doneAt).toISOString() }
            : p
        );
        StorageService.savePineapples(next);
        return next;
      }
      return prev;
    });

    audioAlert.playSuccessChime();
    showToast(`Slot #${slotNumber} complete. Agle ghante ka waqt shuru.`, 'success');
  }, [nourishments, settings.nourishCost, settings.intervalHours, showToast]);

  // Skip and reset slot when 10 min window expires or user clicks "No"
  const skipAndResetSlot = useCallback((pineappleId: string, slotNumber: number) => {
    const ONE_HOUR = settings.intervalHours * 60 * 60 * 1000;
    const resetBaseTime = Date.now();

    setNourishmentsState(prev => {
      const next = prev.map(n => {
        if (n.pineappleId === pineappleId) {
          if (n.slotNumber === slotNumber) {
            return {
              ...n,
              status: 'skipped' as const,
              notes: 'Time finish hone par confirm nahi kiya ya No dabaya gaya. Timer reset.',
            };
          }
          // Advance subsequent slots from right now
          if (n.slotNumber > slotNumber && n.status !== 'done' && n.status !== 'skipped') {
            const offset = (n.slotNumber - slotNumber) * ONE_HOUR;
            return {
              ...n,
              dueAt: new Date(resetBaseTime + offset).toISOString(),
              status: 'pending' as const,
            };
          }
        }
        return n;
      });
      StorageService.saveNourishments(next);
      return next;
    });

    setPineapplesState(prev => {
      const targetPineapple = prev.find(p => p.id === pineappleId);
      if (!targetPineapple) return prev;

      if (slotNumber >= targetPineapple.totalNourishmentsRequired) {
        const next = prev.map(p =>
          p.id === pineappleId
            ? { ...p, status: 'completed' as const, completedAt: new Date().toISOString() }
            : p
        );
        StorageService.savePineapples(next);
        return next;
      }
      return prev;
    });

    showToast(`Slot #${slotNumber} reset ho gaya. Agle ghante ka timer start.`, 'info');
  }, [settings.intervalHours, showToast]);

  // Reset the 1-hour cycle timer for current slot (restarts fresh 60-minute countdown)
  const resetSlotOneHour = useCallback((pineappleId: string, slotNumber: number) => {
    const ONE_HOUR = settings.intervalHours * 60 * 60 * 1000;
    const nowTime = Date.now();
    const newDueTimeMs = nowTime + ONE_HOUR;

    setNourishmentsState(prev => {
      const next = prev.map(n => {
        if (n.pineappleId === pineappleId) {
          if (n.slotNumber === slotNumber) {
            return {
              ...n,
              dueAt: new Date(newDueTimeMs).toISOString(),
              status: 'pending' as const,
              notes: '1-Hour timer reset kiya gaya. 60 minute countdown restarted.',
            };
          }
          if (n.slotNumber > slotNumber && n.status !== 'done' && n.status !== 'skipped') {
            const offset = (n.slotNumber - slotNumber) * ONE_HOUR;
            return {
              ...n,
              dueAt: new Date(newDueTimeMs + offset).toISOString(),
              status: 'pending' as const,
            };
          }
        }
        return n;
      });
      StorageService.saveNourishments(next);
      return next;
    });

    audioAlert.playInfoBeep();
    showToast(`Slot #${slotNumber} ka 1-hour timer reset ho gaya. Agle 60 minutes shuru.`, 'info');
  }, [settings.intervalHours, showToast]);

  // Fast-forward 1-hour timer for testing/demo (completes the 1 hour immediately)
  const fastForwardSlotTimer = useCallback((pineappleId: string, slotNumber: number) => {
    const pastTime = new Date(Date.now() - 5000).toISOString();

    setNourishmentsState(prev => {
      const next = prev.map(n => {
        if (n.pineappleId === pineappleId && n.slotNumber === slotNumber) {
          return {
            ...n,
            dueAt: pastTime,
            status: 'pending' as const,
          };
        }
        return n;
      });
      StorageService.saveNourishments(next);
      return next;
    });

    audioAlert.playUrgentAlert();
    showToast(`Slot #${slotNumber} ka 1 hour complete ho gaya! Ab nourish ka waqt hai.`, 'warning');
  }, [showToast]);

  // Payments CRUD
  const recordPayment = useCallback((workerId: string, amount: number, date: string, note?: string) => {
    const newPayment: Payment = {
      id: `pay-${crypto.randomUUID()}`,
      workerId,
      amount,
      date: new Date(date).toISOString(),
      note: note?.trim(),
    };
    setPaymentsState(prev => {
      const next = [newPayment, ...prev];
      StorageService.savePayments(next);
      return next;
    });
    audioAlert.playSuccessChime();
    showToast('Payment recorded successfully', 'success');
  }, [showToast]);

  const deletePayment = useCallback((paymentId: string) => {
    setPaymentsState(prev => {
      const next = prev.filter(p => p.id !== paymentId);
      StorageService.savePayments(next);
      return next;
    });
    showToast('Payment deleted', 'info');
  }, [showToast]);

  // Restore JSON Backup
  const restoreFromBackup = useCallback((json: string): boolean => {
    const success = StorageService.restoreBackup(json);
    if (success) {
      setWorkersState(StorageService.getWorkers());
      setPineapplesState(StorageService.getPineapples());
      setNourishmentsState(StorageService.getNourishments());
      setPaymentsState(StorageService.getPayments());
      setSettingsState(StorageService.getSettings());
      showToast('Database restored from backup', 'success');
      return true;
    }
    showToast('Invalid backup file', 'error');
    return false;
  }, [showToast]);

  // Excel Import / Merge without duplicates
  const importMergedData = useCallback((
    newWorkers: { name: string; phone?: string }[],
    newPineapplesList: { id: string; name: string; workerName: string; plantedAt: string; plantCost?: number; completedCount?: number }[]
  ) => {
    let workersAdded = 0;
    let pineapplesAdded = 0;

    const currentWorkers = [...workers];
    const currentPineapples = [...pineapples];
    const currentNourishments = [...nourishments];

    // 1. Process workers
    newWorkers.forEach(w => {
      const exists = currentWorkers.some(cw => cw.name.toLowerCase() === w.name.trim().toLowerCase());
      if (!exists && w.name.trim()) {
        const created: Worker = {
          id: `w-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 900 + 100)}`,
          name: w.name.trim(),
          phone: w.phone?.trim(),
          createdAt: new Date().toISOString(),
        };
        currentWorkers.push(created);
        workersAdded++;
      }
    });

    // Worker lookup map
    const workerNameToId = (name: string): string => {
      const found = currentWorkers.find(cw => cw.name.toLowerCase() === name.trim().toLowerCase());
      if (found) return found.id;
      // create on the fly
      const created: Worker = {
        id: `w-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 900 + 100)}`,
        name: name.trim() || 'General Worker',
        createdAt: new Date().toISOString(),
      };
      currentWorkers.push(created);
      workersAdded++;
      return created.id;
    };

    // 2. Process pineapples
    newPineapplesList.forEach(p => {
      const cleanId = p.id.trim();
      const exists = currentPineapples.some(cp => cp.id.toLowerCase() === cleanId.toLowerCase());
      if (!exists && cleanId) {
        const workerId = workerNameToId(p.workerName);
        const plantCost = p.plantCost || settings.plantCost;
        const plantedDate = p.plantedAt ? new Date(p.plantedAt) : new Date();
        const plantTimeMs = isNaN(plantedDate.getTime()) ? Date.now() : plantedDate.getTime();
        const completedSlots = Math.min(settings.totalNourishments, Math.max(0, p.completedCount || 0));

        const isCompleted = completedSlots >= settings.totalNourishments;
        const newPineapple: Pineapple = {
          id: cleanId,
          name: p.name?.trim() || `Pineapple ${cleanId}`,
          plantedByWorkerId: workerId,
          plantedAt: new Date(plantTimeMs).toISOString(),
          plantCost: plantCost,
          status: isCompleted ? 'completed' : 'active',
          totalNourishmentsRequired: settings.totalNourishments,
          intervalHours: settings.intervalHours,
          completedAt: isCompleted ? new Date(plantTimeMs + settings.totalNourishments * 3600000).toISOString() : undefined,
        };
        currentPineapples.push(newPineapple);
        pineapplesAdded++;

        // Add 7 slots
        for (let slot = 1; slot <= settings.totalNourishments; slot++) {
          const dueTimeMs = plantTimeMs + slot * settings.intervalHours * 3600000;
          const isSlotDone = slot <= completedSlots;
          currentNourishments.push({
            id: `nourish-${cleanId}-${slot}`,
            pineappleId: cleanId,
            workerId: isSlotDone ? workerId : undefined,
            slotNumber: slot,
            dueAt: new Date(dueTimeMs).toISOString(),
            doneAt: isSlotDone ? new Date(dueTimeMs).toISOString() : undefined,
            cost: settings.nourishCost,
            status: isSlotDone ? 'done' : (Date.now() > dueTimeMs ? 'overdue' : 'pending'),
          });
        }
      }
    });

    setWorkersState(currentWorkers);
    StorageService.saveWorkers(currentWorkers);

    setPineapplesState(currentPineapples);
    StorageService.savePineapples(currentPineapples);

    setNourishmentsState(currentNourishments);
    StorageService.saveNourishments(currentNourishments);

    showToast(`Merged: ${pineapplesAdded} new pineapples, ${workersAdded} new workers`, 'success');
    return { workersAdded, pineapplesAdded };
  }, [workers, pineapples, nourishments, settings.plantCost, settings.totalNourishments, settings.intervalHours, settings.nourishCost, showToast]);

  // Computed: Worker Hisab Summaries
  const workerHisabSummaries = useMemo<WorkerHisabSummary[]>(() => {
    return workers.map(worker => {
      const workerPlantings = pineapples.filter(p => p.plantedByWorkerId === worker.id);
      const plantingsCount = workerPlantings.length;
      const plantingsEarnings = workerPlantings.reduce((sum, p) => sum + p.plantCost, 0);

      const workerNourishments = nourishments.filter(n => n.workerId === worker.id && n.status === 'done');
      const nourishmentsCount = workerNourishments.length;
      const nourishmentsEarnings = workerNourishments.reduce((sum, n) => sum + n.cost, 0);

      // Note: Plant cost & Nourishment cost are plantation capital input expenses.
      // Currently, no worker is owed any pending amount (0 pending balance).
      const workerPayments = payments.filter(p => p.workerId === worker.id);
      const totalPaid = workerPayments.reduce((sum, p) => sum + p.amount, 0);
      const pendingBalance = 0;
      const totalEarnings = totalPaid;

      const recentNourishments = workerNourishments.slice(0, 10).map(n => {
        const parent = pineapples.find(p => p.id === n.pineappleId);
        return {
          nourishment: n,
          pineappleName: parent?.name || n.pineappleId,
          pineappleId: n.pineappleId,
        };
      });

      return {
        worker,
        plantingsCount,
        plantingsEarnings,
        nourishmentsCount,
        nourishmentsEarnings,
        totalEarnings,
        totalPaid,
        pendingBalance,
        recentPlantings: workerPlantings.slice(0, 10),
        recentNourishments,
        payments: workerPayments,
      };
    });
  }, [workers, pineapples, nourishments, payments]);

  // Computed: Urgent Nourishments (Due within 10 min or Overdue)
  const urgentNourishments = useMemo(() => {
    const list: {
      nourishment: Nourishment;
      pineapple: Pineapple;
      workerName?: string;
      secondsLeft: number;
      countdownText: string;
      isOverdue: boolean;
      isDueSoon: boolean;
    }[] = [];

    pineapples.forEach(pineapple => {
      if (pineapple.status === 'completed') return;

      const pNourishments = nourishments.filter(n => n.pineappleId === pineapple.id);
      const nextPendingSlot = pNourishments
        .filter(n => n.status !== 'done' && n.status !== 'skipped')
        .sort((a, b) => a.slotNumber - b.slotNumber)[0];

      if (!nextPendingSlot) return;

      const diffSeconds = getRemainingSeconds(nextPendingSlot.dueAt, now);
      const countdown = formatCountdown(diffSeconds);

      if (countdown.isOverdue || countdown.isDueSoon) {
        const planter = workers.find(w => w.id === pineapple.plantedByWorkerId);
        list.push({
          nourishment: nextPendingSlot,
          pineapple,
          workerName: planter?.name,
          secondsLeft: diffSeconds,
          countdownText: countdown.text,
          isOverdue: countdown.isOverdue,
          isDueSoon: countdown.isDueSoon,
        });
      }
    });

    // Sort: overdue first (most overdue at top), then due soon
    return list.sort((a, b) => a.secondsLeft - b.secondsLeft);
  }, [pineapples, nourishments, workers, now]);

  // Trigger sound alerts if urgent items exist
  useEffect(() => {
    if (!settings.soundAlerts || urgentNourishments.length === 0) return;
    const hasOverdue = urgentNourishments.some(u => u.isOverdue);
    if (hasOverdue) {
      audioAlert.playOverdueAlert();
    } else {
      audioAlert.playDueSoonChime();
    }
  }, [urgentNourishments, settings.soundAlerts]);

  // Computed: Master Unified Ledger Entries
  const ledgerEntries = useMemo<LedgerEntry[]>(() => {
    const entries: LedgerEntry[] = [];
    const workerMap = new Map(workers.map(w => [w.id, w.name]));

    // Plant actions
    pineapples.forEach(p => {
      entries.push({
        id: `ledger-plant-${p.id}`,
        pineappleId: p.id,
        pineappleName: p.name,
        workerId: p.plantedByWorkerId,
        workerName: workerMap.get(p.plantedByWorkerId) || 'Unknown Planter',
        action: 'Collect & Plant',
        actionType: 'plant',
        dateTime: p.plantedAt,
        cost: p.plantCost,
        status: 'completed',
      });
    });

    // Nourishment actions
    nourishments.forEach(n => {
      const parent = pineapples.find(p => p.id === n.pineappleId);
      const diffSec = getRemainingSeconds(n.dueAt, now);
      let status: 'completed' | 'pending' | 'overdue' = 'pending';
      if (n.status === 'done') {
        status = 'completed';
      } else if (diffSec < 0) {
        status = 'overdue';
      }

      entries.push({
        id: `ledger-nourish-${n.id}`,
        pineappleId: n.pineappleId,
        pineappleName: parent?.name || n.pineappleId,
        workerId: n.workerId,
        workerName: n.workerId ? (workerMap.get(n.workerId) || 'Unknown') : 'Not Yet Assigned',
        action: `Nourish #${n.slotNumber}`,
        actionType: 'nourish',
        slotNumber: n.slotNumber,
        dateTime: n.doneAt || n.dueAt,
        cost: n.cost,
        status,
        timeLeftSeconds: n.status === 'done' ? undefined : diffSec,
      });
    });

    // Sort by dateTime descending (newest first)
    return entries.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [pineapples, nourishments, workers, now]);

  // Computed: Plantation Overall Stats
  const plantationStats = useMemo(() => {
    const totalPineapples = pineapples.length;
    const activeCount = pineapples.filter(p => p.status === 'active').length;
    const completedCount = pineapples.filter(p => p.status === 'completed').length;
    const totalPlantCost = pineapples.reduce((sum, p) => sum + p.plantCost, 0);
    const totalNourishCost = nourishments.filter(n => n.status === 'done').reduce((sum, n) => sum + n.cost, 0);
    const totalSpent = totalPlantCost + totalNourishCost;

    let overdueCount = 0;
    let dueSoonCount = 0;
    urgentNourishments.forEach(u => {
      if (u.isOverdue) overdueCount++;
      else if (u.isDueSoon) dueSoonCount++;
    });

    const totalPaidWorkers = payments.reduce((sum, p) => sum + p.amount, 0);
    // Currently no pending debt is owed to workers (0 pending balance)
    const pendingBalance = workerHisabSummaries.reduce((sum, s) => sum + s.pendingBalance, 0);

    return {
      totalPineapples,
      activeCount,
      completedCount,
      overdueCount,
      dueSoonCount,
      totalPlantCost,
      totalNourishCost,
      totalSpent,
      totalPaidWorkers,
      pendingBalance,
    };
  }, [pineapples, nourishments, payments, urgentNourishments, workerHisabSummaries]);

  const hasActiveBatch = useMemo(() => pineapples.some(p => p.status === 'active'), [pineapples]);
  const activePineapple = useMemo(() => pineapples.find(p => p.status === 'active') || null, [pineapples]);

  const syncToSheetNow = useCallback(async (): Promise<boolean> => {
    if (!settings.sheetSyncUrl || !settings.sheetSyncUrl.trim()) {
      showToast('Pehle Google Sheet ka link add karein.', 'warning');
      return false;
    }

    try {
      setIsSyncingSheet(true);
      const payload = buildSheetSyncPayload(
        pineapples,
        nourishments,
        workers,
        workerHisabSummaries,
        settings
      );
      await pushToSheetUrl(settings.sheetSyncUrl, payload);
      const nowIso = new Date().toISOString();
      updateSettings({ lastSheetSyncTime: nowIso });
      showToast('Google Sheet successfully update ho gayi!', 'success');
      return true;
    } catch (err) {
      console.error(err);
      showToast('Google Sheet sync mein masla aaya. Link check karein.', 'error');
      return false;
    } finally {
      setIsSyncingSheet(false);
    }
  }, [settings, pineapples, nourishments, workers, workerHisabSummaries, showToast, updateSettings]);

  // Background auto-sync when enabled and data changes
  useEffect(() => {
    const url = settings.sheetSyncUrl;
    if (!url || !settings.autoSyncToSheet || !isSuperAdmin) return;
    const timer = setTimeout(() => {
      const payload = buildSheetSyncPayload(
        pineapples,
        nourishments,
        workers,
        workerHisabSummaries,
        settings
      );
      pushToSheetUrl(url, payload)
        .then(() => {
          setSettingsState(prev => {
            const updated = { ...prev, lastSheetSyncTime: new Date().toISOString() };
            StorageService.saveSettings(updated);
            return updated;
          });
        })
        .catch(() => {});
    }, 2500);

    return () => clearTimeout(timer);
  }, [pineapples, nourishments, payments, workers, settings.sheetSyncUrl, settings.autoSyncToSheet, workerHisabSummaries, settings.businessName, settings.timezone, settings.currency, isSuperAdmin]);

  return (
    <AppContext.Provider
      value={{
        workers,
        pineapples,
        nourishments,
        payments,
        settings,
        currentTab,
        setCurrentTab,
        now,

        selectedWorkerId,
        setSelectedWorkerId,
        selectedPineappleId,
        setSelectedPineappleId,

        isAddPineappleOpen,
        setIsAddPineappleOpen,
        isAddWorkerOpen,
        setIsAddWorkerOpen,
        editingWorker,
        setEditingWorker,
        isNourishModalOpen,
        setIsNourishModalOpen,
        nourishTarget,
        setNourishTarget,
        isRecordPaymentOpen,
        setIsRecordPaymentOpen,
        recordPaymentWorkerId,
        setRecordPaymentWorkerId,

        addWorker,
        updateWorker,
        deleteWorker,
        addPineapple,
        deletePineapple,
        markNourishmentDone,
        skipAndResetSlot,
        resetSlotOneHour,
        fastForwardSlotTimer,
        recordPayment,
        deletePayment,
        updateSettings,
        restoreFromBackup,
        importMergedData,

        toast,
        showToast,

        workerHisabSummaries,
        urgentNourishments,
        ledgerEntries,
        plantationStats,
        hasActiveBatch,
        activePineapple,
        syncToSheetNow,
        isSyncingSheet,

        currentUser,
        admins,
        auditLogs,
        isSuperAdmin,
        login,
        logout,
        createAdmin,
        updateAdmin,
        deleteAdmin,
        changePassword,
        hasPermission,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
