'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      await api.post('/auth/forgot-password/', { email });
      setMessage('If an account with that email exists, we have sent a password reset link.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Reset Password</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enter your email to receive a reset link</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {message && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <div className="mt-1">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full"
            />
          </div>
        </div>

        <div>
          <Button type="submit" className="w-full flex justify-center py-2 px-4" disabled={loading || !!message}>
            {loading ? 'Sending link...' : 'Send reset link'}
          </Button>
        </div>
        
        <div className="text-center mt-4">
          <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
