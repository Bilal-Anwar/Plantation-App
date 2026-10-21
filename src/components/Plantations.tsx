import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime, getRemainingSeconds, formatCountdown, formatCurrency, formatOneHourSlotCountdown } from '../utils/dateUtils';
import { Sprout, CheckCircle2, Clock, Plus, AlertCircle, ChevronDown, ChevronUp, Lock, RotateCcw, Zap } from 'lucide-react';

export const Plantations: React.FC = () => {
  const {
    pineapples,
    nourishments,
    workers,
    settings,
    now,
    hasActiveBatch,
    activePineapple,
    setIsAddPineappleOpen,
    setSelectedPineappleId,
    setNourishTarget,
    setIsNourishModalOpen,
    resetSlotOneHour,
    fastForwardSlotTimer,
  } = useApp();

  const [showCompleted, setShowCompleted] = React.useState(false);

  const workerMap = new Map(workers.map(w => [w.id, w.name]));

  // Completed pineapples
  const completedPineapples = pineapples.filter(p => p.status === 'completed');

  // If there is an active pineapple, get its 7 slots
  const activeSlots = activePineapple
    ? nourishments
        .filter(n => n.pineappleId === activePineapple.id)
        .sort((a, b) => a.slotNumber - b.slotNumber)
    : [];

  const completedCount = activeSlots.filter(s => s.status === 'done').length;
  const nextPendingSlot = activeSlots.find(s => s.status !== 'done' && s.status !== 'skipped');

  // 1-Hour Slot Timer: Slot only unlocks after 1 full hour has elapsed
  const slotTimer = nextPendingSlot
    ? formatOneHourSlotCountdown(getRemainingSeconds(nextPendingSlot.dueAt, now))
    : null;

  const isSlotReady = slotTimer?.isReadyForNourish ?? false;
  const isOverdue = slotTimer?.isOverdue ?? false;

  const handleOpenNourish = (slotNumber: number) => {
    if (!activePineapple) return;
    setNourishTarget({
      pineappleId: activePineapple.id,
      slotNumber,
    });
    setIsNourishModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 1. ACTIVE PLANTATION CARD (CENTRAL FOCUS) */}
      {activePineapple ? (
        <div className="bg-white dark:bg-zinc-900 border-2 border-emerald-500/80 dark:border-emerald-600/70 rounded-2xl p-5 shadow-sm space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {activePineapple.id}
                </span>
                <span className="text-zinc-400">•</span>
                <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {activePineapple.name}
                </h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Planted by: <strong className="text-zinc-700 dark:text-zinc-300">{workerMap.get(activePineapple.plantedByWorkerId) || 'Worker'}</strong> • {formatDateTime(activePineapple.plantedAt, settings.timezone)}
              </p>
            </div>

            {/* Status / Phase Badge */}
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 flex items-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Phase: Nourishing ({completedCount}/7)</span>
              </span>
            </div>
          </div>

          {/* HOURLY NOURISHMENT TIME INDICATOR (STRICT 1-HOUR CYCLE) */}
          {nextPendingSlot && slotTimer && (
            <div
              className={`p-4 rounded-xl border transition-all ${
                isOverdue
                  ? 'border-rose-300 bg-rose-50/80 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100'
                  : isSlotReady
                  ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
                  : 'border-amber-200 bg-amber-50/50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-sm">
                      {isOverdue
                        ? `🚨 Slot #${nextPendingSlot.slotNumber}: Ab Nourish Ka Waqt Hai! (Overdue)`
                        : isSlotReady
                        ? `⏰ Slot #${nextPendingSlot.slotNumber}: 1 Hour Pura! Ab Nourish Ka Waqt Hai`
                        : `⏳ Slot #${nextPendingSlot.slotNumber}: 1-Hour Timer Running (Active in ${slotTimer.display})`}
                    </span>
                  </div>

                  {/* 1-Hour Progress Bar */}
                  <div className="w-full max-w-md bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSlotReady ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${slotTimer.percentElapsed}%` }}
                    />
                  </div>

                  <div className="text-xs opacity-90 flex flex-wrap items-center gap-x-2">
                    <span>Total Cycle: <strong>1 Hour (60:00)</strong></span>
                    <span>•</span>
                    <span>Time Left: <strong className="font-mono text-sm">{slotTimer.display}</strong> ({slotTimer.text})</span>
                    <span>•</span>
                    <span>Due: <strong>{formatDateTime(nextPendingSlot.dueAt, settings.timezone)}</strong></span>
                  </div>

                  {!isSlotReady && (
                    <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 italic pt-0.5">
                      ℹ️ Har nourish mein 1 hour ke baad hi agla slot active hota hai. Jab tak 1 hour mukammal ya reset na ho, next slot par nahi jaa sakte.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  {/* Reset 1-Hour Timer Button */}
                  <button
                    type="button"
                    onClick={() => resetSlotOneHour(activePineapple.id, nextPendingSlot.slotNumber)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                    title="1-Hour timer ko dubara 60:00 par reset karein"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Reset 1-Hr Timer</span>
                  </button>



                  {/* Main Nourish Button: LOCKED if 1 hour is not yet done! */}
                  {isSlotReady ? (
                    <button
                      type="button"
                      onClick={() => handleOpenNourish(nextPendingSlot.slotNumber)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer transition-transform active:scale-95 flex items-center justify-center space-x-1.5 ${
                        isOverdue
                          ? 'bg-rose-600 hover:bg-rose-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <span>Nourish Slot #{nextPendingSlot.slotNumber}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-300/80 dark:border-zinc-700 cursor-not-allowed flex items-center justify-center space-x-1.5"
                      title="1 hour pura hone tak next slot locked hai"
                    >
                      <Lock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Locked ({slotTimer.display} Baqi)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 7 NOURISHMENT SLOTS ROADMAP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                7 Hourly Slots Progress:
              </span>
              <span className="text-zinc-500 font-medium">
                {completedCount} of 7 Completed
              </span>
            </div>

            <div className="space-y-1.5">
              {activeSlots.map(slot => {
                const isDone = slot.status === 'done';
                const worker = workers.find(w => w.id === slot.workerId);
                const diff = getRemainingSeconds(slot.dueAt, now);
                const cd = formatCountdown(diff);
                const oneHrCd = formatOneHourSlotCountdown(diff);
                const isSkipped = slot.status === 'skipped';
                const isCurrentNext = nextPendingSlot?.slotNumber === slot.slotNumber;
                const isLocked = !isDone && !isSkipped && !isCurrentNext && slot.slotNumber > (nextPendingSlot?.slotNumber || 0);

                return (
                  <div
                    key={slot.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                      isDone
                        ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50'
                        : isSkipped
                        ? 'bg-zinc-100/70 border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-800 text-zinc-400'
                        : isCurrentNext && isSlotReady
                        ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 font-medium'
                        : isCurrentNext
                        ? 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800 font-medium'
                        : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isSkipped
                            ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                            : isCurrentNext && oneHrCd.isOverdue
                            ? 'bg-rose-600 text-white'
                            : isCurrentNext && isSlotReady
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : isCurrentNext
                            ? 'bg-amber-500 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        {isDone ? '✓' : isSkipped ? '—' : slot.slotNumber}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${isLocked ? 'text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                            Slot #{slot.slotNumber}
                          </span>
                          <span className="text-zinc-400 text-[11px]">
                            • {formatDateTime(slot.dueAt, settings.timezone)}
                          </span>
                        </div>
                        {isDone && (
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            Nourished by <strong>{worker?.name || 'Worker'}</strong> at {formatDateTime(slot.doneAt, settings.timezone)} ({formatCurrency(slot.cost, settings.currency)})
                          </p>
                        )}
                        {isSkipped && (
                          <p className="text-[11px] text-zinc-500 italic">
                            Time finish par confirm nahi kiya gaya. Timer reset ho kar agle ghante shift ho gaya.
                          </p>
                        )}
                        {!isDone && !isSkipped && isCurrentNext && (
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                            1-Hour Cycle: <strong className="font-mono text-zinc-900 dark:text-zinc-100">{oneHrCd.display}</strong> ({isSlotReady ? 'Ab Nourish Ka Waqt Hai!' : `${oneHrCd.text} baqi - Next slot locked`})
                          </p>
                        )}
                        {isLocked && (
                          <p className="text-[11px] text-zinc-400">
                            🔒 Pichla Slot #{slot.slotNumber - 1} mukammal hone ke 1 hour baad active hoga.
                          </p>
                        )}
                      </div>
                    </div>

                    {isDone ? (
                      <span className="text-emerald-600 font-semibold text-xs pr-1">Done</span>
                    ) : isSkipped ? (
                      <span className="text-zinc-400 text-[11px] font-medium pr-1">Reset / Skipped</span>
                    ) : isCurrentNext ? (
                      isSlotReady ? (
                        <button
                          type="button"
                          onClick={() => handleOpenNourish(slot.slotNumber)}
                          className="px-3 py-1 rounded-lg text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-2xs"
                        >
                          Nourish
                        </button>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium flex items-center space-x-1">
                          <Lock className="w-3 h-3 text-zinc-400" />
                          <span>{oneHrCd.display}</span>
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-medium flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-zinc-400" />
                        <span>Locked</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SINGLE ACTIVE BATCH RESTRICTION NOTICE */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-800 dark:text-zinc-200">Rule: </strong>
              <span>
                Jab tak is plantation batch ke tamam 7 nourishments mukammal nahi ho jate, dosra batch start nahi ho sakta. Tamam 7 nourishments ke baad yeh automatically "Completed" ho jaye ga aur agla batch create ho sakega.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* NO ACTIVE BATCH STATE */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 text-2xl flex items-center justify-center mx-auto">
            🌱
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Koi Active Plantation Batch Nahi Chal Raha
            </h2>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Har batch mein 7 hourly nourishments hon ge. Naya batch shuru karne ke liye niche button dabayein.
            </p>
          </div>

          <button
            onClick={() => setIsAddPineappleOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Plantation (7 Slots)</span>
          </button>
        </div>
      )}

      {/* 2. COMPLETED BATCHES (ARCHIVE) */}
      {completedPineapples.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Completed Batches ({completedPineapples.length})</span>
            </div>
            {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showCompleted && (
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              {completedPineapples.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPineappleId(p.id)}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between text-xs cursor-pointer hover:border-zinc-300"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{p.id}</span>
                      <span className="text-zinc-400">•</span>
                      <span>{p.name}</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      Planted: {formatDateTime(p.plantedAt, settings.timezone)} • 7/7 Nourished
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Harvest Complete
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
