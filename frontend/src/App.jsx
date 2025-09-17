import { useCallback, useEffect, useState } from 'react';
import AdminDashboard from './components/AdminDashboard.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import LoginForm from './components/LoginForm.jsx';
import {
  setAuthToken,
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  changeMyPassword,
} from './services/api.js';

const AUTH_TOKEN_KEY = 'hts-auth-token';

const App = () => {
  const [authState, setAuthState] = useState({ status: 'loading', user: null, token: '' });
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_TOKEN_KEY) : '';
    if (!token) {
      setAuthState({ status: 'guest', user: null, token: '' });
      return;
    }
    setAuthToken(token);
    getCurrentUser()
      .then((data) => {
        setAuthState({ status: 'authenticated', user: data.user, token });
      })
      .catch(() => {
        setAuthToken('');
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(AUTH_TOKEN_KEY);
        }
        setAuthState({ status: 'guest', user: null, token: '' });
      });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (authState.status === 'authenticated') {
        await apiLogout();
      }
    } catch (err) {
      // ignore logout errors
    } finally {
      setAuthToken('');
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      }
      setAuthState({ status: 'guest', user: null, token: '' });
    }
  }, [authState.status]);

  const refreshUser = useCallback(async () => {
    if (!authState.token) {
      return;
    }
    try {
      const data = await getCurrentUser();
      setAuthState((prev) => ({ status: 'authenticated', user: data.user, token: prev.token }));
    } catch (err) {
      handleLogout();
    }
  }, [authState.token, handleLogout]);

  const handleLogin = async ({ username, password }) => {
    try {
      setAuthError('');
      const { token, user } = await apiLogin(username, password);
      setAuthToken(token);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      }
      setAuthState({ status: 'authenticated', user, token });
    } catch (err) {
      setAuthError(err.message || 'Unable to sign in');
    }
  };

  const handlePasswordChange = async ({ currentPassword, newPassword }) => {
    await changeMyPassword(currentPassword, newPassword);
    await refreshUser();
  };

  if (authState.status === 'loading') {
    return (
      <div className="app-container centered">
        <div className="loading">Loading…</div>
      </div>
    );
  }

  if (authState.status !== 'authenticated' || !authState.user) {
    return (
      <div className="app-container centered auth-layout">
        <LoginForm onSubmit={handleLogin} error={authError} />
      </div>
    );
  }

  const { user } = authState;
  if (user.role === 'admin') {
    return (
      <div className="app-container dashboard-container">
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          onPasswordChange={handlePasswordChange}
          onRefreshUser={refreshUser}
        />
      </div>
    );
  }

  return (
    <div className="app-container dashboard-container">
      <UserDashboard
        user={user}
        onLogout={handleLogout}
        onPasswordChange={handlePasswordChange}
        onRefreshUser={refreshUser}
      />
    </div>
  );
};

export default App;
