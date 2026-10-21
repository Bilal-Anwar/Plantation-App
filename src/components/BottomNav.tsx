import React from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { LayoutDashboard, Sprout, Users, BookOpen, FileSpreadsheet, Settings, Crown } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, plantationStats, isSuperAdmin } = useApp();

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    {
      id: 'plantations',
      label: 'Batches',
      icon: Sprout,
      badge: plantationStats.overdueCount > 0 ? plantationStats.overdueCount : undefined,
    },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'ledger', label: 'Records', icon: BookOpen },
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
    ...(isSuperAdmin ? [{ id: 'admins' as TabType, label: 'Admins', icon: Crown }] : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
      <div className={`grid ${isSuperAdmin ? 'grid-cols-7' : 'grid-cols-6'} h-14`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isCrown = tab.id === 'admins';

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`relative flex flex-col items-center justify-center space-y-0.5 cursor-pointer transition-colors ${
                isActive
                  ? isCrown
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : isCrown
                  ? 'text-amber-500/80 hover:text-amber-600'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                {tab.badge ? (
                  <span className="absolute -top-1 -right-2 px-1 bg-rose-600 text-white text-[9px] font-bold rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[9px] sm:text-[10px] truncate max-w-full px-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
