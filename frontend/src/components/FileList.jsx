const formatSize = (size) => {
  if (size === null || size === undefined) {
    return '—';
  }
  if (size === 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
};

const getFileGlyph = (item) => {
  if (item.type === 'directory') {
    return '📁';
  }
  const extension = item.name.split('.').pop()?.toLowerCase();
  if (!extension) {
    return '📄';
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
    return '🖼️';
  }
  if (['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(extension)) {
    return '🎬';
  }
  if (['mp3', 'wav', 'aac', 'flac'].includes(extension)) {
    return '🎵';
  }
  if (['pdf'].includes(extension)) {
    return '📕';
  }
  if (['ppt', 'pptx'].includes(extension)) {
    return '📊';
  }
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return '📈';
  }
  if (['doc', 'docx'].includes(extension)) {
    return '📄';
  }
  if (['zip', 'rar', '7z'].includes(extension)) {
    return '🗜️';
  }
  return '📄';
};

const FileList = ({
  items,
  viewMode,
  selectedItem,
  onSelect,
  onOpen,
  onQuickLook,
  onRename,
  onDelete,
  onToggleLock,
  onDownload,
  allowRename = true,
  allowDelete = true,
  allowLockToggle = true,
  allowQuickLook = true,
}) => {
  if (!items || items.length === 0) {
    return <div className="empty-state">This folder is empty.</div>;
  }

  const selectedPath = selectedItem?.path;

  const renderGridView = () => (
    <div className="file-grid" role="list">
      {items.map((item) => {
        const isDirectory = item.type === 'directory';
        const isSelected = selectedPath === item.path;
        const glyph = getFileGlyph(item);
        const modified = new Date(item.modified).toLocaleString();

        return (
          <div
            key={item.path || item.name}
            role="listitem"
            tabIndex={0}
            className={`file-grid-item${isSelected ? ' selected' : ''}`}
            onClick={(event) => {
              event.preventDefault();
              onSelect(item);
            }}
            onDoubleClick={() => {
              onSelect(item);
              if (isDirectory) {
                onOpen(item);
              } else if (allowQuickLook) {
                onQuickLook(item);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                if (isDirectory) {
                  onOpen(item);
                } else if (allowQuickLook) {
                  onQuickLook(item);
                }
              }
              if (event.key === ' ' && !isDirectory && allowQuickLook) {
                event.preventDefault();
                onQuickLook(item);
              }
            }}
          >
            <div className="file-grid-icon" aria-hidden="true">
              {glyph}
            </div>
            <div className="file-grid-name" title={item.name}>
              {item.name}
            </div>
            <div className="file-grid-meta" title={modified}>
              {isDirectory ? 'Folder' : formatSize(item.size)} · {modified}
            </div>
            <div className="file-grid-actions">
              {isDirectory ? (
                <button
                  type="button"
                  className="pill-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(item);
                  }}
                >
                  Open
                </button>
              ) : (
                <>
                  {allowQuickLook && (
                    <button
                      type="button"
                      className="pill-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(item);
                        onQuickLook(item);
                      }}
                    >
                      Quick Look
                    </button>
                  )}
                  <button
                    type="button"
                    className="pill-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(item);
                      onDownload(item);
                    }}
                  >
                    Download
                  </button>
                </>
              )}
              {allowRename && (
                <button
                  type="button"
                  className="pill-button subtle"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(item);
                    onRename(item);
                  }}
                >
                  Rename
                </button>
              )}
              {allowDelete && (
                <button
                  type="button"
                  className="pill-button danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(item);
                    onDelete(item);
                  }}
                >
                  Delete
                </button>
              )}
              {allowLockToggle && (
                <button
                  type="button"
                  className="pill-button subtle"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(item);
                    onToggleLock(item);
                  }}
                >
                  {item.isLocked ? 'Unlock' : 'Lock'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <table className="file-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Size</th>
          <th>Modified</th>
          <th>Status</th>
          <th className="actions-header">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isDirectory = item.type === 'directory';
          const icon = getFileGlyph(item);
          const lockIcon = item.isLocked ? '🔒' : '🔓';
          const modified = new Date(item.modified).toLocaleString();
          const isSelected = selectedPath === item.path;

          return (
            <tr
              key={item.path || item.name}
              tabIndex={0}
              className={isSelected ? 'selected' : ''}
              onClick={() => {
                onSelect(item);
              }}
              onDoubleClick={() => {
                onSelect(item);
                if (isDirectory) {
                  onOpen(item);
                } else if (allowQuickLook) {
                  onQuickLook(item);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  if (isDirectory) {
                    onOpen(item);
                  } else if (allowQuickLook) {
                    onQuickLook(item);
                  }
                }
                if (event.key === ' ' && !isDirectory && allowQuickLook) {
                  event.preventDefault();
                  onQuickLook(item);
                }
              }}
            >
              <td className="file-name">
                <span className="file-icon" aria-hidden="true">
                  {icon}
                </span>
                <span>{item.name}</span>
              </td>
              <td className="file-type">{isDirectory ? 'Folder' : 'File'}</td>
              <td>{formatSize(item.size)}</td>
              <td>{modified}</td>
              <td>{item.isLocked ? 'Locked' : 'Unlocked'}</td>
              <td className="row-actions">
                {isDirectory ? (
                  <button
                    type="button"
                    className="link"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(item);
                      onOpen(item);
                    }}
                  >
                    Open
                  </button>
                ) : (
                  <>
                    {allowQuickLook && (
                      <button
                        type="button"
                        className="link"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(item);
                          onQuickLook(item);
                        }}
                      >
                        Quick Look
                      </button>
                    )}
                    <button
                      type="button"
                      className="link"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(item);
                        onDownload(item);
                      }}
                    >
                      Download
                    </button>
                  </>
                )}
                {allowRename && (
                  <button
                    type="button"
                    className="link"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(item);
                      onRename(item);
                    }}
                  >
                    Rename
                  </button>
                )}
                {allowDelete && (
                  <button
                    type="button"
                    className="link warning"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(item);
                      onDelete(item);
                    }}
                  >
                    Delete
                  </button>
                )}
                {allowLockToggle && (
                  <button
                    type="button"
                    className="link"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(item);
                      onToggleLock(item);
                    }}
                  >
                    {lockIcon} {item.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return viewMode === 'grid' ? renderGridView() : renderListView();
};

export default FileList;
