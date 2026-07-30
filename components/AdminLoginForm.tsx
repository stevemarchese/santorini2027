'use client';
import { useState, type FormEvent } from 'react';

export default function AdminLoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        window.location.reload();
      } else {
        setError('Incorrect password');
      }
    } catch {
      setError('Something went wrong — please try again');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-24 max-w-xs">
      <label htmlFor="adminPassword" className="block text-sm font-semibold uppercase tracking-wide text-sage">
        Admin password
      </label>
      <input
        id="adminPassword"
        type="password"
        className="mt-1 w-full border-b border-cream/35 bg-transparent px-1 py-2 text-cream outline-none"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button type="submit" className="mt-4 bg-terracotta px-5 py-2 text-xs font-bold uppercase tracking-wide text-cream">
        Enter
      </button>
      {error && <p className="mt-2 text-xs text-terracotta">{error}</p>}
    </form>
  );
}
