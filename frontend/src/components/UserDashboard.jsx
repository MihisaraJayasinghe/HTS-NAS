import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FileManager from './FileManager.jsx';
import AccessList from './AccessList.jsx';
import ChangePasswordForm from './ChangePasswordForm.jsx';
import ProtocolHub from './ProtocolHub.jsx';
 

const HUB_MAILBOXES = [
  {
    id: 'leaders',
    icon: '🏛️',
    title: 'Leadership Desk',
    email: 'leaders@hts-nas.com',
    tag: 'All hands',
  },
  {
    id: 'support',
    icon: '🛰️',
    title: 'Floor Support',
    email: 'support@hts-nas.com',
    tag: '24·7',
  },
  {
    id: 'people',
    icon: '🌱',
    title: 'People Pulse',
    email: 'people@hts-nas.com',
    tag: 'Care',
  },
  {
    id: 'finance',
    icon: '💳',
    title: 'Finance Loop',
    email: 'finance@hts-nas.com',
    tag: 'Clear',
  },
  {
    id: 'operations',
    icon: '🏭',
    title: 'Operations Hub',
    email: 'operations@hts-nas.com',
    tag: 'Ops',
  },
  {
    id: 'training',
    icon: '🎓',
    title: 'Learning Lab',
    email: 'training@hts-nas.com',
    tag: 'Upskill',
  },
  {
    id: 'events',
    icon: '🎉',
    title: 'Culture & Events',
    email: 'events@hts-nas.com',
    tag: 'Pulse',
  },
];

const HUB_EVENTS = [
  {
    id: 'townhall',
    icon: '🎤',
    title: 'Townhall Live',
    detail: 'Skyline Hall · 3 PM',
    date: 'Apr 24',
  },
  {
    id: 'csr',
    icon: '🤝',
    title: 'CSR Volunteering',
    detail: 'Sign-ups close Fri',
    date: 'Apr 26',
  },
  {
    id: 'maintenance',
    icon: '🛠️',
    title: 'Network Maintenance',
    detail: '02:00–03:00 · IT',
    date: 'Apr 27',
  },
];

const HUB_CHAT_THREADS = {
  channels: [
    { id: 'floor', icon: '🛰️', name: '#floor-support', detail: '38 on deck', status: 'Live' },
    { id: 'launch', icon: '🚀', name: '#client-launch', detail: '12 prepping', status: 'Focus' },
  ],
  direct: [
    { id: 'hr', icon: '👤', name: 'Priya · HR', detail: 'DM · online', status: 'Now' },
    { id: 'it', icon: '👤', name: 'Ravi · IT Ops', detail: 'DM · secure', status: 'Ping' },
  ],
};
 

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
  const filePanelRef = useRef(null);

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

  const handleLaunchStorage = useCallback(
    (departmentId = '') => {
      if (!hasAssignedAccess) {
        return;
      }

      const sanitize = (value = '') =>
        normalizePath(value)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

      const normalizedDepartment = sanitize(departmentId);

      const targetEntry =
        accessList.find((entry) => {
          if (!normalizedDepartment) {
            return false;
          }
          const normalizedPath = sanitize(entry.path || '');
          return normalizedPath.includes(normalizedDepartment);
        }) || accessList[0];

      if (targetEntry) {
        setSelectedPath(targetEntry.path || '');
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            filePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      }
    },
    [accessList, hasAssignedAccess, setSelectedPath]
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-copy">
          <span className="hub-kicker">HTS Employee Web Hub</span>
          <h1>Welcome, {user.username}</h1>
          <p className="muted">Protocols, storage, and comms all launch from here.</p>
          <div className="hub-meta">
            <span className="hub-pill">Protocols</span>
            <span className="hub-pill">HTS NAS</span>
            <span className="hub-pill">Events</span>
            <span className="hub-pill">Connect</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="header-card" aria-label="Hub status">
            <span className="header-card-icon" aria-hidden="true">
              🛰️
            </span>
            <div className="header-card-copy">
              <span className="header-card-title">Live</span>
              <span className="header-card-sub">Browser hub</span>
            </div>
          </div>
          <button type="button" className="button danger" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

 
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <AccessList access={accessList} selectedPath={selectedPath} onSelect={setSelectedPath} />

          {hasAssignedAccess && (
            <div className="panel file-panel" ref={filePanelRef}>
              <FileManager
                title="NAS workspace"
                subtitle="Files unlock as soon as you pick a protocol deck."
                initialPath={selectedPath}
                rootPath={selectedPath}
                allowLockToggle={false}
                passwordLookup={passwordLookup}
              />
            </div>
          )}

          <ChangePasswordForm title="Rotate your password" onSubmit={onPasswordChange} />
        </div>

        <aside className="dashboard-sidebar">
          <ProtocolHub
            hasStorageAccess={hasAssignedAccess}
            onLaunchStorage={handleLaunchStorage}
 
      <section className="dashboard-section">
        <ProtocolHub />
      </section>

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

          <div className="panel hub-card mail-card">
            <div className="panel-header">
              <div className="panel-header-icon" aria-hidden="true">
                ✉️
              </div>
              <div className="panel-header-copy">
                <h2>Mail loops</h2>
                <p>Ready inboxes for every crew.</p>
              </div>
            </div>
            <ul className="mail-list" role="list">
              {HUB_MAILBOXES.map((mailbox) => (
                <li key={mailbox.id} className="mail-item">
                  <span className="mail-icon" aria-hidden="true">
                    {mailbox.icon}
                  </span>
                  <div className="mail-body">
                    <span className="mail-title">{mailbox.title}</span>
                    <span className="mail-email">{mailbox.email}</span>
                  </div>
                  <span className="mail-tag">{mailbox.tag}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel hub-card events-card">
            <div className="panel-header">
              <div className="panel-header-icon" aria-hidden="true">
                📣
              </div>
              <div className="panel-header-copy">
                <h2>Notices</h2>
                <p>Pinned by admin.</p>
              </div>
            </div>
            <ul className="events-list" role="list">
              {HUB_EVENTS.map((event) => (
                <li key={event.id} className="event-item">
                  <span className="event-icon" aria-hidden="true">
                    {event.icon}
                  </span>
                  <div className="event-body">
                    <span className="event-title">{event.title}</span>
                    <span className="event-detail">{event.detail}</span>
                  </div>
                  <span className="event-date">{event.date}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel hub-card chat-card">
            <div className="panel-header">
              <div className="panel-header-icon" aria-hidden="true">
                💬
              </div>
              <div className="panel-header-copy">
                <h2>Team chat</h2>
                <p>Hop into crews or DMs.</p>
              </div>
            </div>
            <div className="chat-sections">
              <div className="chat-section">
                <h3>Channels</h3>
                <ul role="list">
                  {HUB_CHAT_THREADS.channels.map((thread) => (
                    <li key={thread.id} className="chat-item">
                      <span className="chat-icon" aria-hidden="true">
                        {thread.icon}
                      </span>
                      <div className="chat-body">
                        <span className="chat-name">{thread.name}</span>
                        <span className="chat-detail">{thread.detail}</span>
                      </div>
                      <span className="chat-status">{thread.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="chat-section">
                <h3>Direct</h3>
                <ul role="list">
                  {HUB_CHAT_THREADS.direct.map((thread) => (
                    <li key={thread.id} className="chat-item">
                      <span className="chat-icon" aria-hidden="true">
                        {thread.icon}
                      </span>
                      <div className="chat-body">
                        <span className="chat-name">{thread.name}</span>
                        <span className="chat-detail">{thread.detail}</span>
                      </div>
                      <span className="chat-status">{thread.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="panel-actions chat-actions">
              <button type="button" className="button secondary">
                Open chat hub
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default UserDashboard;
