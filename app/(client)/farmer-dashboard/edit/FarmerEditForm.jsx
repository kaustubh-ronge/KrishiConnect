"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateFarmerProfile } from '@/actions/farmer-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const produceOptions = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Other"];

export default function FarmerEditForm({ initialProfile = {}, user }) {
  const router = useRouter();
  const [selectedProduce, setSelectedProduce] = useState(initialProfile.primaryProduce || []);
  const [otherProduce, setOtherProduce] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const form = new FormData(e.target);
    form.delete('primaryProduce');
    selectedProduce.forEach(p => form.append('primaryProduce', p));
    if (selectedProduce.includes('Other') && otherProduce.trim()) form.append('primaryProduce', otherProduce.trim());

    const res = await updateFarmerProfile(form);
    setIsSaving(false);
    if (!res || !res.success) return toast.error(res?.error || 'Failed to update');
    toast.success('Profile updated');
    router.push('/farmer-dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Farmer Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Full Name</Label><Input name="name" defaultValue={initialProfile.name || user?.name || ''} required /></div>
          <div><Label>Phone</Label><Input name="phone" defaultValue={initialProfile.phone || ''} required /></div>
          <div className="sm:col-span-2"><Label>Aadhar</Label><Input name="aadharNumber" defaultValue={initialProfile.aadharNumber || ''} /></div>
        </div>

        <div>
          <Label>Primary Produce</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {produceOptions.map(p => (
              <label key={p} className="inline-flex items-center gap-2">
                <Checkbox checked={selectedProduce.includes(p)} onCheckedChange={(v) => setSelectedProduce(prev => v ? [...prev, p] : prev.filter(x => x !== p))} />
                <span className="text-sm">{p}</span>
              </label>
            ))}
          </div>
          {selectedProduce.includes('Other') && <div className="mt-2"><Input placeholder="Specify other" value={otherProduce} onChange={(e) => setOtherProduce(e.target.value)} /></div>}
        </div>

        <div>
          <Label>Address</Label>
          <Textarea name="address" defaultValue={initialProfile.address || ''} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>UPI ID</Label><Input name="upiId" defaultValue={initialProfile.upiId || ''} /></div>
          <div><Label>Bank Name</Label><Input name="bankName" defaultValue={initialProfile.bankName || ''} /></div>
          <div><Label>IFSC</Label><Input name="ifscCode" defaultValue={initialProfile.ifscCode || ''} /></div>
          <div><Label>Account Number</Label><Input name="accountNumber" type="password" defaultValue={initialProfile.accountNumber || ''} /></div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="bg-green-600" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
          <Button variant="ghost" onClick={() => router.push('/farmer-dashboard')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
