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
    <div className="panel notice-panel">
      <div className="panel-header">
        <h2>Team notices</h2>
        <p>Share quick updates that everyone can see.</p>
      </div>
      <div className="panel-content notice-content">
        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}
        <div className="notice-feed" aria-live="polite">
          {loading ? (
            <div className="notice-placeholder">Loading notices…</div>
          ) : notices.length === 0 ? (
            <div className="notice-placeholder">No notices yet. Be the first to post.</div>
          ) : (
            <ul className="notice-list">
              {notices.map((notice) => {
                const isOwnNotice = notice.author === username;
                const displayName = isOwnNotice ? 'You' : notice.author;
                return (
                  <li key={notice.id} className={`notice-item${isOwnNotice ? ' own' : ''}`}>
                    <div className="notice-meta">
                      <span className="notice-author">{displayName}</span>
                      {notice.timestamp && (
                        <time dateTime={notice.timestamp} className="notice-time">
                          {formatTimestamp(notice.timestamp)}
                        </time>
                      )}
                    </div>
                    <p className="notice-message">{notice.message}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <form className="notice-composer" onSubmit={handleSubmit}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Post a new notice for the team"
            rows={2}
            maxLength={2000}
            disabled={isPosting}
          />
          <div className="notice-composer-actions">
            <span className="notice-char-count">{draft.length}/2000</span>
            <button type="submit" className="button" disabled={isSubmittingDisabled}>
              {isPosting ? 'Posting…' : 'Post notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoticeBoard;
