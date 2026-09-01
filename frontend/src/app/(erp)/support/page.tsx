'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Loader2, CheckCircle2, XCircle, MessageSquare, X } from 'lucide-react';
import { supportApi } from '@/services/crmService';

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');

  // Selected Ticket Drawer/Modal State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Fetch Tickets List
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['support-tickets', statusFilter, priorityFilter, search],
    queryFn: () => supportApi.list({ status: statusFilter, priority: priorityFilter, search }),
  });

  // Fetch Single Ticket Detail
  const { data: ticketDetailData } = useQuery({
    queryKey: ['support-ticket-detail', selectedTicketId],
    queryFn: () => (selectedTicketId ? supportApi.get(selectedTicketId) : null),
    enabled: !!selectedTicketId,
  });

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: (newTicket: any) => supportApi.create(newTicket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => supportApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-detail', selectedTicketId] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => supportApi.addComment(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket-detail', selectedTicketId] });
      setCommentText('');
    },
  });

  const resetForm = () => {
    setTitle('');
    setCustomerName('');
    setCustomerEmail('');
    setPriority('medium');
    setDescription('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    createTicketMutation.mutate({
      title,
      customer_name: customerName,
      customer_email: customerEmail,
      priority,
      description,
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !commentText.trim()) return;
    commentMutation.mutate({ id: selectedTicketId, text: commentText });
  };

  const tickets = (ticketsData?.data as any)?.data?.results || (ticketsData?.data as any)?.results || (Array.isArray(ticketsData?.data?.data) ? ticketsData.data.data : []);
  const selectedTicket = ticketDetailData?.data?.data || ticketDetailData?.data;

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700 font-bold',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span className="font-semibold">Support Ticketing</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-48 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10] transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Ticket
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'in_progress', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded text-sm font-medium capitalize ${
                statusFilter === status
                  ? 'bg-[#162032] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-700"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-gray-200 text-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3">Ticket #</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading support tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No tickets found matching the selected filters.
                </td>
              </tr>
            ) : (
              tickets.map((t: any) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className="hover:bg-gray-50 cursor-pointer text-gray-700"
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{t.ticket_no}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                  <td className="px-4 py-3 text-gray-600">{t.customer_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded capitalize ${priorityColors[t.priority] || ''}`}>
                      {t.priority_display || t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full capitalize font-medium ${statusColors[t.status] || ''}`}>
                      {t.status_display || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(t.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {t.status !== 'resolved' && t.status !== 'closed' && (
                      <button
                        onClick={() => resolveMutation.mutate(t.id)}
                        className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Details Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <span className="text-xs font-mono text-gray-400">{selectedTicket.ticket_no}</span>
                <h2 className="text-lg font-bold text-gray-800">{selectedTicket.title}</h2>
              </div>
              <button onClick={() => setSelectedTicketId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded border">
                <div>
                  <span className="text-gray-500 block">Customer:</span>
                  <span className="font-semibold text-gray-800">{selectedTicket.customer_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Priority:</span>
                  <span className="font-semibold capitalize text-gray-800">{selectedTicket.priority}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Status:</span>
                  <span className="font-semibold capitalize text-gray-800">{selectedTicket.status}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Created:</span>
                  <span className="font-semibold text-gray-800">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</h4>
                <p className="text-sm text-gray-700 bg-white border p-3 rounded">{selectedTicket.description || 'No description provided.'}</p>
              </div>

              {/* Comments / Activity Log */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Activity & Responses</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedTicket.comments?.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No comments added yet.</p>
                  ) : (
                    selectedTicket.comments?.map((c: any) => (
                      <div key={c.id} className="bg-gray-50 border p-2.5 rounded text-xs">
                        <div className="flex justify-between text-gray-400 mb-1">
                          <span className="font-semibold text-gray-700">{c.author_name}</span>
                          <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-gray-800">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="pt-2 border-t mt-auto">
                <textarea
                  rows={2}
                  placeholder="Type a response or note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full border rounded p-2 text-sm focus:outline-none focus:border-blue-500 mb-2"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={commentMutation.isPending || !commentText.trim()}
                    className="bg-[#162032] text-white text-xs px-3 py-1.5 rounded hover:bg-[#1a2b4c] disabled:opacity-50"
                  >
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-800">Add Support Ticket</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject / Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inverter Installation Error #402"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Details</label>
                <textarea
                  rows={3}
                  placeholder="Provide detailed information regarding the problem..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="px-4 py-1.5 rounded text-sm bg-[#c85a17] text-white font-medium hover:bg-[#b04a10] disabled:opacity-50"
                >
                  {createTicketMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
