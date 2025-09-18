import { useEffect, useMemo, useState } from 'react';
import FileManager from './FileManager.jsx';
import AccessList from './AccessList.jsx';
import ChangePasswordForm from './ChangePasswordForm.jsx';
import ProtocolHub from './ProtocolHub.jsx';
import NoticeBoard from './NoticeBoard.jsx';

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
    <div className="flex flex-col gap-6 lg:gap-7">
      <header className="flex flex-col gap-4 rounded-2xl border border-white/40 bg-white/85 p-5 shadow-xl shadow-blue-500/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[2rem]">
            Welcome, {user.username}
          </h1>
          <p className="text-sm font-medium text-slate-500 sm:text-base">
            Browse and manage the folders shared with your account.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center justify-center rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        >
          Sign out
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <section>
            <AccessList access={accessList} selectedPath={selectedPath} onSelect={setSelectedPath} />
          </section>

          {hasAssignedAccess && (
            <section>
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
        </div>

        <div className="flex flex-col gap-6">
          <section>
            <ProtocolHub />
          </section>

          <section>
            <NoticeBoard currentUser={user} />
          </section>

          <section>
            <ChangePasswordForm title="Update your password" onSubmit={onPasswordChange} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
