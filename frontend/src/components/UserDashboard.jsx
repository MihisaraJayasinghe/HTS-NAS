import { useEffect, useMemo, useState } from 'react';
import FileManager from './FileManager.jsx';
import AccessList from './AccessList.jsx';
import ChangePasswordForm from './ChangePasswordForm.jsx';

const normalizePath = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
};

const UserDashboard = ({ user, onLogout, onPasswordChange }) => {
  const accessList = Array.isArray(user.access) ? user.access : [];
  const [selectedPath, setSelectedPath] = useState(accessList[0]?.path || '');

  useEffect(() => {
    setSelectedPath(accessList[0]?.path || '');
  }, [user.username, accessList]);

  const passwordLookup = useMemo(() => {
    return (path) => {
      const normalized = normalizePath(path);
      const match = accessList.find((entry) => normalizePath(entry.path || '') === normalized);
      return match?.password;
    };
  }, [accessList]);

  const hasAssignedAccess = accessList.length > 0;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Welcome, {user.username}</h1>
          <p className="muted">Browse and manage the folders shared with your account.</p>
        </div>
        <button type="button" className="button danger" onClick={onLogout}>
          Sign out
        </button>
      </header>

      <section className="dashboard-section">
        <AccessList access={accessList} selectedPath={selectedPath} onSelect={setSelectedPath} />
      </section>

      {hasAssignedAccess && (
        <section className="dashboard-section">
          <FileManager
            title="Your file explorer"
            subtitle="All changes you make stay within your assigned folders."
            initialPath={selectedPath}
            rootPath={selectedPath}
            allowLockToggle={false}
            passwordLookup={passwordLookup}
          />
        </section>
      )}

      <section className="dashboard-section">
        <ChangePasswordForm title="Update your password" onSubmit={onPasswordChange} />
      </section>
    </div>
  );
};

export default UserDashboard;
