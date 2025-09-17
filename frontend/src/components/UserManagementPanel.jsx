import { useEffect, useState } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/api.js';

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

const initialNewUser = {
  username: '',
  password: '',
  role: 'user',
};

const UserManagementPanel = ({ onUsersChanged }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [accessDraft, setAccessDraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState(initialNewUser);
  const [savingAccess, setSavingAccess] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUsers();
      const sorted = (data.users || []).slice().sort((a, b) => a.username.localeCompare(b.username));
      setUsers(sorted);
      if (sorted.length === 0) {
        setSelectedUsername('');
        setAccessDraft([]);
        return;
      }
      const existing = sorted.find((user) => user.username === selectedUsername);
      const activeUser = existing || sorted[0];
      setSelectedUsername(activeUser.username);
      setAccessDraft(activeUser.access ? activeUser.access.map((entry) => ({ ...entry })) : []);
    } catch (err) {
      setError(err.message || 'Unable to load users.');
      setUsers([]);
      setSelectedUsername('');
      setAccessDraft([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!message) {
      return undefined;
    }
    const timeout = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(timeout);
  }, [message]);

  const selectedUser = users.find((user) => user.username === selectedUsername) || null;

  const handleSelectUser = (username) => {
    setSelectedUsername(username);
    const target = users.find((user) => user.username === username);
    setAccessDraft(target?.access ? target.access.map((entry) => ({ ...entry })) : []);
  };

  const handleAccessChange = (index, field, value) => {
    setAccessDraft((entries) =>
      entries.map((entry, idx) => (idx === index ? { ...entry, [field]: value } : entry))
    );
  };

  const handleRemoveAccess = (index) => {
    setAccessDraft((entries) => entries.filter((_, idx) => idx !== index));
  };

  const handleAddAccess = () => {
    setAccessDraft((entries) => [...entries, { path: '', password: '' }]);
  };

  const handleSaveAccess = async () => {
    if (!selectedUser) {
      return;
    }
    setError('');
    setMessage('');
    const formatted = accessDraft.map((entry) => ({
      path: normalizePath(entry.path || ''),
      password: (entry.password || '').trim(),
    }));
    if (formatted.some((entry) => !entry.password)) {
      setError('Every folder access must include a password.');
      return;
    }
    setSavingAccess(true);
    try {
      await updateUser(selectedUser.username, { access: formatted });
      setMessage('Updated folder access.');
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to update folder access.');
    } finally {
      setSavingAccess(false);
    }
  };

  const handleRoleChange = async (event) => {
    const role = event.target.value;
    if (!selectedUser || role === selectedUser.role) {
      return;
    }
    setError('');
    setMessage('');
    setUpdatingUser(true);
    try {
      await updateUser(selectedUser.username, { role });
      setMessage(`Updated role for ${selectedUser.username}.`);
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to update role.');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) {
      return;
    }
    setError('');
    setMessage('');
    const password = window.prompt(`Enter a new password for ${selectedUser.username}`);
    if (!password) {
      setMessage('Password update cancelled.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    setUpdatingUser(true);
    try {
      await updateUser(selectedUser.username, { password });
      setMessage(`Password updated for ${selectedUser.username}.`);
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || selectedUser.username === 'Admin') {
      return;
    }
    setError('');
    setMessage('');
    const confirmed = window.confirm(`Remove user “${selectedUser.username}”?`);
    if (!confirmed) {
      return;
    }
    setUpdatingUser(true);
    try {
      await deleteUser(selectedUser.username);
      setMessage(`Removed ${selectedUser.username}.`);
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to delete user.');
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    const username = newUser.username.trim();
    const password = newUser.password;
    const role = newUser.role === 'admin' ? 'admin' : 'user';
    setError('');
    setMessage('');
    if (!username || !password) {
      setError('Username and password are required to create a user.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    setCreating(true);
    try {
      await createUser({ username, password, role });
      setMessage(`Created user ${username}.`);
      setNewUser(initialNewUser);
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to create user.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="user-management-wrapper">
      <div className="panel user-management-panel">
        <div className="panel-header">
          <h2>User management</h2>
          <p>Review accounts, assign folder access, and manage credentials.</p>
        </div>
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="alert success" role="status">
            {message}
          </div>
        )}
        <div className="panel-content user-management">
          <div className="user-list">
            {loading ? (
              <div className="loading small">Loading users…</div>
            ) : (
              <ul>
                {users.map((user) => (
                  <li key={user.username}>
                    <button
                      type="button"
                      className={`user-tab${user.username === selectedUsername ? ' active' : ''}`}
                      onClick={() => handleSelectUser(user.username)}
                    >
                      <span>{user.username}</span>
                      <span className="badge">{user.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="user-details">
            {selectedUser ? (
              <>
                <div className="user-summary">
                  <div>
                    <h3>{selectedUser.username}</h3>
                    <p className="muted">
                      Created {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '—'}
                    </p>
                    <p className="muted">
                      Updated {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <label className="field">
                    <span>Role</span>
                    <select
                      value={selectedUser.role}
                      onChange={handleRoleChange}
                      disabled={updatingUser || selectedUser.username === 'Admin'}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                </div>
                <div className="access-editor">
                  <h4>Folder access</h4>
                  {accessDraft.length === 0 && <p className="muted">No folders assigned yet.</p>}
                  {accessDraft.map((entry, index) => (
                    <div className="access-editor-row" key={`${entry.path}-${index}`}>
                      <input
                        type="text"
                        value={entry.path}
                        onChange={(event) => handleAccessChange(index, 'path', event.target.value)}
                        placeholder="Folder path (e.g. Projects/TeamA)"
                      />
                      <input
                        type="text"
                        value={entry.password}
                        onChange={(event) => handleAccessChange(index, 'password', event.target.value)}
                        placeholder="Password"
                      />
                      <button
                        type="button"
                        className="button subtle"
                        onClick={() => handleRemoveAccess(index)}
                        disabled={savingAccess}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="access-editor-actions">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={handleAddAccess}
                      disabled={savingAccess}
                    >
                      Add folder
                    </button>
                    <button
                      type="button"
                      className="button"
                      onClick={handleSaveAccess}
                      disabled={savingAccess}
                    >
                      {savingAccess ? 'Saving…' : 'Save access'}
                    </button>
                  </div>
                </div>
                <div className="user-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={handleResetPassword}
                    disabled={updatingUser}
                  >
                    Reset password
                  </button>
                  <button
                    type="button"
                    className="button danger"
                    onClick={handleDeleteUser}
                    disabled={selectedUser.username === 'Admin' || updatingUser}
                  >
                    Delete user
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">Select a user to view details.</p>
            )}
          </div>
        </div>
      </div>
      <form className="panel create-user-panel" onSubmit={handleCreateUser}>
        <div className="panel-header">
          <h2>Create new user</h2>
          <p>Add a new account and assign access later.</p>
        </div>
        <div className="panel-content grid">
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={newUser.username}
              onChange={(event) => setNewUser((state) => ({ ...state, username: event.target.value }))}
              placeholder="Unique username"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={newUser.password}
              onChange={(event) => setNewUser((state) => ({ ...state, password: event.target.value }))}
              placeholder="Temporary password"
            />
          </label>
          <label className="field">
            <span>Role</span>
            <select
              value={newUser.role}
              onChange={(event) => setNewUser((state) => ({ ...state, role: event.target.value }))}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <div className="panel-actions">
          <button type="submit" className="button" disabled={creating}>
            {creating ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserManagementPanel;
