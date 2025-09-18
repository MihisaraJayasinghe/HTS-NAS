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
    <form className="panel" onSubmit={handleSubmit}>
      <div className="panel-header">
        <h2>{title}</h2>
        <p>Update your account password to keep your storage secure.</p>
      </div>
      {status.error && (
        <div className="alert error" role="alert">
          {status.error}
        </div>
      )}
      {status.success && (
        <div className="alert success" role="status">
          {status.success}
        </div>
      )}
      <div className="panel-content grid">
        <label className="field">
          <span>Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Current password"
          />
        </label>
        <label className="field">
          <span>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="New password"
          />
        </label>
        <label className="field">
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Confirm password"
          />
        </label>
      </div>
      <div className="panel-actions">
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
