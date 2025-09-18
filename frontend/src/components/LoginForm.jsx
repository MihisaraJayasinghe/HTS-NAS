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
    <form
      className="flex w-full flex-col gap-5 rounded-3xl border border-white/50 bg-gradient-to-br from-white/90 via-white/80 to-blue-50/70 p-6 shadow-2xl shadow-blue-500/10 backdrop-blur-xl sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Sign in to HTS NAS
        </h1>
        <p className="text-sm font-medium text-slate-500 sm:text-base">
          Enter your account credentials to access the dashboard.
        </p>
      </div>
      {(error || localError) && (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 shadow-sm shadow-rose-200/60"
          role="alert"
        >
          {error || localError}
        </div>
      )}
      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
        <span>Username</span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          placeholder="e.g. Admin"
          className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-base font-medium text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="Your password"
          className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-base font-medium text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
        />
      </label>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        Sign In
      </button>
      <p className="rounded-2xl bg-slate-900/5 px-4 py-3 text-sm font-medium text-slate-600">
        Try the default admin account: <strong className="font-semibold text-slate-900">Admin / HTS</strong>
      </p>
    </form>
  );
};

export default LoginForm;
