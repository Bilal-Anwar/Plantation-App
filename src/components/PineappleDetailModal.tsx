import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime, getRemainingSeconds, formatCountdown, formatCurrency } from '../utils/dateUtils';
import { ConfirmModal } from './ConfirmModal';
import { X, Trash2, CheckCircle2 } from 'lucide-react';

export const PineappleDetailModal: React.FC = () => {
  const {
    selectedPineappleId,
    setSelectedPineappleId,
    pineapples,
    nourishments,
    workers,
    settings,
    now,
    setNourishTarget,
    setIsNourishModalOpen,
    deletePineapple,
  } = useApp();

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const pineapple = pineapples.find(p => p.id === selectedPineappleId);
  if (!selectedPineappleId || !pineapple) return null;

  const planter = workers.find(w => w.id === pineapple.plantedByWorkerId);
  const pSlots = nourishments
    .filter(n => n.pineappleId === pineapple.id)
    .sort((a, b) => a.slotNumber - b.slotNumber);

  const completedSlots = pSlots.filter(n => n.status === 'done');
  const totalCost = pineapple.plantCost + completedSlots.reduce((sum, n) => sum + n.cost, 0);

  const handleOpenNourish = (slotNumber: number) => {
    setNourishTarget({ pineappleId: pineapple.id, slotNumber });
    setIsNourishModalOpen(true);
  };

  const handleDelete = () => {
    deletePineapple(pineapple.id);
    setIsConfirmDeleteOpen(false);
    setSelectedPineappleId(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden my-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {pineapple.id}
                </span>
                <span className="text-zinc-400">•</span>
                <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                  {pineapple.name}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Planted by {planter?.name || 'Worker'} • {formatDateTime(pineapple.plantedAt, settings.timezone)}
              </p>
            </div>
            <button
              onClick={() => setSelectedPineappleId(null)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Summary strip */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-zinc-700 dark:text-zinc-300">
              <div>
                <span className="text-zinc-500 block text-[11px]">Progress</span>
                <span className="font-bold">
                  {completedSlots.length} of {pineapple.totalNourishmentsRequired} Completed
                </span>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 block text-[11px]">Total Cost</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalCost, settings.currency)}
                </span>
              </div>
            </div>

            {/* 7 Slots List */}
            <div className="space-y-1.5">
              <span className="font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                Hourly Nourishment Schedule:
              </span>
              {pSlots.map(slot => {
                const isDone = slot.status === 'done';
                const isSkipped = slot.status === 'skipped';
                const nextPending = pSlots.find(s => s.status !== 'done' && s.status !== 'skipped');
                const isCurrentNext = nextPending?.slotNumber === slot.slotNumber;
                const isLocked = !isDone && !isSkipped && !isCurrentNext && slot.slotNumber > (nextPending?.slotNumber || 0);

                const worker = workers.find(w => w.id === slot.workerId);
                const diffSec = getRemainingSeconds(slot.dueAt, now);
                const countdown = formatCountdown(diffSec);

                return (
                  <div
                    key={slot.id}
                    className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                      isDone
                        ? 'border-emerald-200 dark:border-emerald-900 bg-white dark:bg-zinc-900'
                        : isSkipped
                        ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-400'
                        : isCurrentNext
                        ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-bold ${isLocked ? 'text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          Slot #{slot.slotNumber}
                        </span>
                        {isDone ? (
                          <span className="text-emerald-600 font-semibold text-[11px]">
                            • Done by {worker?.name || 'Worker'}
                          </span>
                        ) : isSkipped ? (
                          <span className="text-zinc-400 text-[11px]">
                            • Reset / Skipped
                          </span>
                        ) : isCurrentNext && countdown.isOverdue ? (
                          <span className="text-rose-600 font-semibold text-[11px]">
                            • Overdue ({countdown.text})
                          </span>
                        ) : isCurrentNext ? (
                          <span className="text-zinc-500 text-[11px]">
                            • Due in {countdown.text}
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">
                            • Locked
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {isDone
                          ? `Completed: ${formatDateTime(slot.doneAt, settings.timezone)}`
                          : `Scheduled: ${formatDateTime(slot.dueAt, settings.timezone)}`}
                      </span>
                    </div>

                    {isDone ? (
                      <span className="text-emerald-600 text-xs font-semibold">✓</span>
                    ) : isSkipped ? (
                      <span className="text-zinc-400 text-xs font-medium">Reset</span>
                    ) : isCurrentNext ? (
                      <button
                        onClick={() => handleOpenNourish(slot.slotNumber)}
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold cursor-pointer shrink-0"
                      >
                        Nourish
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-400 font-medium">
                        🔒 Locked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="text-rose-600 hover:text-rose-700 text-xs font-medium flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Batch</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPineappleId(null)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Pineapple Batch?"
        message={`Are you sure you want to delete ${pineapple.id}? All nourishment history for this batch will be removed.`}
        confirmLabel="Delete"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </>
  );
};
