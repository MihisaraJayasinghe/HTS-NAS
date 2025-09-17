import { useEffect, useMemo, useState } from 'react';
import Breadcrumbs from './components/Breadcrumbs.jsx';
import FileList from './components/FileList.jsx';
import Toolbar from './components/Toolbar.jsx';
import {
  listItems,
  createFolder,
  uploadFiles,
  deleteItem,
  renameItem,
  lockItem,
  unlockItem,
} from './services/api.js';

const joinPath = (base, name) => (base ? `${base}/${name}` : name);

const App = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    listItems(currentPath)
      .then((data) => {
        if (!active) {
          return;
        }
        setItems(data.items || []);
        setBreadcrumbs(data.breadcrumbs || []);
        const normalizedPath = data.path || '';
        if (normalizedPath !== currentPath) {
          setCurrentPath(normalizedPath);
        }
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setError(err.message || 'Failed to load items');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentPath, refreshToken]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }
    const timeout = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(timeout);
  }, [message]);

  const refresh = () => {
    setRefreshToken((token) => token + 1);
  };

  const handleNavigate = (path) => {
    setCurrentPath(path || '');
  };

  const parentPath = useMemo(() => {
    if (!currentPath) {
      return '';
    }
    const segments = currentPath.split('/');
    segments.pop();
    return segments.join('/');
  }, [currentPath]);

  const handleNavigateUp = () => {
    if (!currentPath) {
      return;
    }
    handleNavigate(parentPath);
  };

  const performAction = async (action, successMessage) => {
    try {
      setError('');
      setMessage('');
      await action();
      if (successMessage) {
        setMessage(successMessage);
      }
      refresh();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  };

  const handleCreateFolder = async () => {
    const name = window.prompt('Folder name');
    if (!name) {
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Folder name cannot be empty');
      return;
    }
    await performAction(
      () => createFolder(currentPath, trimmed),
      `Folder “${trimmed}” created`
    );
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) {
      return;
    }
    await performAction(
      () => uploadFiles(currentPath, files),
      files.length === 1
        ? `Uploaded “${files[0].name}”`
        : `Uploaded ${files.length} files`
    );
  };

  const handleOpen = (item) => {
    if (item.type === 'directory') {
      handleNavigate(joinPath(currentPath, item.name));
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete ${item.type === 'directory' ? 'folder' : 'file'} “${item.name}”?`);
    if (!confirmed) {
      return;
    }
    let password;
    if (item.isLocked) {
      password = window.prompt('Enter the password to delete this locked item');
      if (!password) {
        setMessage('Deletion cancelled');
        return;
      }
    }

    await performAction(
      () => deleteItem(joinPath(currentPath, item.name), password || undefined),
      `Deleted “${item.name}”`
    );
  };

  const handleRename = async (item) => {
    const newName = window.prompt('Enter the new name', item.name);
    if (!newName) {
      return;
    }
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('New name cannot be empty');
      return;
    }
    if (trimmed === item.name) {
      return;
    }

    let password;
    if (item.isLocked) {
      password = window.prompt('Enter the password to rename this locked item');
      if (!password) {
        setMessage('Rename cancelled');
        return;
      }
    }

    await performAction(
      () => renameItem(joinPath(currentPath, item.name), trimmed, password || undefined),
      `Renamed to “${trimmed}”`
    );
  };

  const handleToggleLock = async (item) => {
    if (item.isLocked) {
      const password = window.prompt('Enter the password to unlock this item');
      if (!password) {
        setMessage('Unlock cancelled');
        return;
      }
      await performAction(
        () => unlockItem(joinPath(currentPath, item.name), password),
        `Unlocked “${item.name}”`
      );
      return;
    }

    const password = window.prompt('Set a password to lock this item');
    if (!password) {
      setMessage('Lock cancelled');
      return;
    }
    await performAction(
      () => lockItem(joinPath(currentPath, item.name), password),
      `Locked “${item.name}”`
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>HTS NAS</h1>
        <p className="subtitle">Browse, organize, and secure your shared storage.</p>
      </header>

      <Toolbar
        currentPath={currentPath}
        onCreateFolder={handleCreateFolder}
        onUpload={handleUpload}
        onRefresh={refresh}
        onNavigateUp={handleNavigateUp}
        canNavigateUp={Boolean(currentPath)}
      />

      <Breadcrumbs breadcrumbs={breadcrumbs} onNavigate={handleNavigate} />

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="alert success" role="status">
          {message}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <FileList
          items={items}
          onOpen={handleOpen}
          onRename={handleRename}
          onDelete={handleDelete}
          onToggleLock={handleToggleLock}
        />
      )}
    </div>
  );
};

export default App;
