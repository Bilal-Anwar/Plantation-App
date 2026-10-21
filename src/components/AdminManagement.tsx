import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Member { user_id: string; email: string; name: string; role: string; active: boolean }
export function AdminManagement() {
  const [members,setMembers] = useState<Member[]>([]);
  const [email,setEmail] = useState('');
  const [name,setName] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  async function refresh() {
    const {data,error}=await supabase.rpc('list_farm_members');
    if(error) setError(error.message); else setMembers(data || []);
  }
  useEffect(()=>{ void refresh(); },[]);
  async function update(memberEmail: string, memberName: string, role: string, active: boolean) {
    setBusy(true);setError('');
    try {
      const {error}=await supabase.rpc('set_farm_member',{member_email:memberEmail,member_name:memberName,member_role:role,member_active:active});
      if(error) throw error;
      await refresh();setEmail('');setName('');
    } catch(err) {setError(err instanceof Error ? err.message : (err as {message?:string}).message || 'Could not update access.');}
    finally {setBusy(false);}
  }
  return <section className="space-y-4">
    <h1 className="text-xl font-bold">Farm access</h1>
    <p className="text-sm">Create or invite a user in Supabase Authentication, then add their email below. Super admins can edit records; admins have read-only access.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();void update(email,name,'admin',true);}}>
      <input aria-label="Member name" className="border p-2 rounded dark:bg-zinc-900" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />
      <input aria-label="Member email" className="border p-2 rounded dark:bg-zinc-900" placeholder="Existing user email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <button className="border p-2 rounded" disabled={busy}>Add member</button>
    </form>
    {members.map(m=><div key={m.user_id} className="border rounded p-3 flex flex-wrap gap-3 items-center">
      <div className="flex-1"><strong>{m.name}</strong><p className="text-sm">{m.email}</p></div>
      <select aria-label={'Role for '+m.name} className="border rounded p-2 dark:bg-zinc-900" disabled={busy} value={m.role} onChange={e=>{void update(m.email,m.name,e.target.value,m.active);}}>
        <option value="admin">Admin (read only)</option><option value="super_admin">Super admin</option>
      </select>
      <button className="border p-2 rounded" disabled={busy} onClick={()=>{void update(m.email,m.name,m.role,!m.active);}}>{m.active?'Deactivate':'Activate'}</button>
    </div>)}
  </section>;
}
