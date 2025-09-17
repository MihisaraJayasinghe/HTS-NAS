import { useState } from 'react';

const LoginForm = ({ onSubmit, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setLocalError('Please enter both username and password.');
      return;
    }
    setLocalError('');
    onSubmit({ username: username.trim(), password });
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <h1>Sign in to HTS NAS</h1>
      <p className="auth-subtitle">Enter your account credentials to access the dashboard.</p>
      {(error || localError) && (
        <div className="alert error" role="alert">
          {error || localError}
        </div>
      )}
      <label className="field">
        <span>Username</span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          placeholder="e.g. Admin"
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="Your password"
        />
      </label>
      <button type="submit" className="button primary-button">
        Sign In
      </button>
      <p className="login-hint">
        Try the default admin account: <strong>Admin / HTS</strong>
      </p>
    </form>
  );
};

export default LoginForm;
