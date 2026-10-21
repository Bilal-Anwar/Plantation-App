import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime, formatCurrency } from '../utils/dateUtils';
import { ConfirmModal } from './ConfirmModal';
import { X, Trash2, Edit2, Phone } from 'lucide-react';

export const WorkerDetailModal: React.FC = () => {
  const {
    selectedWorkerId,
    setSelectedWorkerId,
    workers,
    pineapples,
    nourishments,
    payments,
    settings,
    setEditingWorker,
    setIsAddWorkerOpen,
    deleteWorker,
    deletePayment,
    setIsRecordPaymentOpen,
    setRecordPaymentWorkerId,
  } = useApp();

  const [isConfirmDeleteWorkerOpen, setIsConfirmDeleteWorkerOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const worker = workers.find(w => w.id === selectedWorkerId);
  if (!selectedWorkerId || !worker) return null;

  const workerPlantings = pineapples.filter(p => p.plantedByWorkerId === worker.id);
  const workerNourishments = nourishments.filter(n => n.workerId === worker.id && n.status === 'done');
  const workerPayments = payments.filter(p => p.workerId === worker.id);

  const totalPaid = workerPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalTasks = workerPlantings.length + workerNourishments.length;
  const pendingBalance = 0;

  const handleEdit = () => {
    setEditingWorker(worker);
    setIsAddWorkerOpen(true);
  };

  const handleDeleteWorker = () => {
    deleteWorker(worker.id);
    setIsConfirmDeleteWorkerOpen(false);
    setSelectedWorkerId(null);
  };

  const handleRecordPayment = () => {
    setRecordPaymentWorkerId(worker.id);
    setIsRecordPaymentOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden my-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {worker.name}
                </h2>
                {worker.phone && (
                  <span className="text-[11px] text-zinc-500 flex items-center space-x-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{worker.phone}</span>
                  </span>
                )}
              </div>
              {worker.notes && (
                <p className="text-[11px] text-zinc-500 mt-0.5">{worker.notes}</p>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleEdit}
                title="Edit Worker"
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedWorkerId(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Hisab numbers */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
              <div>
                <span className="text-zinc-500 text-[11px] block">Tasks Done</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {totalTasks}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-[11px] block">Paid to Date</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalPaid, settings.currency)}
                </span>
              </div>
              <div>
                <span className="text-emerald-800 dark:text-emerald-300 text-[11px] block font-medium">Pending Due</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(pendingBalance, settings.currency)} (Clear)
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRecordPayment}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
              >
                + Record Payment
              </button>
            </div>

            {/* Task summary */}
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Plantings Done ({workerPlantings.length}):
                </span>
                {workerPlantings.length === 0 ? (
                  <p className="text-zinc-400">None yet.</p>
                ) : (
                  <div className="space-y-1">
                    {workerPlantings.map(p => (
                      <div
                        key={p.id}
                        className="p-2 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex justify-between"
                      >
                        <span className="font-mono font-medium">{p.id} ({p.name})</span>
                        <span className="text-zinc-500">{formatDateTime(p.plantedAt, settings.timezone)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Recent Nourishments ({workerNourishments.length}):
                </span>
                {workerNourishments.length === 0 ? (
                  <p className="text-zinc-400">None yet.</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {workerNourishments.slice(0, 8).map(n => (
                      <div
                        key={n.id}
                        className="p-2 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex justify-between"
                      >
                        <span>{n.pineappleId} (Slot #{n.slotNumber})</span>
                        <span className="text-zinc-500">{formatDateTime(n.doneAt, settings.timezone)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Payments Given ({workerPayments.length}):
                </span>
                {workerPayments.length === 0 ? (
                  <p className="text-zinc-400">No payment records yet.</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {workerPayments.map(pay => (
                      <div
                        key={pay.id}
                        className="p-2 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(pay.amount, settings.currency)}
                          </strong>
                          <span className="text-zinc-400 ml-2">
                            {formatDateTime(pay.date, settings.timezone)}
                          </span>
                          {pay.note && <span className="text-zinc-500 ml-1 italic">({pay.note})</span>}
                        </div>
                        <button
                          onClick={() => setPaymentToDelete(pay.id)}
                          className="text-zinc-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteWorkerOpen(true)}
                className="text-rose-600 hover:text-rose-700 text-xs font-medium flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Worker</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedWorkerId(null)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteWorkerOpen}
        title="Delete Worker?"
        message={`Are you sure you want to delete ${worker.name}?`}
        confirmLabel="Delete"
        isDanger={true}
        onConfirm={handleDeleteWorker}
        onCancel={() => setIsConfirmDeleteWorkerOpen(false)}
      />

      <ConfirmModal
        isOpen={!!paymentToDelete}
        title="Delete Payment Record?"
        message="This will restore the worker's pending balance."
        confirmLabel="Delete"
        isDanger={true}
        onConfirm={() => {
          if (paymentToDelete) {
            deletePayment(paymentToDelete);
            setPaymentToDelete(null);
          }
        }}
        onCancel={() => setPaymentToDelete(null)}
      />
    </>
  );
};
