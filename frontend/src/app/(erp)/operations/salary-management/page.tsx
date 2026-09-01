'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, IndianRupee, Plus, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';

type Employee = { id: string; employee_code: string; first_name: string; last_name: string };
type Attendance = { id: string; employee: string; employee_name: string; date: string; status: string; check_in?: string; check_out?: string; notes?: string };
type Salary = { id: string; employee: string; employee_name: string; month: string; basic_salary: string; allowances: string; deductions: string; net_salary: string; payment_status: string; paid_on?: string; notes?: string };

const today = new Date().toISOString().slice(0, 10);
const payrollMonth = `${today.slice(0, 7)}-01`;
const unwrapList = (response: { data?: unknown }) => {
  const body = response?.data;
  const data = typeof body === 'object' && body !== null && 'data' in body
    ? (body as { data?: unknown }).data
    : body;
  if (typeof data === 'object' && data !== null && 'results' in data) {
    const results = (data as { results?: unknown }).results;
    return Array.isArray(results) ? results : [];
  }
  return Array.isArray(data) ? data : [];
};
const money = (value: string | number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
const errorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback;
  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (typeof data !== 'object' || data === null) return fallback;
  const detail = (data as { detail?: unknown; data?: { detail?: unknown } }).detail
    ?? (data as { data?: { detail?: unknown } }).data?.detail;
  return typeof detail === 'string' ? detail : fallback;
};

export default function SalaryManagementPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'attendance' | 'salaries'>('attendance');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({ employee: '', date: today, status: 'Present', check_in: '', check_out: '', notes: '' });
  const [salaryForm, setSalaryForm] = useState({ employee: '', month: payrollMonth, basic_salary: '', allowances: '0', deductions: '0', payment_status: 'Draft', paid_on: '', notes: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [employeeRes, attendanceRes, salaryRes] = await Promise.all([
        api.get('/employees/?page_size=200'), api.get('/attendance/?page_size=200'), api.get('/salaries/?page_size=200'),
      ]);
      setEmployees(unwrapList(employeeRes));
      setAttendance(unwrapList(attendanceRes));
      setSalaries(unwrapList(salaryRes));
    } catch (error: unknown) {
      showToast(errorMessage(error, 'Unable to load salary management data.'), 'error');
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const stats = useMemo(() => ({
    present: attendance.filter(item => item.status === 'Present').length,
    paid: salaries.filter(item => item.payment_status === 'Paid').length,
    payroll: salaries.reduce((sum, item) => sum + Number(item.net_salary || 0), 0),
  }), [attendance, salaries]);

  const submitAttendance = async (event: FormEvent) => {
    event.preventDefault();
    if (!attendanceForm.employee) return showToast('Select an employee.', 'error');
    setSaving(true);
    try {
      await api.post('/attendance/', { ...attendanceForm, check_in: attendanceForm.check_in || null, check_out: attendanceForm.check_out || null });
      showToast('Attendance saved.');
      setAttendanceForm({ employee: '', date: today, status: 'Present', check_in: '', check_out: '', notes: '' });
      await load();
    } catch (error: unknown) { showToast(errorMessage(error, 'Attendance could not be saved. One entry is allowed per employee per day.'), 'error'); }
    finally { setSaving(false); }
  };

  const submitSalary = async (event: FormEvent) => {
    event.preventDefault();
    if (!salaryForm.employee || !salaryForm.basic_salary) return showToast('Employee and basic salary are required.', 'error');
    setSaving(true);
    try {
      await api.post('/salaries/', { ...salaryForm, paid_on: salaryForm.paid_on || null });
      showToast('Salary record created.');
      setSalaryForm({ employee: '', month: payrollMonth, basic_salary: '', allowances: '0', deductions: '0', payment_status: 'Draft', paid_on: '', notes: '' });
      await load();
    } catch (error: unknown) { showToast(errorMessage(error, 'Salary could not be saved. One record is allowed per employee per month.'), 'error'); }
    finally { setSaving(false); }
  };

  const markPaid = async (salary: Salary) => {
    try { await api.patch(`/salaries/${salary.id}/`, { payment_status: 'Paid', paid_on: today }); showToast('Salary marked as paid.'); await load(); }
    catch { showToast('Could not update payment status.', 'error'); }
  };

  const currentNet = Number(salaryForm.basic_salary || 0) + Number(salaryForm.allowances || 0) - Number(salaryForm.deductions || 0);
  const inputClass = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500';

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900"><IndianRupee className="h-6 w-6 text-emerald-600" />Salary Management</h1><p className="mt-1 text-sm text-slate-500">Record employee attendance and manage monthly payroll.</p></div>
      <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <Metric icon={<Users />} label="Employees" value={employees.length} /><Metric icon={<CalendarCheck2 />} label="Present entries" value={stats.present} /><Metric icon={<IndianRupee />} label="Payroll recorded" value={money(stats.payroll)} />
    </div>

    <div className="flex gap-2 border-b border-slate-200"><Tab active={tab === 'attendance'} onClick={() => setTab('attendance')}>Attendance</Tab><Tab active={tab === 'salaries'} onClick={() => setTab('salaries')}>Salaries {stats.paid ? `(${stats.paid} paid)` : ''}</Tab></div>

    {tab === 'attendance' ? <>
      <form onSubmit={submitAttendance} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800"><Plus className="h-4 w-4" />Record attendance</h2><div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Field label="Employee"><select required className={inputClass} value={attendanceForm.employee} onChange={e => setAttendanceForm({ ...attendanceForm, employee: e.target.value })}><option value="">Select employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} · {e.employee_code}</option>)}</select></Field>
        <Field label="Date"><input required type="date" className={inputClass} value={attendanceForm.date} onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })} /></Field>
        <Field label="Status"><select className={inputClass} value={attendanceForm.status} onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value })}>{['Present', 'Absent', 'Half Day', 'Leave', 'Holiday'].map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Check in"><input type="time" className={inputClass} value={attendanceForm.check_in} onChange={e => setAttendanceForm({ ...attendanceForm, check_in: e.target.value })} /></Field>
        <Field label="Check out"><input type="time" className={inputClass} value={attendanceForm.check_out} onChange={e => setAttendanceForm({ ...attendanceForm, check_out: e.target.value })} /></Field>
        <div className="flex items-end"><Button disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">Save</Button></div>
      </div></form>
      <AttendanceTable records={attendance} loading={loading} />
    </> : <>
      <form onSubmit={submitSalary} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-800"><Plus className="h-4 w-4" />Create monthly salary</h2><div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Field label="Employee"><select required className={inputClass} value={salaryForm.employee} onChange={e => setSalaryForm({ ...salaryForm, employee: e.target.value })}><option value="">Select employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} · {e.employee_code}</option>)}</select></Field>
        <Field label="Payroll month"><input required type="month" className={inputClass} value={salaryForm.month.slice(0, 7)} onChange={e => setSalaryForm({ ...salaryForm, month: `${e.target.value}-01` })} /></Field>
        <Field label="Basic salary"><input required min="0" step="0.01" type="number" className={inputClass} value={salaryForm.basic_salary} onChange={e => setSalaryForm({ ...salaryForm, basic_salary: e.target.value })} /></Field>
        <Field label="Allowances"><input min="0" step="0.01" type="number" className={inputClass} value={salaryForm.allowances} onChange={e => setSalaryForm({ ...salaryForm, allowances: e.target.value })} /></Field>
        <Field label="Deductions"><input min="0" step="0.01" type="number" className={inputClass} value={salaryForm.deductions} onChange={e => setSalaryForm({ ...salaryForm, deductions: e.target.value })} /></Field>
        <div className="flex flex-col justify-end"><span className="text-xs font-medium text-slate-500">Net salary</span><span className="mt-2 font-semibold text-emerald-700">{money(currentNet)}</span></div>
      </div><div className="mt-4 flex justify-end"><Button disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">Create salary</Button></div></form>
      <SalaryTable records={salaries} loading={loading} onMarkPaid={markPaid} />
    </>}
  </div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) { return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-md bg-emerald-50 p-2 text-emerald-600">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold text-slate-800">{value}</p></div></div></div>; }
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={`border-b-2 px-4 py-2 text-sm font-medium ${active ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{children}</button>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-medium text-slate-600">{label}{children}</label>; }
function AttendanceTable({ records, loading }: { records: Attendance[]; loading: boolean }) { return <Table headers={['Employee', 'Date', 'Status', 'Check in', 'Check out', 'Notes']} loading={loading} empty="No attendance entries yet.">{records.map(r => <tr key={r.id} className="border-t border-slate-100"><Cell>{r.employee_name}</Cell><Cell>{r.date}</Cell><Cell><Badge label={r.status} /></Cell><Cell>{r.check_in || '—'}</Cell><Cell>{r.check_out || '—'}</Cell><Cell>{r.notes || '—'}</Cell></tr>)}</Table>; }
function SalaryTable({ records, loading, onMarkPaid }: { records: Salary[]; loading: boolean; onMarkPaid: (salary: Salary) => void }) { return <Table headers={['Employee', 'Month', 'Basic', 'Allowances', 'Deductions', 'Net salary', 'Status', '']} loading={loading} empty="No salary records yet.">{records.map(r => <tr key={r.id} className="border-t border-slate-100"><Cell>{r.employee_name}</Cell><Cell>{new Date(`${r.month}T00:00:00`).toLocaleString('en-IN', { month: 'short', year: 'numeric' })}</Cell><Cell>{money(r.basic_salary)}</Cell><Cell>{money(r.allowances)}</Cell><Cell>{money(r.deductions)}</Cell><Cell><span className="font-semibold">{money(r.net_salary)}</span></Cell><Cell><Badge label={r.payment_status} /></Cell><Cell>{r.payment_status !== 'Paid' && <button onClick={() => onMarkPaid(r)} className="text-xs font-medium text-emerald-700 hover:underline">Mark paid</button>}</Cell></tr>)}</Table>; }
function Table({ headers, children, loading, empty }: { headers: string[]; children: React.ReactNode; loading: boolean; empty: string }) { const items = Array.isArray(children) ? children : []; return <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{headers.map(h => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={headers.length} className="p-8 text-center text-slate-500">Loading…</td></tr> : items.length ? children : <tr><td colSpan={headers.length} className="p-8 text-center text-slate-500">{empty}</td></tr>}</tbody></table></div>; }
function Cell({ children }: { children: React.ReactNode }) { return <td className="whitespace-nowrap px-4 py-3 text-slate-700">{children}</td>; }
function Badge({ label }: { label: string }) { const styles: Record<string, string> = { Present: 'bg-emerald-50 text-emerald-700', Paid: 'bg-emerald-50 text-emerald-700', Absent: 'bg-rose-50 text-rose-700', Leave: 'bg-amber-50 text-amber-700', 'Half Day': 'bg-amber-50 text-amber-700', Processed: 'bg-blue-50 text-blue-700' }; return <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[label] || 'bg-slate-100 text-slate-700'}`}>{label}</span>; }
