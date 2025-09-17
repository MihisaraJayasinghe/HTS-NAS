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
    <div className="quicklook-status">No preview available.</div>
  );

  if (loading) {
    content = <div className="quicklook-status">Preparing preview…</div>;
  } else if (error) {
    content = <div className="quicklook-status error">{error}</div>;
  } else if (textContent) {
    content = (
      <pre className="quicklook-text" aria-label={`Preview of ${title}`}>
        {textContent}
      </pre>
    );
  } else if (previewUrl) {
    if (mimeType?.startsWith('image/')) {
      content = <img className="quicklook-image" src={previewUrl} alt={title} />;
    } else if (mimeType?.startsWith('audio/')) {
      content = <audio className="quicklook-audio" controls src={previewUrl} aria-label={title} />;
    } else if (mimeType?.startsWith('video/')) {
      content = <video className="quicklook-video" controls src={previewUrl} aria-label={title} />;
    } else if (mimeType === 'application/pdf') {
      content = (
        <iframe
          title={`Preview of ${title}`}
          src={previewUrl}
          className="quicklook-frame"
        />
      );
    } else {
      content = (
        <div className="quicklook-frame-wrapper">
          <iframe
            title={`Preview of ${title}`}
            src={previewUrl}
            className="quicklook-frame"
          />
          <p className="quicklook-hint">
            If the preview does not render, use “Open in new tab” or download the file.
          </p>
        </div>
      );
    }
  }

  return (
    <div
      className="quicklook-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Quick look for ${title}`}
      onClick={handleBackdropClick}
    >
      <div className="quicklook-container">
        <header className="quicklook-header">
          <div className="quicklook-title-group">
            <div className="quicklook-title">{title}</div>
            {normalizedMime && !loading && !error && (
              <div className="quicklook-subtitle">{normalizedMime}</div>
            )}
          </div>
          <button type="button" className="quicklook-close" onClick={onClose} aria-label="Close quick look">
            ×
          </button>
        </header>
        <div className="quicklook-body">{content}</div>
        <footer className="quicklook-footer">
          <button
            type="button"
            className="button secondary"
            onClick={onDownload}
            disabled={!onDownload}
          >
            Download
          </button>
          <button
            type="button"
            className="button secondary"
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
