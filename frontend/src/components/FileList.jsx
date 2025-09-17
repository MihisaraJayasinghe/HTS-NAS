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

const FileList = ({ items, onOpen, onRename, onDelete, onToggleLock }) => {
  if (!items || items.length === 0) {
    return <div className="empty-state">This folder is empty.</div>;
  }

  return (
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
          const icon = isDirectory ? '📁' : '📄';
          const lockIcon = item.isLocked ? '🔒' : '🔓';
          const modified = new Date(item.modified).toLocaleString();
          return (
            <tr
              key={item.name}
              tabIndex={0}
              onDoubleClick={() => isDirectory && onOpen(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && isDirectory) {
                  onOpen(item);
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
                {isDirectory && (
                  <button type="button" className="link" onClick={() => onOpen(item)}>
                    Open
                  </button>
                )}
                <button type="button" className="link" onClick={() => onRename(item)}>
                  Rename
                </button>
                <button type="button" className="link warning" onClick={() => onDelete(item)}>
                  Delete
                </button>
                <button type="button" className="link" onClick={() => onToggleLock(item)}>
                  {lockIcon} {item.isLocked ? 'Unlock' : 'Lock'}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default FileList;
