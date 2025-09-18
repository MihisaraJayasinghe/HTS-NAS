import { useState } from 'react';

const ChangePasswordForm = ({ title = 'Change Password', onSubmit }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ error: '', success: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ error: '', success: '' });
    if (!currentPassword || !newPassword) {
      setStatus({ error: 'Please provide your current and new password.', success: '' });
      return;
    }
    if (newPassword.length < 4) {
      setStatus({ error: 'New password must be at least 4 characters long.', success: '' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ error: 'The new password and confirmation do not match.', success: '' });
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({ currentPassword, newPassword });
      setStatus({ error: '', success: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatus({ error: err.message || 'Unable to update password.', success: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-5 rounded-2xl border border-white/50 bg-white/88 p-5 shadow-xl shadow-blue-500/10 backdrop-blur-lg"
      onSubmit={handleSubmit}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
        <p className="text-sm font-medium text-slate-500">
          Update your account password to keep your storage secure.
        </p>
      </div>
      {status.error && (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 shadow-sm"
          role="alert"
        >
          {status.error}
        </div>
      )}
      {status.success && (
        <div
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-sm"
          role="status"
        >
          {status.success}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600 sm:text-sm">
          <span>Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Current password"
            className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600 sm:text-sm">
          <span>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="New password"
            className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600 sm:text-sm sm:col-span-2">
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Confirm password"
            className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          />
        </label>
      </div>
      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
