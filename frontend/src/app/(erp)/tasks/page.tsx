'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Clock, Check, Plus, Trash2, Calendar, CheckCircle2,
  AlertCircle, RefreshCw, X, Play, Edit3, User, Filter
} from 'lucide-react';
import api from '@/lib/api';
import { usersApi } from '@/services/userService';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

const INITIAL_FORM = {
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  status: 'pending' as 'pending' | 'in_progress' | 'completed',
  due_date: '',
  assigned_to: '',
};

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);

  // Fetch Tasks
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-tasks', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/dashboard/tasks/${params}`);
      return res.data;
    },
  });

  // Fetch Employees for assignment
  const { data: employeesRes } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => usersApi.listEmployees({ page_size: 100 }),
  });

  const employees: Employee[] = useMemo(() => {
    const rawData = employeesRes?.data as any;
    const list = rawData?.data?.results || rawData?.data || rawData?.results || rawData;
    return Array.isArray(list) ? list : [];
  }, [employeesRes]);

  const tasks: Task[] = useMemo(() => {
    const rawList = (data as any)?.data?.results || (data as any)?.data || (data as any)?.results || data;
    return Array.isArray(rawList) ? rawList : [];
  }, [data]);

  // Task Mutations
  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/dashboard/tasks/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      showToast('Task created successfully.');
      setForm(INITIAL_FORM);
      setShowForm(false);
    },
    onError: () => {
      showToast('Could not create task.', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Task> }) =>
      api.patch(`/dashboard/tasks/${id}/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      showToast('Task updated successfully.');
      setEditingTask(null);
      setForm(INITIAL_FORM);
    },
    onError: () => {
      showToast('Could not update task.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dashboard/tasks/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      showToast('Task deleted successfully.');
    },
    onError: () => {
      showToast('Could not delete task.', 'error');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/dashboard/tasks/${id}/complete/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      showToast('Task marked as completed!');
    },
  });

  // Filter Tasks locally by search and priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
        (t.assigned_to_name && t.assigned_to_name.toLowerCase().includes(search.toLowerCase()));

      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, search, priorityFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Task title is required.', 'error');
      return;
    }

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      priority: (task.priority as any) || 'medium',
      status: (task.status as any) || 'pending',
      due_date: task.due_date || '',
      assigned_to: task.assigned_to || '',
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (task: Task) => {
    const confirmed = await confirm({
      title: 'Delete Task?',
      message: `Are you sure you want to delete "${task.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (confirmed) {
      deleteMutation.mutate(task.id);
    }
  };

  const handleStatusChange = (task: Task, newStatus: 'pending' | 'in_progress' | 'completed') => {
    if (newStatus === 'completed') {
      completeMutation.mutate(task.id);
    } else {
      updateMutation.mutate({ id: task.id, payload: { status: newStatus } });
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            Task Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track operational tasks, assign team members, and manage priorities across projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              if (showForm && editingTask) {
                setEditingTask(null);
                setForm(INITIAL_FORM);
              }
              setShowForm(!showForm);
            }}
            className="h-9 gap-1.5 bg-[#c85a17] hover:bg-[#b04a10] text-white shadow-sm"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Close Form' : 'Create Task'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tasks</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</h3>
            <p className="text-xs text-slate-400 mt-0.5">In current view</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            {metrics.total}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{metrics.pending}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Awaiting action</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">In Progress</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{metrics.inProgress}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Actively worked on</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Play className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{metrics.completed}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Finished tasks</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { key: 'all', label: 'All Tasks' },
            { key: 'pending', label: 'Pending' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === tab.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Priority Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, details, assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitForm}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              {editingTask ? <Edit3 className="h-4 w-4 text-blue-600" /> : <Plus className="h-4 w-4 text-[#c85a17]" />}
              {editingTask ? 'Edit Task Details' : 'Create New Task'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTask(null);
                setForm(INITIAL_FORM);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Follow up on payment recovery for Client ABC"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign To</label>
              <select
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">Unassigned (Me)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Additional instructions or background info..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setEditingTask(null);
                setForm(INITIAL_FORM);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-[#c85a17] hover:bg-[#b04a10] text-white"
            >
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      )}

      {/* Tasks Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="px-5 py-3.5">Task</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Assignee</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading tasks...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-700">No tasks found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || priorityFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try clearing your filters or search terms.'
                        : 'Create your first task to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-slate-400 mt-0.5">{task.description}</div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                          task.priority === 'high'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : task.priority === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {task.due_date ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(task.due_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as any)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-transparent outline-none cursor-pointer ${
                          task.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {task.assigned_to_name ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {task.assigned_to_name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => completeMutation.mutate(task.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition"
                            title="Mark Complete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditClick(task)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit Task"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(task)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
