import api from '@/lib/api';
import { DashboardData, Task } from '@/interfaces/dashboard';

export const dashboardService = {
  /** Fetch complete dashboard (single request). */
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get('/dashboard/');
    // CustomJSONRenderer wraps the response in { data: ... }
    return (response.data?.data ?? response.data) as DashboardData;
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────

  async getTasks(filter: 'all' | 'today' | 'pending' | 'completed' = 'all') {
    const response = await api.get(`/dashboard/tasks/?filter=${filter}`);
    const payload = response.data?.data ?? response.data;
    return payload.tasks as Task[];
  },

  async createTask(data: {
    title: string;
    description?: string;
    due_date?: string;
    priority?: string;
  }): Promise<Task> {
    const response = await api.post('/dashboard/tasks/', data);
    return (response.data?.data ?? response.data) as Task;
  },

  async updateTask(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      due_date: string;
      status: string;
      priority: string;
    }>
  ): Promise<Task> {
    const response = await api.patch(`/dashboard/tasks/${id}/`, data);
    return (response.data?.data ?? response.data) as Task;
  },

  async completeTask(id: string): Promise<Task> {
    const response = await api.post(`/dashboard/tasks/${id}/complete/`);
    return (response.data?.data ?? response.data) as Task;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/dashboard/tasks/${id}/`);
  },

  // ── Notifications ──────────────────────────────────────────────────────────

  async getNotifications(limit = 15) {
    const response = await api.get(`/dashboard/notifications/?limit=${limit}`);
    return response.data?.data ?? response.data;
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.post(`/dashboard/notifications/${id}/read/`);
  },

  async markAllNotificationsRead(): Promise<void> {
    await api.post('/dashboard/notifications/read-all/');
  },

  // ── Search ─────────────────────────────────────────────────────────────────

  async search(query: string) {
    const response = await api.get(`/dashboard/search/?q=${encodeURIComponent(query)}`);
    return response.data?.data ?? response.data;
  },
};
