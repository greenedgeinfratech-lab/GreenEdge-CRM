'use client';

import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Plus, CheckCircle2, Circle, Trash2, Edit2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Task, TasksData } from '@/interfaces/dashboard';
import { dashboardService } from '@/services/dashboardService';
import { TasksSkeleton } from '../skeletons/WidgetSkeleton';

interface Props {
  data?: TasksData;
  isLoading: boolean;
  error?: Error | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-orange-400',
  low: 'text-blue-400',
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function TasksWidget({ data, isLoading, error }: Props) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['dashboard'] });

  const createMutation = useMutation({
    mutationFn: dashboardService.createTask,
    onSuccess: () => {
      setShowAdd(false);
      setNewTitle('');
      setNewDueDate('');
      invalidate();
    },
  });

  const completeMutation = useMutation({
    mutationFn: dashboardService.completeTask,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: dashboardService.deleteTask,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      dashboardService.updateTask(id, { title }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  if (isLoading) return (
    <div className="bg-white border border-gray-200 rounded shadow-sm flex flex-col">
      <TasksSkeleton />
    </div>
  );

  const items = data?.items ?? [];
  const summary = data?.summary;

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-gray-800 font-semibold text-lg">Tasks</h2>
          {summary && (
            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
              {summary.pending_count + summary.in_progress_count}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Summary pills */}
      {summary && (
        <div className="flex gap-2 mb-3">
          <span className="text-[10px] bg-yellow-50 text-yellow-600 border border-yellow-200 px-2 py-0.5 rounded-full">
            Today: {summary.today_count}
          </span>
          <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
            Pending: {summary.pending_count}
          </span>
          <span className="text-[10px] bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">
            Done: {summary.completed_today_count}
          </span>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3 space-y-1.5">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-green-500"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-green-500"
            />
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex gap-1 justify-end">
            <button
              onClick={() => setShowAdd(false)}
              className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate({ title: newTitle, due_date: newDueDate || undefined, priority: newPriority })}
              disabled={!newTitle.trim() || createMutation.isPending}
              className="text-xs bg-[#1a2b4c] text-white px-3 py-1 rounded hover:bg-[#111c33] disabled:opacity-50"
            >
              {createMutation.isPending ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-48">
        {error ? (
          <div className="flex items-center gap-2 text-orange-500 text-xs py-4 justify-center">
            <AlertCircle className="w-4 h-4" />
            Could not load tasks.
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-gray-200 mb-2" />
            <div className="text-gray-600 font-medium text-sm">No tasks found</div>
            <div className="text-gray-400 text-xs mt-1">You&apos;re all caught up!</div>
          </div>
        ) : (
          items.map(task => (
            <div
              key={task.id}
              className="flex items-start gap-2 py-1.5 px-1 rounded hover:bg-gray-50 group"
            >
              {/* Complete button */}
              <button
                onClick={() => task.status !== 'completed' && completeMutation.mutate(task.id)}
                className="mt-0.5 flex-shrink-0"
                disabled={task.status === 'completed'}
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 hover:text-green-400 transition-colors" />
                )}
              </button>

              {/* Title / edit */}
              <div className="flex-1 min-w-0">
                {editingId === task.id ? (
                  <div className="flex gap-1">
                    <input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="flex-1 text-xs border border-gray-300 rounded px-1.5 py-0.5"
                      autoFocus
                    />
                    <button
                      onClick={() => updateMutation.mutate({ id: task.id, title: editTitle })}
                      className="text-[10px] bg-green-600 text-white px-2 rounded"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p className={`text-xs truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {task.title}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                  {task.due_date && (
                    <span className="text-[10px] text-gray-400">{formatDate(task.due_date)}</span>
                  )}
                  <span className={`text-[10px] font-medium ${PRIORITY_COLORS[task.priority] ?? ''}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingId(task.id); setEditTitle(task.title); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(task.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="mt-3 w-full bg-[#1a2b4c] text-white py-2 rounded text-sm font-medium hover:bg-[#111c33] flex justify-center items-center"
      >
        <Plus className="w-4 h-4 mr-1" /> Add Task
      </button>
    </div>
  );
}
