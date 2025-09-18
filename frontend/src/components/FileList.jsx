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
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 text-sm font-semibold text-blue-600">
        This folder is empty.
      </div>
    );
  }

  const selectedPath = selectedItem?.path;

  const renderGridView = () => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" role="list">
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
            className={`group flex cursor-pointer flex-col gap-3 rounded-2xl border px-4 py-4 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              isSelected
                ? 'border-blue-300 bg-blue-50/70 shadow-lg shadow-blue-300/40'
                : 'border-white/60 bg-white/85 hover:border-blue-200 hover:bg-blue-50/60'
            }`}
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
            <div className="text-3xl text-slate-800" aria-hidden="true">
              {glyph}
            </div>
            <div className="text-base font-semibold text-slate-900" title={item.name}>
              {item.name}
            </div>
            <div className="text-xs font-medium text-slate-500" title={modified}>
              {isDirectory ? 'Folder' : formatSize(item.size)} · {modified}
            </div>
            <div className="flex flex-wrap gap-2">
              {isDirectory ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
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
                      className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
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
                    className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
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
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
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
                  className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
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
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
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
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200/70 text-sm">
        <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-right">Size</th>
            <th className="px-4 py-3 text-left">Modified</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
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
                className={
                  isSelected
                    ? 'bg-blue-50/70 text-blue-700 transition'
                    : 'transition hover:bg-slate-50/80'
                }
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
                <td className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700">
                  <span className="mr-2 text-lg" aria-hidden="true">
                    {icon}
                  </span>
                  {item.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-left text-slate-500">
                  {isDirectory ? 'Folder' : 'File'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-slate-500">
                  {formatSize(item.size)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-left text-slate-500">
                  {modified}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-left text-slate-500">
                  {item.isLocked ? 'Locked' : 'Unlocked'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {isDirectory ? (
                    <button
                      type="button"
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
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
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
    </div>
  );

  return viewMode === 'grid' ? renderGridView() : renderListView();
};

export default FileList;
