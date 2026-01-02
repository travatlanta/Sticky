'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function ChangePasswordClient() {
  const { data: session, status } = useSession();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setSaving(true);

      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to change password');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSuccess('Password updated.');
    } catch (e: any) {
      setError(e?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-xl mx-auto p-6">
        <p>Loading…</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-bold">Change Password</h1>
        <p className="text-gray-600">You must be signed in to change your password.</p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Change Password</h1>
        <p className="text-gray-600">
          If your account was created with a default password, update it here.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            autoComplete="current-password"
            placeholder="Enter your current password"
          />
          <p className="text-xs text-gray-500">
            If you signed up with Google and never set a password, you can leave this blank.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Confirm new password</label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            autoComplete="new-password"
            placeholder="Repeat new password"
            required
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Update password'}
          </button>

          <Link
            href="/account"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 hover:bg-gray-50"
          >
            Back to My Account
          </Link>
        </div>
      </form>
    </div>
  );
}
