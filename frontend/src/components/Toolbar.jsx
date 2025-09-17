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
    <div className="toolbar">
      <div className="toolbar-left">
        <button
          type="button"
          className="button"
          onClick={onNavigateUp}
          disabled={!canNavigateUp}
        >
          ⬆️ Up
        </button>
        <span className="toolbar-path">{currentPath || 'Home'}</span>
      </div>
      <div className="toolbar-actions">
        {allowViewToggle && (
          <div className="view-toggle" role="group" aria-label="Change view">
            <button
              type="button"
              className={`view-button${viewMode === 'grid' ? ' active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              aria-label="Icon view"
            >
              🗂️
            </button>
            <button
              type="button"
              className={`view-button${viewMode === 'list' ? ' active' : ''}`}
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
            className="button secondary"
            onClick={onQuickLook}
            disabled={!canQuickLook}
          >
            👁️ Quick Look
          </button>
        )}
        {allowCreate && (
          <button type="button" className="button" onClick={onCreateFolder}>
            📁 New Folder
          </button>
        )}
        {allowUpload && (
          <button type="button" className="button" onClick={handleUploadClick}>
            ⬆️ Upload Files
          </button>
        )}
        <button type="button" className="button" onClick={onRefresh}>
          🔄 Refresh
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFilesSelected}
          hidden
        />
      </div>
    </div>
  );
};

export default Toolbar;
