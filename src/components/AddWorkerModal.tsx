import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';

export const AddWorkerModal: React.FC = () => {
  const {
    isAddWorkerOpen,
    setIsAddWorkerOpen,
    editingWorker,
    setEditingWorker,
    addWorker,
    updateWorker,
  } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingWorker) {
      setName(editingWorker.name);
      setPhone(editingWorker.phone || '');
      setNotes(editingWorker.notes || '');
    } else {
      setName('');
      setPhone('');
      setNotes('');
    }
    setError('');
  }, [editingWorker, isAddWorkerOpen]);

  if (!isAddWorkerOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide worker name.');
      return;
    }

    if (editingWorker) {
      updateWorker({
        ...editingWorker,
        name: name.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addWorker({
        name: name.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    setIsAddWorkerOpen(false);
    setEditingWorker(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {editingWorker ? 'Edit Worker' : 'Add New Worker'}
          </h2>
          <button
            onClick={() => {
              setIsAddWorkerOpen(false);
              setEditingWorker(null);
            }}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          {error && <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">{error}</div>}

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tariq Mehmood"
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Phone (Optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 0300-1234567"
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Lead Planter"
              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setIsAddWorkerOpen(false);
                setEditingWorker(null);
              }}
              className="px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
            >
              Save Worker
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
