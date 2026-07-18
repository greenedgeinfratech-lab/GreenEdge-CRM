import { User } from '@/interfaces/user';
import usersMockData from '@/data/mock/users.json';
import api from '@/lib/api';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const userService = {
  /**
   * Fetch all users
   */
  async getUsers(): Promise<User[]> {
    await delay(500); // simulate API latency
    return usersMockData as User[];
  },

  /**
   * Fetch a single user by ID
   */
  async getUserById(id: string): Promise<User | undefined> {
    await delay(300);
    return (usersMockData as User[]).find(user => user.id === id);
  }
};

export const usersApi = {
  listEmployees: (params?: Record<string, any>) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api.get(`/employees/${q ? `?${q}` : ''}`);
  }
};
