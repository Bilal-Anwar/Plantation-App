import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/dateUtils';
import { Search, UserPlus, Phone } from 'lucide-react';

export const Workers: React.FC = () => {
  const {
    workers,
    workerHisabSummaries,
    settings,
    setIsAddWorkerOpen,
    setEditingWorker,
    setSelectedWorkerId,
    setIsRecordPaymentOpen,
    setRecordPaymentWorkerId,
  } = useApp();

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return workerHisabSummaries.filter(s => {
      const q = search.toLowerCase();
      return (
        s.worker.name.toLowerCase().includes(q) ||
        (s.worker.phone && s.worker.phone.toLowerCase().includes(q))
      );
    });
  }, [workerHisabSummaries, search]);

  const totalPending = useMemo(
    () => workerHisabSummaries.reduce((sum, s) => sum + s.pendingBalance, 0),
    [workerHisabSummaries]
  );
  const totalPaid = useMemo(
    () => workerHisabSummaries.reduce((sum, s) => sum + s.totalPaid, 0),
    [workerHisabSummaries]
  );

  const handlePay = (e: React.MouseEvent, workerId: string) => {
    e.stopPropagation();
    setRecordPaymentWorkerId(workerId);
    setIsRecordPaymentOpen(true);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Simple Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center">
          <span className="text-zinc-500 text-xs">Total Paid to Workers</span>
          <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {formatCurrency(totalPaid, settings.currency)}
          </div>
        </div>
        <div className={`border rounded-xl p-3 text-center transition-colors ${
          totalPending === 0
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40'
        }`}>
          <span className={`text-xs font-medium ${
            totalPending === 0 ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'
          }`}>
            Pending Hisab (To Pay)
          </span>
          <div className={`text-lg font-bold ${
            totalPending === 0 ? 'text-emerald-900 dark:text-emerald-200' : 'text-amber-900 dark:text-amber-200'
          }`}>
            {totalPending === 0 ? `${formatCurrency(0, settings.currency)} (All Clear)` : formatCurrency(totalPending, settings.currency)}
          </div>
        </div>
      </div>

      {/* Action & Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search worker by name or phone..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-400"
          />
        </div>

        <button
          onClick={() => {
            setEditingWorker(null);
            setIsAddWorkerOpen(true);
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Worker</span>
        </button>
      </div>

      {/* Workers List */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-xs">
            No workers found.
          </div>
        ) : (
          filtered.map(item => {
            const { worker, plantingsCount, nourishmentsCount, totalEarnings, totalPaid, pendingBalance } = item;

            return (
              <div
                key={worker.id}
                onClick={() => setSelectedWorkerId(worker.id)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Worker profile */}
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        {worker.name}
                      </h3>
                      {worker.phone && (
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center space-x-1">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{worker.phone}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {plantingsCount} planted • {nourishmentsCount} nourished
                    </p>
                  </div>

                  {/* Right: Money & Pay Button */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <div className="text-left sm:text-right text-xs">
                      <div className="text-[11px] text-zinc-500">
                        Paid: {formatCurrency(totalPaid, settings.currency)}
                      </div>
                      <div className={`font-bold ${pendingBalance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-300'}`}>
                        {pendingBalance === 0 ? '0 Pending (All Clear)' : `Balance Due: ${formatCurrency(pendingBalance, settings.currency)}`}
                      </div>
                    </div>

                    <button
                      onClick={e => handlePay(e, worker.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 cursor-pointer transition-colors"
                    >
                      Pay
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
