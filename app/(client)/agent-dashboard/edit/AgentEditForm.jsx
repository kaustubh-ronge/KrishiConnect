"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateAgentProfile } from '@/actions/agent-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const agentTypeOptions = [
  "Wholesale Buyer",
  "Fertilizer Provider",
  "Pesticide Dealer",
  "Nursery Owner",
  "FMCG Buyer",
  "Retailer/Shop Owner",
  "Logistics/Transport",
  "Other"
];

export default function AgentEditForm({ initialProfile = {}, user }) {
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState(initialProfile.agentType || []);
  const [otherType, setOtherType] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const form = new FormData(e.target);
    // append types
    form.delete('agentType');
    selectedTypes.forEach(t => form.append('agentType', t));
    if (selectedTypes.includes('Other') && otherType.trim()) form.append('agentType', otherType.trim());

    const res = await updateAgentProfile(form);
    setIsSaving(false);
    if (!res || !res.success) return toast.error(res?.error || 'Failed to update');
    toast.success('Profile updated');
    router.push('/agent-dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Agent Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Full Name</Label><Input name="name" defaultValue={initialProfile.name || user?.name || ''} required /></div>
          <div><Label>Company</Label><Input name="companyName" defaultValue={initialProfile.companyName || ''} /></div>
          <div><Label>Phone</Label><Input name="phone" defaultValue={initialProfile.phone || ''} required /></div>
          <div><Label>Region</Label><Input name="region" defaultValue={initialProfile.region || ''} /></div>
        </div>

        <div>
          <Label>Agent Types</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {agentTypeOptions.map(t => (
              <label key={t} className="inline-flex items-center gap-2">
                <Checkbox checked={selectedTypes.includes(t)} onCheckedChange={(v) => setSelectedTypes(prev => v ? [...prev, t] : prev.filter(x => x !== t))} />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
          {selectedTypes.includes('Other') && (
            <div className="mt-2"><Input placeholder="Specify other" value={otherType} onChange={(e) => setOtherType(e.target.value)} /></div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>UPI ID</Label><Input name="upiId" defaultValue={initialProfile.upiId || ''} /></div>
          <div><Label>Bank Name</Label><Input name="bankName" defaultValue={initialProfile.bankName || ''} /></div>
          <div><Label>IFSC</Label><Input name="ifscCode" defaultValue={initialProfile.ifscCode || ''} /></div>
          <div><Label>Account Number</Label><Input name="accountNumber" type="password" defaultValue={initialProfile.accountNumber || ''} /></div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="bg-blue-600" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
          <Button variant="ghost" onClick={() => router.push('/agent-dashboard')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
