import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { flushFarm, getSyncStatus, loadFarm, resetFarm, subscribeSync, getFarmData } from '../services/cloudStore';
import type { AdminUser } from '../types';

export function CloudGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sync, setSync] = useState(getSyncStatus());
  useEffect(() => subscribeSync(() => setSync(getSyncStatus())), []);
  useEffect(() => {
    if (!supabase) { setError('Database configuration is missing. Please contact the owner.'); setLoading(false); return; }
    let live = true;
    let request = 0;
    let loadedUser = '';
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user?.id === loadedUser) return;
      loadedUser = user?.id || '';
      const ticket = ++request;
      setReady(false); resetFarm();
      if (!user) { setLoading(false); return; }
      setLoading(true);
      // Start database calls after the auth callback releases its lock.
      setTimeout(() => { void (async () => {
        const { data, error: membershipError } = await supabase.from('farm_members')
          .select('user_id,name,role,active').eq('user_id',user.id).single();
        if (membershipError || !data?.active) throw new Error('Your account has no active farm access. Ask the owner to add you.');
        const canEdit = data.role === 'super_admin';
        const account: AdminUser = {
          id: user.id, username: user.email || user.id, password: '', name: data.name,
          role: data.role, status: 'active', createdAt: user.created_at,
          canManageWorkers: canEdit, canRecordPayments: canEdit, canManageBatches: canEdit,
          canManageSettings: canEdit, canDeleteRecords: canEdit,
        };
        if (!live || ticket !== request) return;
        await loadFarm(account);
        if (live && ticket === request) { setReady(true); setError(''); }
      })().catch(err => { if (live && ticket === request) setError(err.message); })
        .finally(() => { if (live && ticket === request) setLoading(false); }); },0);
    });
    return () => { live = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (['pending','saving','error'].includes(getSyncStatus().state)) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload',warn);
    return () => window.removeEventListener('beforeunload',warn);
  },[]);
  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      if (!supabase) throw new Error('Database configuration missing.');
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setPassword('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Sign-in failed.'); setLoading(false); }
  }
  if (!ready) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
    <form onSubmit={login} className="w-full max-w-sm bg-white border rounded-2xl p-7 space-y-4">
      <h1 className="text-xl font-bold">Plantation Tracker</h1>
      <p className="text-sm text-zinc-600">Sign in with your farm account.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <label className="block text-sm">Email<input className="block border rounded-lg p-2 w-full mt-1" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label className="block text-sm">Password<input className="block border rounded-lg p-2 w-full mt-1" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
      <button disabled={loading || !supabase} className="w-full rounded-lg bg-amber-600 text-white p-2 disabled:opacity-50">{loading ? 'Connecting...' : 'Sign in'}</button>
      {error && <button type="button" className="text-sm underline mr-3" onClick={()=>location.reload()}>Retry connection</button>}
      {error && <button type="button" className="text-sm underline" onClick={()=>{void supabase?.auth.signOut(); setError('');}}>Use another account</button>}
    </form>
  </div>;
  if (sync.state === 'error') return <div className="max-w-lg mx-auto p-8 space-y-4">
    <h1 className="font-bold text-xl">Changes could not be saved</h1><p role="alert">{sync.error}</p>
    <p>Editing is paused to protect shared records. Download your unsaved changes before reloading the latest database records.</p>
    <button className="border rounded p-2" onClick={()=>{
      const url = URL.createObjectURL(new Blob([JSON.stringify(getFarmData(),null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='unsaved-plantation.json';a.click();URL.revokeObjectURL(url);
    }}>Download unsaved changes</button>
    <button className="border rounded p-2 ml-2" onClick={()=>location.reload()}>Reload database</button>
  </div>;
  return <><div role="status" className="bg-emerald-50 text-emerald-900 text-xs text-center p-1">
    {sync.state === 'saved' ? 'Connected to Supabase · All changes saved' : 'Saving changes to Supabase — keep this page open'}
    <button className="ml-3 underline" onClick={()=>{void flushFarm().then(()=>location.reload());}}>Refresh records</button>
  </div>{children}</>;
}
