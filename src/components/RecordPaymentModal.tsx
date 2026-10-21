import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, toInputDateTimeString } from '../utils/dateUtils';
import { X } from 'lucide-react';

export const RecordPaymentModal: React.FC = () => {
  const {
    isRecordPaymentOpen,
    setIsRecordPaymentOpen,
    recordPaymentWorkerId,
    setRecordPaymentWorkerId,
    workers,
    workerHisabSummaries,
    settings,
    recordPayment,
  } = useApp();

  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const worker = workers.find(w => w.id === recordPaymentWorkerId);
  const hisab = workerHisabSummaries.find(h => h.worker.id === recordPaymentWorkerId);

  useEffect(() => {
    if (isRecordPaymentOpen) {
      setDate(toInputDateTimeString(new Date()));
      setNote('');
      setError('');
      if (hisab && hisab.pendingBalance > 0) {
        setAmount(hisab.pendingBalance);
      } else {
        setAmount('');
      }
    }
  }, [isRecordPaymentOpen, hisab]);

  if (!isRecordPaymentOpen || !worker) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!date) {
      setError('Please select date.');
      return;
    }

    recordPayment(worker.id, Number(amount), new Date(date).toISOString(), note);
    setIsRecordPaymentOpen(false);
    setRecordPaymentWorkerId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Pay Worker</h2>
            <p className="text-[11px] text-zinc-500">{worker.name}</p>
          </div>
          <button
            onClick={() => {
              setIsRecordPaymentOpen(false);
              setRecordPaymentWorkerId(null);
            }}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          {error && <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">{error}</div>}

          {hisab && (
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-zinc-600 dark:text-zinc-400 flex justify-between items-center">
              <span>Current Pending Balance:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                {hisab.pendingBalance === 0 ? '0 (All Clear)' : formatCurrency(hisab.pendingBalance, settings.currency)}
              </strong>
            </div>
          )}

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">
              Payment Amount ({settings.currency}) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Date & Time</label>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Payment Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Cash payment"
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setIsRecordPaymentOpen(false);
                setRecordPaymentWorkerId(null);
              }}
              className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
            >
              Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
