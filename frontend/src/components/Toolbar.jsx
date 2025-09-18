import { useRef } from 'react';

const Toolbar = ({
  currentPath,
  onCreateFolder,
  onUpload,
  onRefresh,
  onNavigateUp,
  canNavigateUp,
  onQuickLook,
  canQuickLook,
  viewMode,
  onViewModeChange,
  allowCreate = true,
  allowUpload = true,
  allowQuickLook = true,
  allowViewToggle = true,
}) => {
  const inputRef = useRef(null);

  const handleUploadClick = () => {
    if (!allowUpload) {
      return;
    }
    inputRef.current?.click();
  };

  const handleFilesSelected = (event) => {
    const { files } = event.target;
    if (files && files.length > 0) {
      onUpload(files);
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/50 bg-white/85 p-4 shadow-lg shadow-blue-500/5">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onNavigateUp}
          disabled={!canNavigateUp}
        >
          ⬆️ Up
        </button>
        <span className="truncate rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-600">
          {currentPath || 'Home'}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        {allowViewToggle && (
          <div
            className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 p-1 text-blue-600 shadow-inner"
            role="group"
            aria-label="Change view"
          >
            <button
              type="button"
              className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm shadow-blue-500/20' : 'text-slate-500'
              }`}
              onClick={() => onViewModeChange('grid')}
              aria-label="Icon view"
            >
              🗂️
            </button>
            <button
              type="button"
              className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm shadow-blue-500/20' : 'text-slate-500'
              }`}
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
            >
              📄
            </button>
          </div>
        )}
        {allowQuickLook && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onQuickLook}
            disabled={!canQuickLook}
          >
            👁️ Quick Look
          </button>
        )}
        {allowCreate && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            onClick={onCreateFolder}
          >
            📁 New Folder
          </button>
        )}
        {allowUpload && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            onClick={handleUploadClick}
          >
            ⬆️ Upload Files
          </button>
        )}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          onClick={onRefresh}
        >
          🔄 Refresh
        </button>
        <input ref={inputRef} type="file" multiple onChange={handleFilesSelected} hidden />
      </div>
    </div>
  );
};

export default Toolbar;
