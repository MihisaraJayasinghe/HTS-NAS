import { useEffect, useMemo, useRef, useState } from 'react';
import Breadcrumbs from './components/Breadcrumbs.jsx';
import FileList from './components/FileList.jsx';
import QuickLook from './components/QuickLook.jsx';
import Toolbar from './components/Toolbar.jsx';
import {
  listItems,
  createFolder,
  uploadFiles,
  deleteItem,
  renameItem,
  lockItem,
  unlockItem,
  fetchFileContent,
} from './services/api.js';

const joinPath = (base, name) => (base ? `${base}/${name}` : name);

const initialQuickLookState = {
  open: false,
  loading: false,
  error: '',
  url: '',
  mimeType: '',
  textContent: '',
  item: null,
};

const App = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('hts-view-mode') || 'grid';
    }
    return 'grid';
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [quickLook, setQuickLook] = useState(initialQuickLookState);
  const previewUrlRef = useRef('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    listItems(currentPath)
      .then((data) => {
        if (!active) {
          return;
        }
        const nextItems = data.items || [];
        setItems(nextItems);
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('hts-view-mode', viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    setSelectedItem(null);
  }, [currentPath]);

  useEffect(() => {
    setSelectedItem((current) => {
      if (!current) {
        return current;
      }
      return items.find((item) => item.path === current.path) || null;
    });
  }, [items]);

  useEffect(() => () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
  }, []);

  useEffect(() => {
    if (!quickLook.open || !quickLook.item) {
      return;
    }
    const exists = items.some((item) => item.path === quickLook.item.path);
    if (!exists) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = '';
      }
      setQuickLook(initialQuickLookState);
    }
  }, [items, quickLook.open, quickLook.item]);

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
      handleNavigate(item.path || joinPath(currentPath, item.name));
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
      () => deleteItem(item.path || joinPath(currentPath, item.name), password || undefined),
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
      () => renameItem(item.path || joinPath(currentPath, item.name), trimmed, password || undefined),
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
        () => unlockItem(item.path || joinPath(currentPath, item.name), password),
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
      () => lockItem(item.path || joinPath(currentPath, item.name), password),
      `Locked “${item.name}”`
    );
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const closeQuickLook = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
    setQuickLook(initialQuickLookState);
  };

  const handleQuickLook = async (targetItem) => {
    const item = targetItem || selectedItem;
    if (!item || item.type !== 'file') {
      return;
    }

    let password;
    if (item.isLocked) {
      const input = window.prompt('Enter the password to preview this locked file');
      if (!input) {
        setMessage('Preview cancelled');
        return;
      }
      password = input;
    }

    setError('');
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }

    setQuickLook({
      open: true,
      loading: true,
      error: '',
      url: '',
      mimeType: '',
      textContent: '',
      item,
    });

    try {
      const { blob, contentType } = await fetchFileContent(item.path || joinPath(currentPath, item.name), {
        password,
      });
      let textContent = '';
      if (contentType.startsWith('text/') || contentType === 'application/json') {
        textContent = await blob.text();
      }
      const objectUrl = URL.createObjectURL(blob);
      previewUrlRef.current = objectUrl;
      setQuickLook({
        open: true,
        loading: false,
        error: '',
        url: objectUrl,
        mimeType: contentType,
        textContent,
        item,
      });
    } catch (err) {
      setQuickLook({
        open: true,
        loading: false,
        error: err.message || 'Unable to preview file',
        url: '',
        mimeType: '',
        textContent: '',
        item,
      });
    }
  };

  const handleDownload = async (item) => {
    if (!item || item.type !== 'file') {
      return;
    }

    let password;
    if (item.isLocked) {
      const input = window.prompt('Enter the password to download this locked file');
      if (!input) {
        setMessage('Download cancelled');
        return;
      }
      password = input;
    }

    try {
      setError('');
      const { blob, filename } = await fetchFileContent(item.path || joinPath(currentPath, item.name), {
        password,
        download: true,
      });
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename || item.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);
      setMessage(`Download started for “${filename || item.name}”`);
    } catch (err) {
      setError(err.message || 'Unable to download file');
    }
  };

  const handleOpenPreviewInNewTab = () => {
    if (!quickLook.url) {
      return;
    }
    const opened = window.open(quickLook.url, '_blank', 'noopener');
    if (!opened) {
      setError('Unable to open the preview in a new tab. Please allow pop-ups for this site.');
    }
  };

  const canQuickLook = selectedItem?.type === 'file';
  const quickLookDownloadHandler = quickLook.item ? () => handleDownload(quickLook.item) : undefined;

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
        onQuickLook={() => handleQuickLook()}
        canQuickLook={canQuickLook}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
          viewMode={viewMode}
          selectedItem={selectedItem}
          onSelect={handleSelectItem}
          onOpen={handleOpen}
          onQuickLook={handleQuickLook}
          onRename={handleRename}
          onDelete={handleDelete}
          onToggleLock={handleToggleLock}
          onDownload={handleDownload}
        />
      )}

      <QuickLook
        isOpen={quickLook.open}
        item={quickLook.item}
        previewUrl={quickLook.url}
        mimeType={quickLook.mimeType}
        textContent={quickLook.textContent}
        loading={quickLook.loading}
        error={quickLook.error}
        onClose={closeQuickLook}
        onDownload={quickLookDownloadHandler}
        onOpenInNewTab={handleOpenPreviewInNewTab}
      />
    </div>
  );
};

export default App;
