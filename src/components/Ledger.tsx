import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime, formatCurrency } from '../utils/dateUtils';
import { Search } from 'lucide-react';

export const Ledger: React.FC = () => {
  const { ledgerEntries, workers, settings, setSelectedPineappleId } = useApp();

  const [search, setSearch] = useState('');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return ledgerEntries.filter(e => {
      if (workerFilter !== 'all' && e.workerId !== workerFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.pineappleId.toLowerCase().includes(q) ||
          e.workerName.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ledgerEntries, workerFilter, statusFilter, search]);

  const totalCost = filtered
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + e.cost, 0);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search records by ID, worker, or action..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={workerFilter}
            onChange={e => setWorkerFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All Workers</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="text-xs text-zinc-500 flex justify-between px-1">
        <span>{filtered.length} records</span>
        <span>Completed total: <strong className="text-zinc-800 dark:text-zinc-200">{formatCurrency(totalCost, settings.currency)}</strong></span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="py-2.5 px-3">Batch ID</th>
              <th className="py-2.5 px-3">Worker</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Date & Time</th>
              <th className="py-2.5 px-3">Cost</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-zinc-400">
                  No records match.
                </td>
              </tr>
            ) : (
              filtered.map(entry => (
                <tr
                  key={entry.id}
                  onClick={() => setSelectedPineappleId(entry.pineappleId)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {entry.pineappleId}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                    {entry.workerName}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      entry.actionType === 'plant'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-500 font-mono">
                    {formatDateTime(entry.dateTime, settings.timezone)}
                  </td>
                  <td className="py-2.5 px-3 font-medium">
                    {formatCurrency(entry.cost, settings.currency)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                      entry.status === 'completed'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : entry.status === 'overdue'
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-zinc-500'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
