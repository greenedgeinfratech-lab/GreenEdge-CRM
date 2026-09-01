'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import Link from 'next/link';

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  employment_status: string;
  department_name?: string;
  designation_name?: string;
  created_at: string;
}

export default function EmployeesSettingsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEmployees = async (q = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/employees/?search=${q}`);
      const resData = res.data;
      const rawList = resData?.data?.results || resData?.data || resData?.results || resData;
      setEmployees(Array.isArray(rawList) ? rawList : []);
    } catch (err) {
      console.error('Failed to fetch employees', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees(search);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}/`);
      fetchEmployees();
    } catch (err) {
      console.error('Failed to delete employee', err);
    }
  };

  const employeeList = Array.isArray(employees) ? employees : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage employee profiles and records.</p>
        </div>
        <Link
          href="/settings/employees/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          + Add Employee
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <form onSubmit={handleSearch} className="flex-1 max-w-sm flex space-x-2">
          <input
            type="text"
            placeholder="Search employees..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td></tr>
            ) : employeeList.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No employees found.</td></tr>
            ) : (
              employeeList.map((e) => (
                <tr key={e.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{e.employee_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.first_name} {e.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.mobile || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.department_name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      e.employment_status === 'Active' ? 'bg-green-100 text-green-800' :
                      e.employment_status === 'On Leave' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {e.employment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/settings/employees/new?id=${e.id}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
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
  );
}
