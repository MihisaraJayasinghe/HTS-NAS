import { useRef } from 'react';

const Toolbar = ({
  currentPath,
  onCreateFolder,
  onUpload,
  onRefresh,
  onNavigateUp,
  canNavigateUp,
}) => {
  const inputRef = useRef(null);

  const handleUploadClick = () => {
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
        <button type="button" className="button" onClick={onCreateFolder}>
          📁 New Folder
        </button>
        <button type="button" className="button" onClick={handleUploadClick}>
          ⬆️ Upload Files
        </button>
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
