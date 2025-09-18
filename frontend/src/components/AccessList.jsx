const AccessList = ({ access = [], selectedPath, onSelect }) => {
  if (!Array.isArray(access) || access.length === 0) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/95 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-lg">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Assigned folders</h2>
          <p className="text-sm font-medium text-slate-500">No folders have been assigned to this account yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/50 bg-white/88 p-5 shadow-xl shadow-blue-500/10 backdrop-blur-lg">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900">Assigned folders</h2>
        <p className="text-sm font-medium text-slate-500">Select a folder to browse files and see the associated password.</p>
      </div>
      <ul className="flex flex-col gap-3">
        {access.map((entry) => {
          const isActive = selectedPath === entry.path;
          return (
            <li key={entry.path || '(root)'}>
              <button
                type="button"
                className={`flex w-full flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                  isActive
                    ? 'border-blue-300 bg-blue-50/80 text-blue-700 shadow-lg shadow-blue-500/20'
                    : 'border-white/60 bg-white/80 text-slate-700 hover:border-blue-200 hover:bg-blue-50/55'
                }`}
                onClick={() => onSelect?.(entry.path)}
              >
                <span className="text-base font-bold text-slate-900">
                  {entry.path || 'Full storage access'}
                </span>
                <span className="font-mono text-xs text-slate-500">Password: {entry.password}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AccessList;
