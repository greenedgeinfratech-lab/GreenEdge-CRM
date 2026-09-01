'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, IndianRupee, MessageCircle, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { customersApi } from '@/services/crmService';
import type { Customer } from '@/interfaces/crm';
import { useToast } from '@/providers/ToastProvider';

interface CustomerInteraction {
  id: string;
  interaction_type: string;
  notes?: string;
  scheduled_for?: string;
  created_at?: string;
  amount?: number;
}

interface PaymentResponse {
  customer?: { outstanding?: number | string };
  data?: { customer?: { outstanding?: number | string } };
}

interface Props {
  customer: Customer | null;
  action?: 'remind' | 'appointment' | 'amount' | 'whatsapp' | 'email' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export default function CustomerRecoveryDialog({ customer, action, open, onOpenChange, onUpdated }: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState<Partial<Customer>>({});
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [note, setNote] = useState('');
  const [when, setWhen] = useState('');
  const [payment, setPayment] = useState('');
  const [saving, setSaving] = useState(false);

  const loadInteractions = useCallback(async () => {
    if (!customer) return;
    try {
      const response = await customersApi.interactions(customer.id);
      setInteractions(response.data.data || []);
    } catch {
      showToast('Could not load customer activity.', 'error');
    }
  }, [customer, showToast]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (customer && open) {
      setForm(customer);
      setNote(''); setWhen(''); setPayment('');
      loadInteractions();
    }
  }, [customer, open, action, loadInteractions]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async () => {
    if (!customer || !form.name?.trim()) return showToast('Customer name is required.', 'error');
    setSaving(true);
    try {
      await customersApi.update(customer.id, form);
      showToast('Customer details saved.');
      onUpdated();
    } catch {
      showToast('Could not save customer details.', 'error');
    } finally { setSaving(false); }
  };

  const addActivity = async (interaction_type: 'reminder' | 'appointment' | 'email' | 'whatsapp') => {
    if (!customer) return;
    if ((interaction_type === 'reminder' || interaction_type === 'appointment') && !when) {
      showToast('Choose a date and time first.', 'error'); return;
    }
    try {
      await customersApi.addInteraction(customer.id, {
        interaction_type, notes: note,
        scheduled_for: when ? new Date(when).toISOString() : undefined,
      });
      setNote(''); setWhen(''); await loadInteractions();
      showToast(`${interaction_type === 'appointment' ? 'Appointment' : 'Activity'} saved.`);
    } catch { showToast('Could not save the activity.', 'error'); }
  };

  const receivePayment = async () => {
    if (!customer || !Number(payment)) return showToast('Enter a payment amount.', 'error');
    try {
      const response = await customersApi.receivePayment(customer.id, Number(payment), note);
      const resData = response.data as PaymentResponse;
      const updatedCust = resData?.customer || resData?.data?.customer;
      const newOutstanding = updatedCust?.outstanding !== undefined
        ? Number(updatedCust.outstanding)
        : Math.max(0, (Number(form.outstanding) || 0) - Number(payment));
      setForm((prev) => ({ ...prev, outstanding: newOutstanding }));
      setPayment(''); setNote(''); await loadInteractions(); onUpdated();
      showToast('Payment recorded and outstanding balance updated.');
    } catch { showToast('Could not record the payment.', 'error'); }
  };

  const sendMessage = async (channel: 'email' | 'whatsapp') => {
    const destination = channel === 'email' ? form.email : form.mobile;
    if (!destination) return showToast(`This customer has no ${channel} address.`, 'error');
    setSaving(true);
    try {
      if (channel === 'email') {
        await customersApi.sendEmail(customer!.id, {
          email: destination,
          subject: 'Recovery follow-up',
          message: note || 'Please contact us regarding your outstanding balance.',
        });
      } else {
        await customersApi.sendWhatsApp(customer!.id, {
          mobile: destination,
          message: note || 'Please contact us regarding your outstanding balance.',
        });
      }
      setNote('');
      await loadInteractions();
      showToast(`${channel === 'email' ? 'Email' : 'WhatsApp message'} sent.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Delivery failed. Check your messaging setup.';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[calc(100vw-2rem)] max-w-[1180px] sm:max-w-[1180px] max-h-[90vh] overflow-y-auto p-6">
      <DialogHeader><DialogTitle className="text-2xl">{form.company_name || form.name || 'Customer details'}</DialogTitle></DialogHeader>
      {action && (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {action === 'remind' && 'Send a reminder or create a follow-up activity for this customer.'}
          {action === 'appointment' && 'Schedule an appointment: choose date and time, add notes, then save.'}
          {action === 'amount' && 'Record payment or update the outstanding balance in this dialog.'}
          {action === 'whatsapp' && 'Send a WhatsApp message and record the activity for this customer.'}
          {action === 'email' && 'Send an email and record the follow-up activity for this customer.'}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="space-y-4 rounded border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800">Customer profile</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {([['name', 'Contact name'], ['company_name', 'Business name'], ['mobile', 'Mobile'], ['email', 'Email'], ['city', 'City'], ['state', 'State']] as const).map(([key, label]) => <label key={key} className="text-xs font-medium text-slate-600">{label}<input value={String(form[key] || '')} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" /></label>)}
          </div>
          <label className="block text-xs font-medium text-slate-600">Outstanding balance<input type="number" value={String(form.outstanding ?? 0)} onChange={e => setForm({ ...form, outstanding: Number(e.target.value) })} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block text-xs font-medium text-slate-600">Recovery notes<textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" rows={3} /></label>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save changes'}</button>
        </section>
        <section className="space-y-3 rounded border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800">Recovery actions</h3>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Notes or message" rows={3} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
          <div className="flex flex-wrap gap-2"><button onClick={() => addActivity('reminder')} className="rounded bg-orange-100 px-3 py-2 text-sm text-orange-700">Remind</button><button onClick={() => addActivity('appointment')} className="inline-flex items-center gap-1 rounded bg-blue-100 px-3 py-2 text-sm text-blue-700"><Calendar className="h-4 w-4" />Appointment</button><button onClick={() => sendMessage('whatsapp')} className="inline-flex items-center gap-1 rounded bg-green-100 px-3 py-2 text-sm text-green-700"><MessageCircle className="h-4 w-4" />WhatsApp</button><button onClick={() => sendMessage('email')} className="rounded bg-yellow-100 px-3 py-2 text-sm text-yellow-700">Email</button></div>
          <div className="flex gap-2 border-t pt-3"><input type="number" value={payment} onChange={e => setPayment(e.target.value)} placeholder="Payment amount" className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm" /><button onClick={receivePayment} className="inline-flex items-center gap-1 rounded bg-green-700 px-3 py-2 text-sm text-white"><IndianRupee className="h-4 w-4" />Receive</button></div>
          <div className="max-h-48 space-y-2 overflow-y-auto border-t pt-3"><h4 className="text-sm font-semibold">Activity history</h4>{interactions.length ? interactions.map(activity => <div key={activity.id} className="rounded bg-slate-50 p-2 text-xs"><b className="capitalize">{activity.interaction_type}</b>{activity.amount ? ` • ₹${activity.amount}` : ''}<p>{activity.notes || 'No notes'}</p><span className="text-slate-500">{new Date(activity.scheduled_for || activity.created_at || '').toLocaleString()}</span></div>) : <p className="text-sm text-slate-500">No activity yet.</p>}</div>
        </section>
      </div>
    </DialogContent>
  </Dialog>;
}
