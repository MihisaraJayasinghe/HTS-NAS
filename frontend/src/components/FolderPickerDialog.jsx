import { useEffect, useMemo, useState } from 'react';
import { listItems } from '../services/api.js';

const sanitizePath = (input) => {
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

const FolderPickerDialog = ({
  initialPath = '',
  onSelect,
  onCancel,
}) => {
  const startingPath = useMemo(() => sanitizePath(initialPath), [initialPath]);
  const [currentPath, setCurrentPath] = useState(startingPath);
  const [resolvedPath, setResolvedPath] = useState(startingPath);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    listItems(currentPath)
      .then((data) => {
        if (!active) {
          return;
        }
        const normalizedPath = sanitizePath(data.path || '');
        setResolvedPath(normalizedPath);
        setBreadcrumbs(Array.isArray(data.breadcrumbs) ? data.breadcrumbs : []);
        const directoryItems = Array.isArray(data.items)
          ? data.items.filter((item) => item?.type === 'directory')
          : [];
        setFolders(directoryItems);
        if (normalizedPath !== currentPath) {
          setCurrentPath(normalizedPath);
        }
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setError(err.message || 'Unable to load folders');
        setFolders([]);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentPath]);

  const handleNavigate = (path) => {
    const normalized = sanitizePath(path || '');
    setCurrentPath(normalized);
  };

  const handleSelect = (path) => {
    const normalized = sanitizePath(path || '');
    onSelect?.(normalized);
  };

  const handleSelectCurrent = () => {
    handleSelect(resolvedPath);
  };

  const handleSelectRoot = () => {
    handleSelect('');
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/70 backdrop-blur">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/20 bg-white/65 p-6 text-slate-900 shadow-[0_35px_70px_-30px_rgba(15,23,42,0.6)]">
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/35" aria-hidden="true" />
        <div className="relative flex flex-col gap-5">
          <header className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Select folder</h2>
              <p className="text-sm font-medium text-slate-600">
                Browse the NAS structure and pick a folder to grant access.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/40 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition hover:bg-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Close
            </button>
          </header>

          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-700">
            <button
              type="button"
              onClick={() => handleNavigate('')}
              className={`rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                !resolvedPath ? 'bg-blue-500 text-white shadow-[0_10px_30px_-18px_rgba(59,130,246,0.8)]' : 'bg-white/60 text-blue-600 hover:bg-white/80'
              }`}
            >
              Root
            </button>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <button
                  key={crumb.path}
                  type="button"
                  onClick={() => handleNavigate(crumb.path)}
                  className={`rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    isLast
                      ? 'bg-blue-500 text-white shadow-[0_10px_30px_-18px_rgba(59,130,246,0.8)]'
                      : 'bg-white/60 text-blue-600 hover:bg-white/80'
                  }`}
                >
                  {crumb.name || 'Root'}
                </button>
              );
            })}
          </nav>

          <div className="min-h-[200px] rounded-3xl border border-white/30 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            {error ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-rose-600">
                {error}
              </div>
            ) : null}
            {!error && loading ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-600">
                Loading folders…
              </div>
            ) : null}
            {!error && !loading && folders.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-600">
                No subfolders found in this location.
              </div>
            ) : null}
            {!error && !loading && folders.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {folders.map((folder) => (
                  <li key={folder.path || folder.name}>
                    <button
                      type="button"
                      onClick={() => handleNavigate(folder.path || `${resolvedPath ? `${resolvedPath}/` : ''}${folder.name}`)}
                      className="group flex w-full items-center justify-between rounded-2xl border border-white/40 bg-white/55 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-300/60 hover:bg-blue-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">
                          📁
                        </span>
                        <span>{folder.name}</span>
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600 opacity-0 transition group-hover:opacity-100">
                        Open
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-500">
              Selected path:{' '}
              <span className="font-mono text-sm text-slate-700">
                {resolvedPath || 'Root'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSelectRoot}
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/40 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition hover:bg-white/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Give full storage access
              </button>
              <button
                type="button"
                onClick={handleSelectCurrent}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_25px_55px_-24px_rgba(79,70,229,0.9)] transition hover:shadow-[0_28px_60px_-22px_rgba(79,70,229,0.95)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Use this folder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderPickerDialog;
