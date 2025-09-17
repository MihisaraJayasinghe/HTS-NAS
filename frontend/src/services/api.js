const rawBase = import.meta.env.VITE_API_URL || '';
const trimmedBase = rawBase.replace(/\/$/, '');
const API_ROOT = trimmedBase
  ? trimmedBase.endsWith('/api')
    ? trimmedBase
    : `${trimmedBase}/api`
  : '/api';

async function request(path, options = {}) {
  const url = `${API_ROOT}${path}`;
  const opts = { ...options };

  if (!(opts.body instanceof FormData)) {
    opts.headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (opts.body && typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
    }
  }

  const response = await fetch(url, opts);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || 'Something went wrong';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function listItems(path = '') {
  const params = new URLSearchParams();
  if (path) {
    params.set('path', path);
  }
  const query = params.toString();
  return request(`/items${query ? `?${query}` : ''}`);
}

export function createFolder(path, name) {
  return request('/folders', {
    method: 'POST',
    body: { path, name },
  });
}

export function uploadFiles(path, files) {
  const formData = new FormData();
  formData.append('path', path || '');
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });

  return request('/upload', {
    method: 'POST',
    body: formData,
  });
}

export function deleteItem(path, password) {
  return request('/items', {
    method: 'DELETE',
    body: { path, password },
  });
}

export function renameItem(path, newName, password) {
  return request('/items/rename', {
    method: 'PUT',
    body: { path, newName, password },
  });
}

export function lockItem(path, password) {
  return request('/items/lock', {
    method: 'POST',
    body: { path, password },
  });
}

export function unlockItem(path, password) {
  return request('/items/unlock', {
    method: 'POST',
    body: { path, password },
  });
}
