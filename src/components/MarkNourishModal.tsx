import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime, toInputDateTimeString, getRemainingSeconds, formatCountdown, formatCurrency, formatOneHourSlotCountdown } from '../utils/dateUtils';
import { X, Clock, Check } from 'lucide-react';

export const MarkNourishModal: React.FC = () => {
  const {
    isNourishModalOpen,
    setIsNourishModalOpen,
    nourishTarget,
    setNourishTarget,
    pineapples,
    nourishments,
    workers,
    settings,
    now,
    markNourishmentDone,
    setIsAddWorkerOpen,
  } = useApp();

  const [workerId, setWorkerId] = useState('');
  const [doneDateTime, setDoneDateTime] = useState('');
  const [error, setError] = useState('');

  const pineapple = pineapples.find(p => p.id === nourishTarget?.pineappleId);
  const slotNourishment = nourishments.find(
    n => n.pineappleId === nourishTarget?.pineappleId && n.slotNumber === nourishTarget?.slotNumber
  );

  useEffect(() => {
    if (isNourishModalOpen) {
      setDoneDateTime(toInputDateTimeString(new Date()));
      setError('');
      if (workers.length > 0 && !workerId) {
        setWorkerId(workers[0].id);
      }
    }
  }, [isNourishModalOpen, workers, workerId]);

  if (!isNourishModalOpen || !nourishTarget || !pineapple || !slotNourishment) {
    return null;
  }

  const isAlreadyDone = slotNourishment.status === 'done';

  // Calculate live time left for this slot
  const diffSec = getRemainingSeconds(slotNourishment.dueAt, now);
  const countdown = formatCountdown(diffSec);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyDone) {
      setError('Yeh slot pehle se mukammal hai.');
      return;
    }
    if (!workerId) {
      setError('Baraye meharbani person / worker select karein.');
      return;
    }

    // Automatically applies fixed nourish cost - user doesn't rewrite amount
    markNourishmentDone(
      nourishTarget.pineappleId,
      nourishTarget.slotNumber,
      workerId,
      new Date(doneDateTime).toISOString(),
      settings.nourishCost
    );

    setIsNourishModalOpen(false);
    setNourishTarget(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Simple Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Nourish Slot #{nourishTarget.slotNumber} of {pineapple.totalNourishmentsRequired}
            </h2>
            <p className="text-[11px] text-zinc-500">
              {pineapple.id} ({pineapple.name})
            </p>
          </div>
          <button
            onClick={() => {
              setIsNourishModalOpen(false);
              setNourishTarget(null);
            }}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-2 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Time Left & Due Indicator (1-Hour Cycle) */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-[11px] flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>1-Hour Cycle Due:</span>
              </span>
              <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                {formatDateTime(slotNourishment.dueAt, settings.timezone)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-zinc-500 text-[11px]">Time Left in 1-Hr Cycle:</span>
              <span
                className={`font-mono font-bold text-xs ${
                  countdown.isOverdue
                    ? 'text-rose-600 dark:text-rose-400'
                    : countdown.isDueSoon
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatOneHourSlotCountdown(diffSec).display} ({countdown.isOverdue ? `Overdue` : `${formatOneHourSlotCountdown(diffSec).text}`})
              </span>
            </div>

            {diffSec > 0 && (
              <p className="text-[10px] text-amber-700 dark:text-amber-300 italic pt-0.5">
                ℹ️ 1-hour cycle ke baad agla slot active hota hai.
              </p>
            )}
          </div>

          {/* 1. Person / Worker Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-700 dark:text-zinc-300 font-semibold">
                Nourish Karne Wale Person Ka Naam *
              </label>
              <button
                type="button"
                onClick={() => setIsAddWorkerOpen(true)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer text-[11px]"
              >
                + New Worker
              </button>
            </div>
            <select
              value={workerId}
              required
              disabled={isAlreadyDone}
              onChange={e => setWorkerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-zinc-400"
            >
              <option value="">-- Person Select Karein --</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.phone ? `(${w.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Nourish Time (defaults to now, editable if needed) */}
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-semibold">
              Nourish Time (Waqt)
            </label>
            <input
              type="datetime-local"
              required
              disabled={isAlreadyDone}
              value={doneDateTime}
              onChange={e => setDoneDateTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Fixed Amount (No rewriting needed, automatic) */}
          <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-between text-[11px]">
            <span>Nourishment Amount (Fixed):</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {formatCurrency(settings.nourishCost, settings.currency)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setIsNourishModalOpen(false);
                setNourishTarget(null);
              }}
              className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAlreadyDone}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Nourish</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
