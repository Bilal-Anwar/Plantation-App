import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime, toInputDateTimeString } from '../utils/dateUtils';
import { X } from 'lucide-react';

export const AddPineappleModal: React.FC = () => {
  const {
    isAddPineappleOpen,
    setIsAddPineappleOpen,
    workers,
    settings,
    addPineapple,
    setIsAddWorkerOpen,
    pineapples,
    hasActiveBatch,
  } = useApp();

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [plantDateTime, setPlantDateTime] = useState('');
  const [plantCost, setPlantCost] = useState(settings.plantCost);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAddPineappleOpen) {
      if (hasActiveBatch) {
        setError('Pehle se ek batch chal raha hai. Uske 7 nourishments mukammal hone ke baad agla batch shuru ho sakega.');
      }
      const highestNum = pineapples.reduce((max, p) => {
        const match = p.id.match(/PINE-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 100);
      const nextId = `PINE-${highestNum + 1}`;
      setId(nextId);
      setName(`Lot ${nextId}`);
      setPlantCost(settings.plantCost);
      setPlantDateTime(toInputDateTimeString(new Date()));
      if (workers.length > 0 && !workerId) {
        setWorkerId(workers[0].id);
      }
    }
  }, [isAddPineappleOpen, pineapples, settings.plantCost, workers, workerId, hasActiveBatch]);

  const schedulePreview = useMemo(() => {
    if (!plantDateTime) return [];
    const baseTime = new Date(plantDateTime).getTime();
    if (isNaN(baseTime)) return [];

    const slots: { slot: number; dueIso: string }[] = [];
    const intervalMs = settings.intervalHours * 3600 * 1000;
    for (let i = 1; i <= settings.totalNourishments; i++) {
      slots.push({
        slot: i,
        dueIso: new Date(baseTime + i * intervalMs).toISOString(),
      });
    }
    return slots;
  }, [plantDateTime, settings.intervalHours, settings.totalNourishments]);

  if (!isAddPineappleOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasActiveBatch) {
      setError('Pehle se ek batch chal raha hai. Uske 7 nourishments mukammal karein.');
      return;
    }
    if (!workerId) {
      setError('Please choose a worker.');
      return;
    }
    if (!plantDateTime) {
      setError('Please set the planting date and time.');
      return;
    }

    addPineapple({
      id: id.trim(),
      name: name.trim() || undefined,
      plantedByWorkerId: workerId,
      plantedAt: new Date(plantDateTime).toISOString(),
      plantCost: Number(plantCost) || settings.plantCost,
    });

    setIsAddPineappleOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Simple Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Plant New Pineapple
          </h2>
          <button
            onClick={() => setIsAddPineappleOpen(false)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">
                Batch ID
              </label>
              <input
                type="text"
                required
                value={id}
                onChange={e => setId(e.target.value.toUpperCase())}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">
                Variety / Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Smooth Cayenne"
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-600 dark:text-zinc-400 font-medium">
                Planted By Worker *
              </label>
              <button
                type="button"
                onClick={() => setIsAddWorkerOpen(true)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                + New Worker
              </button>
            </div>
            <select
              value={workerId}
              required
              onChange={e => setWorkerId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
            >
              <option value="">-- Select Worker --</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.phone ? `(${w.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">
                Plant Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={plantDateTime}
                onChange={e => setPlantDateTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">
                Plant Cost ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={plantCost}
                onChange={e => setPlantCost(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Simple preview */}
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-zinc-600 dark:text-zinc-400 text-[11px] space-y-1">
            <div className="font-semibold text-zinc-700 dark:text-zinc-300">
              7 hourly nourishment slots will be scheduled automatically:
            </div>
            <div className="text-zinc-500">
              1 hour interval • ${settings.nourishCost.toLocaleString()} per nourishment • Total: ${((plantCost || 50000) + 7 * settings.nourishCost).toLocaleString()}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsAddPineappleOpen(false)}
              className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={hasActiveBatch}
              className={`px-4 py-1.5 rounded-lg text-white font-semibold transition-colors ${
                hasActiveBatch
                  ? 'bg-zinc-400 dark:bg-zinc-700 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
              }`}
            >
              {hasActiveBatch ? 'Active Batch Already Running' : 'Plant Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
