import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatCountdown, formatDateTime } from '../utils/dateUtils';
import { Clock, AlertTriangle, Check, RotateCcw, X, User } from 'lucide-react';

export const SlotConfirmationPopup: React.FC = () => {
  const {
    activePineapple,
    nourishments,
    workers,
    settings,
    now,
    markNourishmentDone,
    skipAndResetSlot,
    resetSlotOneHour,
    setIsAddWorkerOpen,
  } = useApp();

  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [isConfirmingDone, setIsConfirmingDone] = useState(false);
  const [error, setError] = useState('');

  // Find the single current active slot
  const activeSlots = activePineapple
    ? nourishments
        .filter(n => n.pineappleId === activePineapple.id)
        .sort((a, b) => a.slotNumber - b.slotNumber)
    : [];

  const currentSlot = activeSlots.find(s => s.status !== 'done' && s.status !== 'skipped');

  // Check if slot due time is finished
  const dueTimeMs = currentSlot ? new Date(currentSlot.dueAt).getTime() : 0;
  const isTimeFinished = currentSlot && !isNaN(dueTimeMs) && now.getTime() >= dueTimeMs;

  // 10 minutes confirmation window (600,000 ms)
  const CONFIRMATION_WINDOW_MS = 10 * 60 * 1000;
  const elapsedSinceDueMs = isTimeFinished ? now.getTime() - dueTimeMs : 0;
  const remainingWindowMs = CONFIRMATION_WINDOW_MS - elapsedSinceDueMs;
  const remainingSeconds = Math.max(0, Math.floor(remainingWindowMs / 1000));

  // Auto-select first worker if not selected
  useEffect(() => {
    if (workers.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(workers[0].id);
    }
  }, [workers, selectedWorkerId]);

  // AUTO-RESET 1-HOUR TIMER when 10 minutes expire without user confirmation
  useEffect(() => {
    if (isTimeFinished && remainingSeconds <= 0 && currentSlot) {
      resetSlotOneHour(currentSlot.pineappleId, currentSlot.slotNumber);
    }
  }, [isTimeFinished, remainingSeconds, currentSlot, resetSlotOneHour]);

  // Don't show if not time finished or 10 min window expired
  if (!activePineapple || !currentSlot || !isTimeFinished || remainingSeconds <= 0) {
    return null;
  }

  // Format 10-minute countdown (e.g. 09m 42s)
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleConfirmYes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId) {
      setError('Baraye meharbani person / worker select karein.');
      return;
    }

    markNourishmentDone(
      currentSlot.pineappleId,
      currentSlot.slotNumber,
      selectedWorkerId,
      new Date().toISOString(),
      settings.nourishCost
    );
    setIsConfirmingDone(false);
    setError('');
  };

  const handleConfirmNo = () => {
    // User selected "No" -> time resets for 1 full hour as requested!
    resetSlotOneHour(currentSlot.pineappleId, currentSlot.slotNumber);
    setIsConfirmingDone(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border-2 border-amber-400 dark:border-amber-500 overflow-hidden">
        {/* Urgent Header */}
        <div className="px-5 py-3.5 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            <div>
              <h3 className="font-bold text-sm">Nourish Time Complete!</h3>
              <p className="text-[11px] text-amber-100">
                Slot #{currentSlot.slotNumber} of {activePineapple.totalNourishmentsRequired} ({activePineapple.id})
              </p>
            </div>
          </div>

          {/* 10 Min Timer in Header */}
          <div className="px-2.5 py-1 bg-black/25 rounded-lg text-xs font-mono font-bold tracking-wider">
            {timerDisplay}
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Notice box */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-1 text-amber-950 dark:text-amber-100">
            <div className="flex items-center justify-between font-semibold">
              <span>Is ghante ka waqt pura ho chuka hai.</span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                {timerDisplay}
              </span>
            </div>
            <p className="text-[11px] opacity-85">
              Agar 10 minutes mein confirm na kiya gaya, ya aap "No" dabayein, to timer automatically agle ghante ke liye reset ho jaye ga.
            </p>
          </div>

          {error && (
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg text-[11px]">
              {error}
            </div>
          )}

          {!isConfirmingDone ? (
            /* Choice Screen: Did you nourish? Yes or No? */
            <div className="space-y-3">
              <p className="text-center font-bold text-sm text-zinc-900 dark:text-zinc-100 py-1">
                Kya aapne Slot #{currentSlot.slotNumber} nourish kar liya hai?
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* NO / RESET BUTTON */}
                <button
                  type="button"
                  onClick={handleConfirmNo}
                  className="px-3 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Nahi (Reset Time)</span>
                </button>

                {/* YES BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsConfirmingDone(true)}
                  className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Haan, Nourish Kiya</span>
                </button>
              </div>
            </div>
          ) : (
            /* Worker Select Form (Amount is fixed, no rewriting needed!) */
            <form onSubmit={handleConfirmYes} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Nourish Karne Wale Person Ka Naam *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddWorkerOpen(true)}
                    className="text-emerald-600 hover:underline text-[11px]"
                  >
                    + Naya Worker
                  </button>
                </div>
                <select
                  value={selectedWorkerId}
                  required
                  onChange={e => setSelectedWorkerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-zinc-100"
                >
                  <option value="">-- Person Select Karein --</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.phone ? `(${w.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fixed Rate Note */}
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 flex justify-between text-[11px]">
                <span>Fixed Rate:</span>
                <strong className="text-zinc-900 dark:text-zinc-100 font-mono">
                  {formatCurrency(settings.nourishCost, settings.currency)}
                </strong>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDone(false)}
                  className="px-3 py-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-xs"
                >
                  ← Wapis
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Confirm Nourish #{currentSlot.slotNumber}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
