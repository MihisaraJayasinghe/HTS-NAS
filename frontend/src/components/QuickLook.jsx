import { useEffect } from 'react';

const QuickLook = ({
  isOpen,
  item,
  previewUrl,
  mimeType,
  textContent,
  loading,
  error,
  onClose,
  onDownload,
  onOpenInNewTab,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const title = item?.name || 'Preview';
  const normalizedMime = mimeType || (item?.type === 'file' ? 'application/octet-stream' : '');

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  let content = (
    <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
      No preview available.
    </div>
  );

  if (loading) {
    content = (
      <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
        Preparing preview…
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex h-full items-center justify-center text-sm font-semibold text-rose-600">
        {error}
      </div>
    );
  } else if (textContent) {
    content = (
      <pre
        className="h-full w-full overflow-auto rounded-2xl bg-slate-900/90 p-4 text-xs text-slate-100"
        aria-label={`Preview of ${title}`}
      >
        {textContent}
      </pre>
    );
  } else if (previewUrl) {
    if (mimeType?.startsWith('image/')) {
      content = <img className="h-full max-h-[70vh] w-full rounded-2xl object-contain" src={previewUrl} alt={title} />;
    } else if (mimeType?.startsWith('audio/')) {
      content = (
        <div className="flex h-full items-center justify-center">
          <audio className="w-full max-w-xl" controls src={previewUrl} aria-label={title} />
        </div>
      );
    } else if (mimeType?.startsWith('video/')) {
      content = <video className="h-full max-h-[70vh] w-full rounded-2xl" controls src={previewUrl} aria-label={title} />;
    } else if (mimeType === 'application/pdf') {
      content = (
        <iframe
          title={`Preview of ${title}`}
          src={previewUrl}
          className="h-full w-full rounded-2xl"
        />
      );
    } else {
      content = (
        <div className="flex h-full flex-col gap-3">
          <iframe title={`Preview of ${title}`} src={previewUrl} className="h-full w-full rounded-2xl" />
          <p className="text-center text-xs font-semibold text-slate-400">
            If the preview does not render, use “Open in new tab” or download the file.
          </p>
        </div>
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label={`Quick look for ${title}`}
      onClick={handleBackdropClick}
    >
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200/40 bg-white/95 shadow-2xl shadow-slate-900/20">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200/70 bg-slate-50/80 px-6 py-4">
          <div className="space-y-1">
            <div className="text-lg font-semibold text-slate-900">{title}</div>
            {normalizedMime && !loading && !error && (
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{normalizedMime}</div>
            )}
          </div>
          <button
            type="button"
            className="rounded-full bg-white/80 px-3 py-1 text-xl font-semibold text-slate-400 shadow-sm transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            onClick={onClose}
            aria-label="Close quick look"
          >
            ×
          </button>
        </header>
        <div className="flex min-h-[320px] flex-1 items-stretch justify-center bg-slate-100/60 px-4 py-4">
          <div className="h-full w-full max-w-full">{content}</div>
        </div>
        <footer className="flex items-center justify-end gap-3 border-t border-slate-200/70 bg-white/90 px-6 py-4">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onDownload}
            disabled={!onDownload}
          >
            Download
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onOpenInNewTab}
            disabled={!previewUrl}
          >
            Open in new tab
          </button>
        </footer>
      </div>
    </div>
  );
};

export default QuickLook;
