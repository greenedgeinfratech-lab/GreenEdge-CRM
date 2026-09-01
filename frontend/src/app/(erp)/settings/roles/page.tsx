'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  created_at: string;
}

interface Permission {
  id: string;
  code: string;
  module: string;
  description: string;
}

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[] });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles/'),
        api.get('/permissions/'),
      ]);
      const rolesData = rolesRes.data;
      const rawRoles = rolesData?.data?.results || rolesData?.data || rolesData?.results || rolesData;
      setRoles(Array.isArray(rawRoles) ? rawRoles : []);

      const permsData = permsRes.data;
      const rawPerms = permsData?.data?.results || permsData?.data || permsData?.results || permsData;
      setAllPermissions(Array.isArray(rawPerms) ? rawPerms : []);
    } catch (err) {
      console.error('Failed to fetch data', err);
      setRoles([]);
      setAllPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/roles/', form);
      setForm({ name: '', description: '', permissions: [] });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create role', err);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permCode: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permCode)
        ? prev.permissions.filter(p => p !== permCode)
        : [...prev.permissions, permCode],
    }));
  };

  const groupedPerms = allPermissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage roles and their associated permissions.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Role'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border rounded px-3 py-2 text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border rounded px-3 py-2 text-sm w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Permissions</label>
            <div className="space-y-4 max-h-64 overflow-y-auto border rounded p-4">
              {Object.entries(groupedPerms).map(([module, perms]) => (
                <div key={module}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 capitalize">{module}</h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((p) => (
                      <label
                        key={p.id}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border cursor-pointer ${
                          form.permissions.includes(p.code)
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(p.code)}
                          onChange={() => togglePermission(p.code)}
                          className="sr-only"
                        />
                        {p.code}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Create Role'}
            </Button>
          </div>
        </form>
      )}

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No roles found.</td></tr>
            ) : (
              roles.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{r.description || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1">
                      {(r.permissions || []).slice(0, 5).map((p: any) => (
                        <span key={typeof p === 'string' ? p : p.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {typeof p === 'string' ? p : p.code}
                        </span>
                      ))}
                      {(r.permissions || []).length > 5 && (
                        <span className="text-xs text-gray-400">+{(r.permissions || []).length - 5} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(r.created_at).toLocaleDateString()}
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
