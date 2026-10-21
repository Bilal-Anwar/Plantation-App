import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StorageService } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';
import { Save, Download, Upload, RotateCcw, Crown, ShieldCheck, ArrowRight } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    restoreFromBackup,
    showToast,
    currentUser,
    isSuperAdmin,
    setCurrentTab,
  } = useApp();

  const [plantCost, setPlantCost] = useState(settings.plantCost);
  const [nourishCost, setNourishCost] = useState(settings.nourishCost);
  const [totalNourishments, setTotalNourishments] = useState(settings.totalNourishments);
  const [intervalHours, setIntervalHours] = useState(settings.intervalHours);
  const [currency, setCurrency] = useState(settings.currency);
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [timezone, setTimezone] = useState(settings.timezone);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      plantCost: Number(plantCost) || 50000,
      nourishCost: Number(nourishCost) || 14000,
      totalNourishments: Number(totalNourishments) || 7,
      intervalHours: Number(intervalHours) || 1.0,
      currency: currency.trim() || '$',
      businessName: businessName.trim() || 'Pineapple Plantation',
      timezone,
    });
  };

  const handleDownloadBackup = () => {
    const jsonStr = StorageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pineapple_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded', 'success');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      if (content) {
        restoreFromBackup(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Admin Access & Role Status */}
      {currentUser && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isSuperAdmin
            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
            : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSuperAdmin
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              }`}>
                {isSuperAdmin ? <Crown className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{currentUser.name}</span>
                  <span className="text-xs font-mono text-zinc-500">@{currentUser.username}</span>
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Logged in as <span className="font-semibold">{isSuperAdmin ? '👑 Super Admin (Full Master Privileges)' : '🛡️ Farm Administrator'}</span>
                </div>
              </div>
            </div>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setCurrentTab('admins')}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Manage All Admins</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
          Plantation Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
              Plant Cost per Pineapple ({currency})
            </label>
            <input
              type="number"
              value={plantCost}
              onChange={e => setPlantCost(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
              Cost per Nourishment ({currency})
            </label>
            <input
              type="number"
              value={nourishCost}
              onChange={e => setNourishCost(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
              Nourishments Required
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={totalNourishments}
              onChange={e => setTotalNourishments(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
              Interval (Hours)
            </label>
            <input
              type="number"
              step="0.1"
              value={intervalHours}
              onChange={e => setIntervalHours(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
              Currency Symbol
            </label>
            <input
              type="text"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
            >
              <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1">
              Plantation Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Backup & Restore */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
          Data Backup & Reset
        </h3>
        <p className="text-xs text-zinc-500">
          Save your data as a JSON file or restore a previous backup.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center space-x-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Backup</span>
          </button>

          <label className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center space-x-1 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
            <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          </label>


        </div>
      </div>


    </div>
  );
};
