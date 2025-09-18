const AccessList = ({ access = [], selectedPath, onSelect }) => {
  const hasAccess = Array.isArray(access) && access.length > 0;

  return (
    <div className="panel storage-access">
      <div className="panel-header">
        <div className="panel-header-icon" aria-hidden="true">
          🗂️
        </div>
        <div className="panel-header-copy">
          <h2>HTS NAS storage decks</h2>
          <p>{hasAccess ? 'Pick a lane, unlock, and download right in the browser.' : 'No decks yet — ask an admin to share a drive.'}</p>
        </div>
      </div>
      {hasAccess && (
        <div className="storage-access-body">
          <div className="storage-access-legend">
            <span className="legend-chip">Protocols ↔ Files</span>
            <span className="legend-chip">Secure</span>
            <span className="legend-chip">Always on</span>
          </div>
          <ul className="access-list" role="list">
            {access.map((entry) => {
              const isActive = selectedPath === entry.path;
              return (
                <li key={entry.path || '(root)'} className={isActive ? 'selected' : ''}>
                  <button
                    type="button"
                    className="access-item"
                    onClick={() => onSelect?.(entry.path)}
                  >
                    <span className="access-path">{entry.path || 'Full storage access'}</span>
                    <span className="access-password">Password · {entry.password}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AccessList;
