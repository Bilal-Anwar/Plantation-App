import React from 'react';
import { useApp } from '../context/AppContext';

export const AlertBanner: React.FC = () => {
  const { urgentNourishments, setNourishTarget, setIsNourishModalOpen } = useApp();

  if (urgentNourishments.length === 0) return null;

  const topUrgent = urgentNourishments[0];
  const isOverdue = topUrgent.isOverdue;

  return (
    <div
      className={`border-b text-xs px-4 py-2 ${
        isOverdue
          ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900'
          : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900'
      }`}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 truncate">
          <span className="font-bold shrink-0">
            {isOverdue ? '🚨 Ab Nourish Ka Waqt Hai! (Overdue):' : '⏰ Ab Nourish Ka Waqt Hai! (Due Soon):'}
          </span>
          <span className="truncate">
            <strong className="font-semibold">{topUrgent.pineapple.id}</strong> • Slot #{topUrgent.nourishment.slotNumber} • Time Left: {topUrgent.countdownText}
          </span>
        </div>

        <button
          onClick={() => {
            setNourishTarget({
              pineappleId: topUrgent.pineapple.id,
              slotNumber: topUrgent.nourishment.slotNumber,
            });
            setIsNourishModalOpen(true);
          }}
          className={`shrink-0 px-2.5 py-1 rounded font-semibold text-[11px] text-white cursor-pointer ${
            isOverdue ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          Nourish Now
        </button>
      </div>
    </div>
  );
};
