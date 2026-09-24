'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/app/actions';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await loginAdmin(password);
      if (result.success) {
        toast.success('Logged in successfully');
        router.push('/riklicreationadminpafe2021222324');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4 text-black">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full border p-2 rounded-lg mb-4 text-black placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-brand" 
            placeholder="Password" 
            autoFocus
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand text-white p-2 rounded-lg font-medium disabled:opacity-70 transition-opacity"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
