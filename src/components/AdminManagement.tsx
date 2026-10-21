import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminUser, UserRole } from '../types';
import {
  Crown,
  ShieldCheck,
  UserPlus,
  KeyRound,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  History,
  Lock,
  User,
  Check,
  AlertTriangle,
  RefreshCw,
  Search,
  Sliders,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

export const AdminManagement: React.FC = () => {
  const {
    currentUser,
    admins,
    auditLogs,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    changePassword,
    setCurrentTab,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'admins' | 'profile' | 'logs'>('admins');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin'>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [passwordModalAdmin, setPasswordModalAdmin] = useState<AdminUser | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [deleteConfirmAdmin, setDeleteConfirmAdmin] = useState<AdminUser | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState<{
    name: string;
    username: string;
    password: string;
    role: UserRole;
    status: 'active' | 'inactive';
    canManageWorkers: boolean;
    canRecordPayments: boolean;
    canManageBatches: boolean;
    canManageSettings: boolean;
    canDeleteRecords: boolean;
  }>({
    name: '',
    username: '',
    password: '',
    role: 'admin',
    status: 'active',
    canManageWorkers: true,
    canRecordPayments: true,
    canManageBatches: true,
    canManageSettings: false,
    canDeleteRecords: false,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Super admin self-edit state
  const [myProfileName, setMyProfileName] = useState(currentUser?.name || '');
  const [myProfileUsername, setMyProfileUsername] = useState(currentUser?.username || '');
  const [myOldPassword, setMyOldPassword] = useState('');
  const [myNewPassword, setMyNewPassword] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  const totalAdmins = admins.length;
  const activeCount = admins.filter(a => a.status === 'active').length;
  const superCount = admins.filter(a => a.role === 'super_admin').length;
  const inactiveCount = admins.filter(a => a.status === 'inactive').length;

  const filteredAdmins = admins.filter(a => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || a.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'admin',
      status: 'active',
      canManageWorkers: true,
      canRecordPayments: true,
      canManageBatches: true,
      canManageSettings: false,
      canDeleteRecords: false,
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      username: admin.username,
      password: '', // blank unless changing
      role: admin.role,
      status: admin.status,
      canManageWorkers: admin.canManageWorkers ?? true,
      canRecordPayments: admin.canRecordPayments ?? true,
      canManageBatches: admin.canManageBatches ?? true,
      canManageSettings: admin.canManageSettings ?? false,
      canDeleteRecords: admin.canDeleteRecords ?? false,
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Naam likhna lazmi hai.');
      return;
    }

    if (!formData.username.trim()) {
      setFormError('Username darj karein.');
      return;
    }

    if (!editingAdmin && (!formData.password || formData.password.length < 4)) {
      setFormError('Password kam az kam 4 characters ka hona chahiye.');
      return;
    }

    if (editingAdmin) {
      // Update existing admin
      const res = updateAdmin(editingAdmin.id, {
        name: formData.name,
        username: formData.username,
        role: formData.role,
        status: formData.status,
        canManageWorkers: formData.canManageWorkers,
        canRecordPayments: formData.canRecordPayments,
        canManageBatches: formData.canManageBatches,
        canManageSettings: formData.canManageSettings,
        canDeleteRecords: formData.canDeleteRecords,
      });

      if (!res.success) {
        setFormError(res.error || 'Update failed');
        return;
      }

      // If password was also provided during edit
      if (formData.password.trim()) {
        changePassword(editingAdmin.id, formData.password.trim());
      }

      setIsCreateModalOpen(false);
    } else {
      // Create new admin
      const res = createAdmin({
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        status: formData.status,
        canManageWorkers: formData.canManageWorkers,
        canRecordPayments: formData.canRecordPayments,
        canManageBatches: formData.canManageBatches,
        canManageSettings: formData.canManageSettings,
        canDeleteRecords: formData.canDeleteRecords,
      });

      if (!res.success) {
        setFormError(res.error || 'Admin create nahi ho saka');
        return;
      }

      setIsCreateModalOpen(false);
    }
  };

  const handleToggleStatus = (admin: AdminUser) => {
    if (admin.id === currentUser?.id) {
      showToast('Aap apna account deactivate nahi kar sakte.', 'warning');
      return;
    }
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    updateAdmin(admin.id, { status: newStatus });
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalAdmin) return;
    if (!newPasswordValue || newPasswordValue.length < 4) {
      showToast('Password kam az kam 4 characters ka hona chahiye.', 'error');
      return;
    }
    const res = changePassword(passwordModalAdmin.id, newPasswordValue);
    if (res.success) {
      setPasswordModalAdmin(null);
      setNewPasswordValue('');
    } else {
      showToast(res.error || 'Failed to change password', 'error');
    }
  };

  const handleMyProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    if (!currentUser) return;

    if (!myProfileName.trim() || !myProfileUsername.trim()) {
      setProfileErrorMsg('Naam aur username khali nahi ho sakte.');
      return;
    }

    // If changing password, verify old password
    if (myNewPassword) {
      if (myOldPassword !== currentUser.password) {
        setProfileErrorMsg('Purana password darust nahi hai.');
        return;
      }
      if (myNewPassword.length < 4) {
        setProfileErrorMsg('Naya password kam az kam 4 characters ka ho.');
        return;
      }
    }

    const res = updateAdmin(currentUser.id, {
      name: myProfileName.trim(),
      username: myProfileUsername.trim(),
    });

    if (!res.success) {
      setProfileErrorMsg(res.error || 'Update failed');
      return;
    }

    if (myNewPassword) {
      changePassword(currentUser.id, myNewPassword);
      setMyOldPassword('');
      setMyNewPassword('');
    }

    setProfileSuccessMsg('Aapka profile kamyabi se update ho gaya!');
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 border border-amber-400/30 dark:border-zinc-800 text-white p-6 sm:p-7 shadow-lg shadow-amber-600/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-100 border border-amber-300/30 backdrop-blur-xs">
              <Crown className="w-3.5 h-3.5 text-amber-200" />
              <span>Super Admin Master Control</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Admins & Access Management
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 dark:text-zinc-300 max-w-xl">
              Naye admins banayein, unke passwords aur roles set karein, aur security control sambhalein.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-amber-600" />
              <span>Create New Admin</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <span>Total Admins</span>
            <Shield className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalAdmins}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Registered system users</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 mb-1">
            <span>Active Admins</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Can login & operate</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 mb-1">
            <span>Super Admins</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{superCount}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Full master rights</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 mb-1">
            <span>Suspended</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{inactiveCount}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Deactivated accounts</div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'admins'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>All Administrators ({totalAdmins})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-500" />
          <span>My Super Admin Account</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit & Login Logs</span>
        </button>
      </div>

      {/* Tab 1: All Administrators */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or username..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-zinc-500">Filter:</span>
              <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    roleFilter === 'all'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setRoleFilter('super_admin')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    roleFilter === 'super_admin'
                      ? 'bg-white dark:bg-zinc-900 text-amber-600 font-bold shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Super Admin
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                    roleFilter === 'admin'
                      ? 'bg-white dark:bg-zinc-900 text-blue-600 font-bold shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Regular Admin
                </button>
              </div>
            </div>
          </div>

          {/* Admins List / Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredAdmins.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">
                  Koi admin nahi mila. Filter reset karein ya naya admin add karein.
                </div>
              ) : (
                filteredAdmins.map(admin => {
                  const isCurrent = admin.id === currentUser?.id;
                  const isSuper = admin.role === 'super_admin';

                  return (
                    <div
                      key={admin.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Left: User details */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-base font-bold shadow-xs ${
                            isSuper
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800/60'
                          }`}
                        >
                          {isSuper ? <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" /> : <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                        </div>

                        <div>
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {admin.name}
                            </span>
                            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                              @{admin.username}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                You (Active Session)
                              </span>
                            )}
                          </div>

                          {/* Role & Permissions preview */}
                          <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-xs">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                isSuper
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900'
                              }`}
                            >
                              {isSuper ? 'Super Admin' : 'Admin'}
                            </span>

                            {/* Status */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                admin.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {admin.status === 'active' ? 'Active' : 'Suspended'}
                            </span>

                            {/* Last Login */}
                            <span className="text-[11px] text-zinc-400 ml-1">
                              {admin.lastLogin
                                ? `Last login: ${new Date(admin.lastLogin).toLocaleDateString()} ${new Date(admin.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : 'Never logged in yet'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center flex-wrap gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                        {/* Change Password Button */}
                        <button
                          onClick={() => {
                            setPasswordModalAdmin(admin);
                            setNewPasswordValue('');
                          }}
                          title="Change Password"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Change Password</span>
                        </button>

                        {/* Edit Details */}
                        <button
                          onClick={() => openEditModal(admin)}
                          title="Edit Admin"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Edit</span>
                        </button>

                        {/* Toggle Active / Inactive (except self) */}
                        {!isCurrent && (
                          <button
                            onClick={() => handleToggleStatus(admin)}
                            title={admin.status === 'active' ? 'Deactivate account' : 'Activate account'}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                              admin.status === 'active'
                                ? 'border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            {admin.status === 'active' ? (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete Admin (disabled for self or last superadmin) */}
                        {!isCurrent && (
                          <button
                            onClick={() => setDeleteConfirmAdmin(admin)}
                            title="Delete Admin"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: My Super Admin Profile & Credentials */}
      {activeTab === 'profile' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-5 border-b border-zinc-100 dark:border-zinc-800 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                My Super Admin Credentials
              </h2>
              <p className="text-xs text-zinc-500">
                Aap apna naam, login username aur password yahan se tabdeel kar sakte hain.
              </p>
            </div>
          </div>

          {profileSuccessMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleMyProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={myProfileName}
                onChange={e => setMyProfileName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Login Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">@</span>
                <input
                  type="text"
                  value={myProfileUsername}
                  onChange={e => setMyProfileUsername(e.target.value.toLowerCase().trim())}
                  required
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Agli dafa is username se login karein.
              </span>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                Change Password (Optional)
              </h3>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={myOldPassword}
                  onChange={e => setMyOldPassword(e.target.value)}
                  placeholder="Agar password badalna hai tou purana password likhein"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={myNewPassword}
                  onChange={e => setMyNewPassword(e.target.value)}
                  placeholder="Naya mazboot password darj karein"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
            >
              Update Credentials
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Security & Activity Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Security & Activity Audit Log
              </h2>
              <p className="text-xs text-zinc-500">
                Login, password change, aur admin creation ka mukammal record.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {auditLogs.length} events logged
            </span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-96 overflow-y-auto">
            {auditLogs.map(log => {
              const isLogin = log.action === 'LOGIN';
              const isCreate = log.action === 'CREATE_ADMIN';
              const isDelete = log.action === 'DELETE_ADMIN';

              return (
                <div key={log.id} className="py-3 flex items-start gap-3 text-xs">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isLogin
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                        : isCreate
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                        : isDelete
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">{log.details}</p>
                    <span className="text-[10px] text-zinc-400 font-mono">Actor: @{log.actorUsername}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Admin Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {editingAdmin ? 'Edit Administrator' : 'Create New Administrator'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tariq Manager"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="e.g. manager2"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-mono focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {editingAdmin ? 'New Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-amber-600 hover:underline cursor-pointer"
                  >
                    Auto Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingAdmin ? 'Keep existing password' : 'Enter login password'}
                    required={!editingAdmin}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-mono focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      formData.role === 'admin'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Regular Admin</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      Daily farm supervisor with assigned rights
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'super_admin' })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      formData.role === 'super_admin'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      <Crown className="w-4 h-4" />
                      <span>Super Admin</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      Full access to create/manage all admins
                    </div>
                  </button>
                </div>
              </div>

              {/* Granular Permissions (Only relevant for regular admin) */}
              {formData.role === 'admin' && (
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                    Assigned Permissions:
                  </span>

                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canManageWorkers}
                      onChange={e => setFormData({ ...formData, canManageWorkers: e.target.checked })}
                      className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Manage Workers & Hisab</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canRecordPayments}
                      onChange={e => setFormData({ ...formData, canRecordPayments: e.target.checked })}
                      className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Disburse & Record Worker Payments</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canManageBatches}
                      onChange={e => setFormData({ ...formData, canManageBatches: e.target.checked })}
                      className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Plant Pineapple Batches & Nourish Slots</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canManageSettings}
                      onChange={e => setFormData({ ...formData, canManageSettings: e.target.checked })}
                      className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Manage Settings & Google Sheet Sync</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canDeleteRecords}
                      onChange={e => setFormData({ ...formData, canDeleteRecords: e.target.checked })}
                      className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Delete Batches & Records</span>
                  </label>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium focus:outline-none"
                >
                  <option value="active">Active (Can Login)</option>
                  <option value="inactive">Suspended / Deactivated</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  {editingAdmin ? 'Update Admin' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Change Password
                </h3>
              </div>
              <button
                onClick={() => setPasswordModalAdmin(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 mb-3">
              Resetting password for <span className="font-bold text-zinc-800 dark:text-zinc-200">@{passwordModalAdmin.username}</span> ({passwordModalAdmin.name}):
            </p>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPasswordValue}
                  onChange={e => setNewPasswordValue(e.target.value)}
                  placeholder="Enter new password"
                  autoFocus
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-mono focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalAdmin(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Delete Admin Account?
              </h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
              Kya aap waqayi admin <span className="font-bold text-zinc-800 dark:text-zinc-200">@{deleteConfirmAdmin.username}</span> ({deleteConfirmAdmin.name}) ko delete karna chahte hain? Yeh amal wapas nahi ho sakta.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmAdmin(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAdmin(deleteConfirmAdmin.id);
                  setDeleteConfirmAdmin(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
