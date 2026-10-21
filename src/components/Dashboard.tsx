import React from 'react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency,
  formatDateTime,
  getRemainingSeconds,
  formatOneHourSlotCountdown,
} from '../utils/dateUtils';
import { exportPlantationToExcel } from '../utils/excelService';
import {
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  ChevronRight,
  Plus,
  FileSpreadsheet,
  Lock,
  RotateCcw,
  Zap,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Check,
  RefreshCw,
  BookOpen,
  Calendar,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    plantationStats,
    pineapples,
    nourishments,
    workers,
    workerHisabSummaries,
    settings,
    now,
    setCurrentTab,
    setSelectedPineappleId,
    setNourishTarget,
    setIsNourishModalOpen,
    setIsAddPineappleOpen,
    urgentNourishments,
    activePineapple,
    hasActiveBatch,
    resetSlotOneHour,
    fastForwardSlotTimer,
    showToast,
  } = useApp();

  const activePineapples = pineapples.filter(p => p.status === 'active');
  const completedPineapples = pineapples.filter(p => p.status === 'completed');
  const workerMap = new Map(workers.map(w => [w.id, w.name]));

  // Active Pineapple Specific 1-Hour calculations
  const activePineappleNourishments = activePineapple
    ? nourishments
        .filter(n => n.pineappleId === activePineapple.id)
        .sort((a, b) => a.slotNumber - b.slotNumber)
    : [];

  const completedSlotsCount = activePineappleNourishments.filter(n => n.status === 'done').length;
  const nextPendingSlot = activePineappleNourishments.find(n => n.status !== 'done');

  let activeSlotTimer = null;
  let isActiveSlotReady = false;
  let isActiveSlotOverdue = false;

  if (nextPendingSlot) {
    const diffSec = getRemainingSeconds(nextPendingSlot.dueAt, now);
    activeSlotTimer = formatOneHourSlotCountdown(diffSec);
    isActiveSlotReady = activeSlotTimer.isReadyForNourish;
    isActiveSlotOverdue = activeSlotTimer.isOverdue;
  }

  const handleExport = () => {
    exportPlantationToExcel(pineapples, nourishments, workers, workerHisabSummaries, settings);
    showToast('Excel workbook export ho gaya!', 'success');
  };

  const handleQuickNourish = (pineappleId: string, slotNumber: number) => {
    setNourishTarget({ pineappleId, slotNumber });
    setIsNourishModalOpen(true);
  };

  const handleNewPlantationClick = () => {
    if (hasActiveBatch) {
      showToast(
        'Pehle se ek batch chal raha hai. Uske tamam nourishments mukammal hone ke baad agla batch lagaya jaa sakta hai.',
        'warning'
      );
    } else {
      setIsAddPineappleOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. WELCOME & QUICK ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {settings.businessName || 'Pineapple Plantation'} Dashboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center space-x-2">
            <span>Overall business statistics, 1-hour hydration cycles, and labor hisab</span>
            <span>•</span>
            <span className="font-mono text-zinc-600 dark:text-zinc-300">
              {formatDateTime(now.toISOString(), settings.timezone)}
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 flex-nowrap">
          {/* Export Excel Button */}
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
            title="Download full workbook with all tabs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">Export Excel</span>
          </button>

          {/* New Plantation Button */}
          <button
            onClick={handleNewPlantationClick}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              hasActiveBatch
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/20'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">New Plantation</span>
          </button>
        </div>
      </div>

      {/* 2. CURRENT ACTIVE BATCH SPOTLIGHT (HERO CARD) */}
      {activePineapple ? (
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-start space-x-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-2xl text-2xl">
                🍍
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold">
                    ACTIVE BATCH: {activePineapple.id}
                  </span>
                  <span className="text-xs text-zinc-400">
                    Planted {formatDateTime(activePineapple.plantedAt, settings.timezone)}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {activePineapple.name}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Planted by: <strong className="text-zinc-700 dark:text-zinc-300">{workerMap.get(activePineapple.plantedByWorkerId) || 'Worker'}</strong>
                </p>
              </div>
            </div>

            {/* Overall Nourishment Stage Badge */}
            <div className="text-left sm:text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Hydration Progress</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {completedSlotsCount} / {activePineapple.totalNourishmentsRequired} Slots
              </div>
              <span className="text-[11px] text-zinc-400">
                {Math.round((completedSlotsCount / activePineapple.totalNourishmentsRequired) * 100)}% Completed
              </span>
            </div>
          </div>

          {/* 1-Hour Nourishment Cycle Live Box */}
          {nextPendingSlot && activeSlotTimer && (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isActiveSlotOverdue
                  ? 'border-rose-300 bg-rose-50/80 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100'
                  : isActiveSlotReady
                  ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100'
                  : 'border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    {isActiveSlotReady ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-spin-slow" />
                    )}
                    <span className="font-extrabold text-sm sm:text-base">
                      {isActiveSlotOverdue
                        ? `🚨 Slot #${nextPendingSlot.slotNumber}: 1-Hour Complete! Confirmation Window Open`
                        : isActiveSlotReady
                        ? `⏰ Slot #${nextPendingSlot.slotNumber}: 1-Hour Complete! Ab Nourish Karein`
                        : `⏳ Slot #${nextPendingSlot.slotNumber}: 1-Hour Wait Active (Time Left: ${activeSlotTimer.display})`}
                    </span>
                  </div>

                  {/* 1-Hour Progress Bar */}
                  <div className="w-full bg-black/10 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isActiveSlotReady ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${activeSlotTimer.percentElapsed}%` }}
                    />
                  </div>

                  <div className="text-xs opacity-90 flex flex-wrap items-center gap-x-3 text-zinc-700 dark:text-zinc-300">
                    <span>
                      Total Slot Cycle: <strong>1 Hour (60:00)</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Time Remaining:{' '}
                      <strong className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                        {activeSlotTimer.display}
                      </strong>{' '}
                      ({activeSlotTimer.text})
                    </span>
                    <span>•</span>
                    <span>
                      Due At:{' '}
                      <strong>{formatDateTime(nextPendingSlot.dueAt, settings.timezone)}</strong>
                    </span>
                  </div>

                  {!isActiveSlotReady && (
                    <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 italic pt-0.5">
                      ℹ️ Rule: Jab tak yeh 1 ghanta mukammal na ho, next slot par nahi jaa sakte. 1 hour pura hone par 10 minutes ka popup confirm karega.
                    </p>
                  )}
                </div>

                {/* Slot Action Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Reset 1-Hour Timer */}
                  <button
                    type="button"
                    onClick={() => resetSlotOneHour(activePineapple.id, nextPendingSlot.slotNumber)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 hover:bg-white text-zinc-700 dark:text-zinc-200 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                    title="1-Hour timer ko wapas 60:00 par reset karein"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Reset 1-Hr Timer</span>
                  </button>

                  {/* Fast-Forward 1 Hr (Testing) */}
                  {!isActiveSlotReady && (
                    <button
                      type="button"
                      onClick={() => fastForwardSlotTimer(activePineapple.id, nextPendingSlot.slotNumber)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100 transition-colors flex items-center space-x-1.5 cursor-pointer"
                      title="1 hour turant complete karke test karein"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Fast-Forward 1h</span>
                    </button>
                  )}

                  {/* Main Nourish Button: LOCKED until 1 hour is reached */}
                  {isActiveSlotReady ? (
                    <button
                      type="button"
                      onClick={() => handleQuickNourish(activePineapple.id, nextPendingSlot.slotNumber)}
                      className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/30 cursor-pointer transition-transform active:scale-95 flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Nourish Slot #{nextPendingSlot.slotNumber}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-zinc-400 bg-zinc-200/90 dark:bg-zinc-800/90 border border-zinc-300 dark:border-zinc-700 cursor-not-allowed flex items-center space-x-2"
                      title="1 ghante ka wait mukammal hone ke baad hi active hoga"
                    >
                      <Lock className="w-4 h-4 text-zinc-400" />
                      <span>Locked ({activeSlotTimer.display})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl">
            🌱
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              No Active Plantation Batch Right Now
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1">
              Start a new pineapple lot to begin tracking its 7 sequential 1-hour hydration cycles, worker hisab, and Excel records.
            </p>
          </div>
          <button
            onClick={() => setIsAddPineappleOpen(true)}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-md shadow-emerald-600/20 cursor-pointer inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Plant New Pineapple Batch</span>
          </button>
        </div>
      )}

      {/* 3. CORE BUSINESS STATISTICS CARDS (SIMPLE & EASY TO UNDERSTAND) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Overall Business Statistics
          </h3>
          <span className="text-xs text-zinc-400">Live updated</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Total Batches */}
          <div
            onClick={() => setCurrentTab('plantations')}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Batches</span>
              <Sprout className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {plantationStats.totalPineapples}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
              {plantationStats.activeCount} Active • {plantationStats.completedCount} Done
            </span>
          </div>

          {/* Card 2: Active Batch Status */}
          <div
            onClick={() => setCurrentTab('plantations')}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Current Stage</span>
              <Clock className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
              {nextPendingSlot ? `Slot #${nextPendingSlot.slotNumber}` : completedPineapples.length > 0 ? '7/7 Done' : '0/7'}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block truncate">
              {nextPendingSlot ? (isActiveSlotReady ? 'Ready to nourish' : '1h wait running') : 'No pending slot'}
            </span>
          </div>

          {/* Card 3: Total Business Expense */}
          <div
            onClick={() => setCurrentTab('ledger')}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Spent</span>
              <TrendingUp className="w-4 h-4 text-teal-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 truncate">
              {formatCurrency(plantationStats.totalSpent, settings.currency)}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
              Plants + Nourishments
            </span>
          </div>

          {/* Card 4: Paid to Workers */}
          <div
            onClick={() => setCurrentTab('workers')}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-800 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Paid to Workers</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 truncate">
              {formatCurrency(plantationStats.totalPaidWorkers, settings.currency)}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block truncate">
              {plantationStats.totalPaidWorkers === 0 ? 'No payments disbursed' : 'Disbursed to labor'}
            </span>
          </div>

          {/* Card 5: Pending Labor Balance */}
          <div
            onClick={() => setCurrentTab('workers')}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Labor Balance</span>
              <Users className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">
              {formatCurrency(plantationStats.pendingBalance, settings.currency)}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block truncate">
              {plantationStats.pendingBalance === 0 ? 'All cleared • 0 pending' : 'Remaining hisab due'}
            </span>
          </div>

          {/* Card 6: Excel & Cloud Sync */}
          <div
            onClick={() => setCurrentTab('excel')}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Excel Sync</span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">
              {settings.sheetSyncUrl ? 'Linked & Live' : 'Ready to Export'}
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block truncate">
              {settings.sheetSyncUrl ? 'Auto-sync active' : 'Click to connect sheet'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. OVERVIEW TABLE OF BATCHES & HOURLY STATUS */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Plantation Batches Overview</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Live status, 1-hour hydration progress, and completion records
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('plantations')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
          >
            <span>View Detailed Slots</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pineapples.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No batches created yet. Click "New Plantation" to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Batch ID & Name</th>
                  <th className="py-3 px-4">Planted By</th>
                  <th className="py-3 px-4">Hydration Progress</th>
                  <th className="py-3 px-4">Current Slot</th>
                  <th className="py-3 px-4">1-Hour Slot Countdown</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {pineapples.map(pineapple => {
                  const pNourishments = nourishments.filter(n => n.pineappleId === pineapple.id);
                  const completedCount = pNourishments.filter(n => n.status === 'done').length;
                  const nextSlot = pNourishments
                    .filter(n => n.status !== 'done')
                    .sort((a, b) => a.slotNumber - b.slotNumber)[0];

                  const planterName = workerMap.get(pineapple.plantedByWorkerId) || 'Worker';

                  let countdownText = 'Done';
                  let statusColor = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
                  let isSlotReady = false;
                  let slotOneHr = null;

                  if (nextSlot) {
                    const diffSec = getRemainingSeconds(nextSlot.dueAt, now);
                    slotOneHr = formatOneHourSlotCountdown(diffSec);
                    isSlotReady = slotOneHr.isReadyForNourish;

                    if (slotOneHr.isOverdue) {
                      countdownText = `OVERDUE (${slotOneHr.display})`;
                      statusColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 font-bold';
                    } else if (isSlotReady) {
                      countdownText = `READY (${slotOneHr.display})`;
                      statusColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 font-bold';
                    } else {
                      countdownText = `Wait: ${slotOneHr.display}`;
                      statusColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 font-medium';
                    }
                  }

                  return (
                    <tr
                      key={pineapple.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {pineapple.id}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {pineapple.name}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                        {planterName}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold">
                            {completedCount}/{pineapple.totalNourishmentsRequired}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              pineapple.status === 'completed'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                            }`}
                          >
                            {pineapple.status === 'completed' ? 'Fully Nurtured' : 'Active'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {nextSlot ? (
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            Slot #{nextSlot.slotNumber}
                          </span>
                        ) : (
                          <span className="text-zinc-400">All 7 Complete</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-xl font-mono text-xs ${statusColor}`}>
                          {countdownText}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {nextSlot && (
                            isSlotReady ? (
                              <button
                                onClick={() => handleQuickNourish(pineapple.id, nextSlot.slotNumber)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                              >
                                Nourish #{nextSlot.slotNumber}
                              </button>
                            ) : (
                              <span
                                className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-mono text-[11px] flex items-center space-x-1"
                                title="1-hour cycle pura hone ke baad hi active hoga"
                              >
                                <Lock className="w-3 h-3 text-zinc-400" />
                                <span>{slotOneHr?.display}</span>
                              </span>
                            )
                          )}
                          <button
                            onClick={() => setSelectedPineappleId(pineapple.id)}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                            title="View Full Schedule"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. WORKER LABOR HISAB SUMMARY STRIP */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Workers Labor Hisab (Mazdooron Ka Hisab)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Worker task logs & disbursements • No pending balance due (All Clear)
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentTab('workers')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>Full Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {workerHisabSummaries.map(h => (
            <div
              key={h.worker.id}
              className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{h.worker.name}</h4>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 space-x-2">
                  <span>{h.plantingsCount} plants</span>
                  <span>•</span>
                  <span>{h.nourishmentsCount} nourishes</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                  {h.pendingBalance === 0 ? 'Clear (0 Due)' : `${formatCurrency(h.pendingBalance, settings.currency)} Due`}
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  Paid {formatCurrency(h.totalPaid, settings.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. SIMPLE SYSTEM RULES EXPLAINER (EASY TO UNDERSTAND) */}
      <div className="rounded-3xl bg-zinc-100/80 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/50 p-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
          How This System Operates (Karobari Qawaneen)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-zinc-900 dark:text-zinc-100">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>1. Strict 1-Hour Wait</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Har nourish slot mein theek 1 ghante ka wait hota hai. Jab tak 1 hour pura na ho, agla slot open nahi ho sakta.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-zinc-900 dark:text-zinc-100">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>2. 10-Minute Confirmation</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              1 hour complete hote hi confirmation popup open hota hai. Agar 10 min mein confirm na ho ya "No" karein, to timer reset ho jata hai.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-zinc-900 dark:text-zinc-100">
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              <span>3. Live Excel / Sheet Sync</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Tamam records Excel workbook mein export kiye jaa sakte hain aur Google Sheet Webhook link ke zariye live sync hote hain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
