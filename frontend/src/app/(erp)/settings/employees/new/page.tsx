'use client';

import { FormEvent, useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Save, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';

type Option = { id: string; name: string; code?: string; first_name?: string; last_name?: string; employee_code?: string };
type FormState = {
  first_name: string; last_name: string; email: string; mobile: string; gender: string; date_of_birth: string;
  joining_date: string; employment_type: string; employment_status: string; work_location: string;
  branch: string; department: string; designation: string; role: string; reporting_manager: string; approval_manager: string;
  emergency_contact: string; address: string; notes: string;
};

const initialForm: FormState = {
  first_name: '', last_name: '', email: '', mobile: '', gender: '', date_of_birth: '', joining_date: '',
  employment_type: '', employment_status: 'Active', work_location: 'Office', branch: '', department: '', designation: '',
  role: '', reporting_manager: '', approval_manager: '', emergency_contact: '', address: '', notes: '',
};

function listFromResponse(response: { data?: unknown }): Option[] {
  const body = response.data;
  const data = typeof body === 'object' && body !== null && 'data' in body ? (body as { data?: unknown }).data : body;
  const result = typeof data === 'object' && data !== null && 'results' in data ? (data as { results?: unknown }).results : data;
  return Array.isArray(result) ? result as Option[] : [];
}

function apiError(error: unknown, fallback: string) {
  const response = typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { data?: unknown } }).response : undefined;
  const payload = response?.data;
  if (typeof payload !== 'object' || payload === null) return fallback;
  const errors = (payload as { errors?: unknown }).errors;
  if (typeof errors === 'object' && errors !== null) {
    const [field, messages] = Object.entries(errors as Record<string, unknown>)[0] ?? [];
    const message = Array.isArray(messages) ? messages[0] : messages;
    if (typeof message === 'string') return `${(field || 'Field').replace(/_/g, ' ')}: ${message}`;
  }
  const detail = (payload as { detail?: unknown }).detail;
  return typeof detail === 'string' ? detail : fallback;
}

export default function NewEmployeePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      </div>
    }>
      <NewEmployeeContent />
    </Suspense>
  );
}

function NewEmployeeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(initialForm);
  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [branches, departments, designations, roles, employees] = await Promise.all([
        api.get('/branches/?page_size=200'), api.get('/departments/?page_size=200'), api.get('/designations/?page_size=200'),
        api.get('/roles/?page_size=200'), api.get('/employees/?page_size=200'),
      ]);
      setOptions({ branch: listFromResponse(branches), department: listFromResponse(departments), designation: listFromResponse(designations), role: listFromResponse(roles), employee: listFromResponse(employees) });
    } catch (error: unknown) {
      showToast(apiError(error, 'Could not load employee form options.'), 'error');
    } finally { setLoadingOptions(false); }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadOptions(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOptions]);

  // Load existing employee data when editing
  useEffect(() => {
    if (!editId) return;
    const loadEmployee = async () => {
      try {
        const res = await api.get(`/employees/${editId}/`);
        const emp = (res.data as any)?.data || res.data;
        if (emp) {
          setForm({
            first_name: emp.first_name || '',
            last_name: emp.last_name || '',
            email: emp.email || '',
            mobile: emp.mobile || '',
            gender: emp.gender || '',
            date_of_birth: emp.date_of_birth || '',
            joining_date: emp.joining_date || '',
            employment_type: emp.employment_type || '',
            employment_status: emp.employment_status || 'Active',
            work_location: emp.work_location || 'Office',
            branch: emp.branch || '',
            department: emp.department || '',
            designation: emp.designation || '',
            role: emp.role || '',
            reporting_manager: emp.reporting_manager || '',
            approval_manager: emp.approval_manager || '',
            emergency_contact: emp.emergency_contact || '',
            address: emp.address || '',
            notes: emp.notes || '',
          });
        }
      } catch {
        showToast('Failed to load employee data', 'error');
      }
    };
    loadEmployee();
  }, [editId, showToast]);

  const update = (key: keyof FormState, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      showToast('First name, last name, and email are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''));
      if (editId) {
        await api.patch(`/employees/${editId}/`, payload);
        showToast('Employee updated successfully.');
      } else {
        await api.post('/employees/', payload);
        showToast('Employee created. An employee code was generated automatically.');
      }
      router.push('/settings/employees');
    } catch (error: unknown) {
      showToast(apiError(error, editId ? 'Employee could not be updated.' : 'Employee could not be created.'), 'error');
    } finally { setSaving(false); }
  };

  const selectClass = 'mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600';
  const inputClass = 'mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600';
  const employeeLabel = (employee: Option) => `${employee.first_name || ''} ${employee.last_name || ''}`.trim() + (employee.employee_code ? ` (${employee.employee_code})` : '');

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><UserPlus className="h-6 w-6 text-emerald-600" />{editId ? 'Edit Employee' : 'Add Employee'}</h1><p className="mt-1 text-sm text-slate-500">{editId ? 'Update employee profile details.' : 'Create a complete employee profile. The employee code is assigned automatically.'}</p></div>
      <Link href="/settings/employees"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Back to employees</Button></Link>
    </div>

    <form onSubmit={submit} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Section title="Personal information"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Input label="First name" required value={form.first_name} onChange={value => update('first_name', value)} className={inputClass} />
        <Input label="Last name" required value={form.last_name} onChange={value => update('last_name', value)} className={inputClass} />
        <Input label="Email address" type="email" required value={form.email} onChange={value => update('email', value)} className={inputClass} />
        <Input label="Mobile number" type="tel" value={form.mobile} onChange={value => update('mobile', value)} className={inputClass} placeholder="10-digit mobile number" />
        <Field label="Gender"><select className={selectClass} value={form.gender} onChange={event => update('gender', event.target.value)}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></Field>
        <Input label="Date of birth" type="date" value={form.date_of_birth} onChange={value => update('date_of_birth', value)} className={inputClass} />
      </div></Section>
      <Section title="Employment details"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div><label className="text-sm font-medium text-slate-700">Employee code</label><div className="mt-1 flex h-10 items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">Generated automatically on save</div></div>
        <Input label="Joining date" type="date" value={form.joining_date} onChange={value => update('joining_date', value)} className={inputClass} />
        <Input label="Employment type" value={form.employment_type} onChange={value => update('employment_type', value)} className={inputClass} placeholder="e.g. Full-time" />
        <Field label="Employment status"><select className={selectClass} value={form.employment_status} onChange={event => update('employment_status', event.target.value)}>{['Active', 'On Leave', 'Probation', 'Resigned', 'Terminated'].map(value => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Work location"><select className={selectClass} value={form.work_location} onChange={event => update('work_location', event.target.value)}>{['Office', 'Remote', 'Hybrid'].map(value => <option key={value}>{value}</option>)}</select></Field>
      </div></Section>
      <Section title="Organisation and reporting"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <OptionSelect label="Branch" value={form.branch} onChange={value => update('branch', value)} options={options.branch} className={selectClass} loading={loadingOptions} />
        <OptionSelect label="Department" value={form.department} onChange={value => update('department', value)} options={options.department} className={selectClass} loading={loadingOptions} />
        <OptionSelect label="Designation" value={form.designation} onChange={value => update('designation', value)} options={options.designation} className={selectClass} loading={loadingOptions} />
        <OptionSelect label="Role" value={form.role} onChange={value => update('role', value)} options={options.role} className={selectClass} loading={loadingOptions} />
        <OptionSelect label="Reporting manager" value={form.reporting_manager} onChange={value => update('reporting_manager', value)} options={options.employee} className={selectClass} loading={loadingOptions} labelFor={employeeLabel} />
        <OptionSelect label="Approval manager" value={form.approval_manager} onChange={value => update('approval_manager', value)} options={options.employee} className={selectClass} loading={loadingOptions} labelFor={employeeLabel} />
      </div></Section>
      <Section title="Additional information"><div className="grid gap-4 md:grid-cols-2"><Field label="Emergency contact"><textarea className={`${selectClass} h-20 py-2`} value={form.emergency_contact} onChange={event => update('emergency_contact', event.target.value)} /></Field><Field label="Address"><textarea className={`${selectClass} h-20 py-2`} value={form.address} onChange={event => update('address', event.target.value)} /></Field><Field label="Notes"><textarea className={`${selectClass} h-20 py-2`} value={form.notes} onChange={event => update('notes', event.target.value)} /></Field></div></Section>
      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4"><Link href="/settings/employees"><Button type="button" variant="outline">Cancel</Button></Link><Button type="submit" disabled={saving || loadingOptions} className="bg-emerald-600 hover:bg-emerald-700"><>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}</>Save employee</Button></div>
    </form>
  </div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border-b border-slate-100 px-6 py-5"><h2 className="mb-4 text-base font-semibold text-slate-800">{title}</h2>{children}</section>; }
function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-700">{label}{children}</label>; }
function Input({ label, value, onChange, className, type = 'text', required = false, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; className: string; type?: string; required?: boolean; placeholder?: string }) { return <Field label={<>{label}{required && <span className="ml-1 text-rose-600">*</span>}</>}><input type={type} required={required} value={value} onChange={event => onChange(event.target.value)} className={className} placeholder={placeholder} /></Field>; }
function OptionSelect({ label, value, onChange, options = [], className, loading, labelFor = (option: Option) => option.name }: { label: string; value: string; onChange: (value: string) => void; options?: Option[]; className: string; loading: boolean; labelFor?: (option: Option) => string }) { return <Field label={label}><select className={className} value={value} disabled={loading} onChange={event => onChange(event.target.value)}><option value="">{loading ? 'Loading…' : `Select ${label.toLowerCase()}`}</option>{options.map(option => <option key={option.id} value={option.id}>{labelFor(option)}</option>)}</select></Field>; }
