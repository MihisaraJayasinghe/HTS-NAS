const AccessList = ({ access = [], selectedPath, onSelect }) => {
  if (!Array.isArray(access) || access.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2>Assigned folders</h2>
          <p>No folders have been assigned to this account yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Assigned folders</h2>
        <p>Select a folder to browse files and see the associated password.</p>
      </div>
      <ul className="access-list">
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
                <span className="access-password">Password: {entry.password}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AccessList;
