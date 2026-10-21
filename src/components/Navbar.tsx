import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { Plus, Crown, ShieldCheck, LogOut, KeyRound, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    settings,
    setIsAddPineappleOpen,
    plantationStats,
    hasActiveBatch,
    showToast,
    currentUser,
    isSuperAdmin,
    logout,
    changePassword,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: TabType; label: string; badge?: number; isCrown?: boolean; superAdminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    {
      id: 'plantations',
      label: 'Batches',
      badge: plantationStats.overdueCount > 0 ? plantationStats.overdueCount : undefined,
    },
    { id: 'workers', label: 'Workers' },
    { id: 'ledger', label: 'Records' },
    { id: 'excel', label: 'Excel' },
    { id: 'settings', label: 'Settings' },
    { id: 'admins', label: 'Admins', isCrown: true, superAdminOnly: true },
  ];

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newPassword || newPassword.length < 4) {
      showToast('Password kam az kam 4 characters ka ho.', 'error');
      return;
    }
    const res = changePassword(currentUser.id, newPassword);
    if (res.success) {
      setIsChangePassOpen(false);
      setNewPassword('');
    }
  };

  // Extract clean short name for compact display (e.g. "Bilal")
  const displayName = currentUser ? currentUser.name.split(' ')[0] : 'User';

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Left: Brand Logo & Desktop Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Brand Logo */}
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2 text-left cursor-pointer group shrink-0"
              title="Dashboard par jayein"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-500/10 border border-amber-500/30 flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition-transform">
                🍍
              </div>
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors hidden sm:inline truncate max-w-[150px]">
                {settings.businessName ? settings.businessName.replace(' Plantation', '') : 'Golden Crown'}
              </span>
            </button>

            {/* Vertical Divider */}
            <div className="hidden md:block h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

            {/* Streamlined Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map(item => {
                if (item.superAdminOnly && !isSuperAdmin) return null;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isActive
                        ? item.isCrown
                          ? 'bg-amber-100/90 text-amber-950 dark:bg-amber-950/70 dark:text-amber-200 font-semibold shadow-xs'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                        : item.isCrown
                        ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    {item.isCrown && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions & User Menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Active Batch Status or Quick Plant Action */}
            {hasActiveBatch ? (
              <div
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                title="Batch active hai"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Batch</span>
              </div>
            ) : (
              <button
                onClick={() => setIsAddPineappleOpen(true)}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Plant New</span>
              </button>
            )}

            {/* Compact Streamlined User Menu */}
            {currentUser && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer hover:shadow-xs active:scale-98 ${
                    isSuperAdmin
                      ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200'
                  }`}
                  title={`${currentUser.name} (${currentUser.role})`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isSuperAdmin
                        ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-xs'
                        : 'bg-zinc-700 text-white'
                    }`}
                  >
                    {isSuperAdmin ? (
                      <Crown className="w-3.5 h-3.5" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="font-semibold text-xs hidden sm:inline max-w-[80px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User info banner */}
                    <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                        @{currentUser.username}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                            isSuperAdmin
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {isSuperAdmin ? <Crown className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                          {isSuperAdmin ? 'Super Admin' : 'Admin'}
                        </span>
                      </div>
                    </div>

                    {/* Super Admin Control Quick Link */}
                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          setCurrentTab('admins');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Crown className="w-4 h-4 text-amber-600" />
                        <span>Admin Control Console</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsChangePassOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-zinc-500" />
                      <span>Change My Password</span>
                    </button>

                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Logout Account</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isChangePassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-2 text-amber-600">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Change Your Password
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Aapka username <span className="font-bold text-zinc-800 dark:text-zinc-200">@{currentUser?.username}</span> hai. Naya password darj karein:
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Kam az kam 4 characters"
                autoFocus
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePassOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 shadow-xs cursor-pointer"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
