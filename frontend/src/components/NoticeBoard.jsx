import { useCallback, useEffect, useState } from 'react';
import { fetchNotices, createNotice } from '../services/api.js';

const formatTimestamp = (timestamp) => {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
};

const NoticeBoard = ({ currentUser }) => {
  const username = currentUser?.username || '';
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const loadNotices = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const data = await fetchNotices();
      const items = Array.isArray(data.notices) ? data.notices : [];
      const sorted = [...items].sort((a, b) => {
        const timeA = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
      setNotices(sorted);
      return true;
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Unable to load notices');
      }
      return false;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadNotices();
    const interval = setInterval(() => {
      if (!isMounted) {
        return;
      }
      loadNotices({ silent: true });
    }, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadNotices]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmed = draft.trim();
      if (!trimmed || isPosting) {
        return;
      }
      setIsPosting(true);
      setError('');
      try {
        const response = await createNotice(trimmed);
        const newNotice = response?.notice;
        if (newNotice) {
          setNotices((current) => {
            const withoutDuplicate = current.filter((item) => item.id !== newNotice.id);
            return [newNotice, ...withoutDuplicate].sort((a, b) => {
              const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
              const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
              return timeB - timeA;
            });
          });
        } else {
          await loadNotices({ silent: true });
        }
        setDraft('');
      } catch (err) {
        setError(err.message || 'Unable to post notice');
      } finally {
        setIsPosting(false);
      }
    },
    [draft, isPosting, loadNotices]
  );

  const isSubmittingDisabled = !draft.trim() || isPosting;

  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-white/50 bg-white/88 p-5 shadow-xl shadow-blue-500/10 backdrop-blur-lg">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Team notices</h2>
        <p className="text-sm font-medium text-slate-500">Share quick updates that everyone can see.</p>
      </div>
      {error && (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 shadow-sm shadow-rose-200/60"
          role="alert"
        >
          {error}
        </div>
      )}
      <div
        className="flex flex-1 flex-col gap-4 rounded-2xl border border-dashed border-blue-200/50 bg-blue-50/40 p-4"
        aria-live="polite"
      >
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-500">
            Loading notices…
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-500">
            No notices yet. Be the first to post.
          </div>
        ) : (
          <ul className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1 text-sm">
            {notices.map((notice) => {
              const isOwnNotice = notice.author === username;
              const displayName = isOwnNotice ? 'You' : notice.author;
              return (
                <li
                  key={notice.id}
                  className={`rounded-2xl border px-4 py-3 shadow-sm transition ${
                    isOwnNotice
                      ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700 shadow-emerald-200/50'
                      : 'border-blue-200 bg-white/90 text-slate-700 shadow-slate-200/60'
                  }`}
                >
                  <div className="flex items-baseline gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <span className="text-slate-600">{displayName}</span>
                    {notice.timestamp && (
                      <time dateTime={notice.timestamp} className="text-slate-400">
                        {formatTimestamp(notice.timestamp)}
                      </time>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700 whitespace-pre-wrap">
                    {notice.message}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Post a new notice for the team"
          rows={3}
          maxLength={2000}
          disabled={isPosting}
          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 sm:text-sm">
          <span>{draft.length}/2000</span>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmittingDisabled}
          >
            {isPosting ? 'Posting…' : 'Post notice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoticeBoard;
