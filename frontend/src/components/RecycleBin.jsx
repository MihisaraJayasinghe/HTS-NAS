import { RotateCcw, Trash2, RefreshCw } from 'lucide-react';
import formatBytes from '../utils/formatBytes.js';

const formatTimestamp = (value) => {
  if (!value) {
    return 'Unknown time';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }
  return date.toLocaleString();
};

const formatLocation = (entry) => {
  if (entry?.originalParent) {
    return `/${entry.originalParent}`;
  }
  if (entry?.originalPath) {
    return `/${entry.originalPath}`;
  }
  return 'Home';
};

const formatType = (type) => (type === 'directory' ? 'Folder' : 'File');

const RecycleBin = ({
  items = [],
  loading = false,
  errorMessage = '',
  onRefresh,
  onRestore,
  onDelete,
}) => {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <div className="rounded-2xl border border-white/25 bg-white/30 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Deleted items</h2>
          <p className="text-xs font-medium text-slate-600">
            Only items you deleted appear here. Admins can see all deleted files.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-100/60 px-3 py-2 text-sm font-semibold text-blue-900 shadow-inner transition hover:bg-blue-200/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-rose-200/70 bg-rose-100/80 px-4 py-3 text-sm font-semibold text-rose-600 shadow-[0_12px_30px_-18px_rgba(244,63,94,0.45)]" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-white/25 bg-white/40 text-sm font-semibold text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
          Loading recycle bin…
        </div>
      ) : hasItems ? (
        <div className="space-y-3">
          {items.map((item) => {
            const sizeLabel = item.type === 'directory' || item.size == null ? '—' : formatBytes(item.size);
            const deletedLabel = formatTimestamp(item.deletedAt);
            const locationLabel = formatLocation(item);
            return (
              <div
                key={item.id}
                className="rounded-xl border border-white/20 bg-white/45 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                    <div className="text-xs font-medium uppercase tracking-[0.25em] text-blue-500">
                      {formatType(item.type)}
                    </div>
                    <div className="text-xs text-slate-600">
                      Deleted {deletedLabel}
                    </div>
                    <div className="text-xs text-slate-600">
                      Original location: {locationLabel}
                    </div>
                    {item.owner ? (
                      <div className="text-xs text-slate-600">Deleted by: {item.owner}</div>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <span className="rounded-full border border-white/40 bg-white/40 px-3 py-1 text-xs font-semibold text-slate-700 shadow-inner">
                      Size: {sizeLabel}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onRestore?.(item)}
                        className="inline-flex items-center gap-1 rounded-xl border border-emerald-300/70 bg-emerald-100/70 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-inner transition hover:bg-emerald-200/80"
                      >
                        <RotateCcw size={16} />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete?.(item)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-300/70 bg-rose-100/70 px-3 py-2 text-sm font-semibold text-rose-700 shadow-inner transition hover:bg-rose-200/80"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-white/20 bg-white/40 px-4 py-10 text-center text-sm font-medium text-slate-600 shadow-inner">
          No deleted items found. When you delete files, they will appear here until you restore or remove them permanently.
        </div>
      )}
    </div>
  );
};

export default RecycleBin;

