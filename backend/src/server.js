const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');

const MIME_TYPES = {
  '.aac': 'audio/aac',
  '.avi': 'video/x-msvideo',
  '.bmp': 'image/bmp',
  '.csv': 'text/csv',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.gif': 'image/gif',
  '.htm': 'text/html',
  '.html': 'text/html',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.m4v': 'video/x-m4v',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip',
};

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, X-File-Name');
  next();
});

const NAS_ROOT = process.env.NAS_ROOT
  ? path.resolve(process.env.NAS_ROOT)
  : path.join(__dirname, '..', '..', 'nas_storage');
const LOCKS_FILE = path.join(__dirname, '..', 'locks.json');
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');

fsSync.mkdirSync(NAS_ROOT, { recursive: true });

function normalizeRelative(input = '') {
  const safeInput = String(input).replace(/\\/g, '/').trim();
  const segments = safeInput.split('/');
  const stack = [];

  segments.forEach((segment) => {
    if (!segment || segment === '.') {
      return;
    }
    if (segment === '..') {
      if (stack.length) {
        stack.pop();
      }
      return;
    }
    stack.push(segment);
  });

  return stack.join('/');
}

function resolveAbsolute(input = '') {
  const relative = normalizeRelative(input);
  const absolute = path.join(NAS_ROOT, relative);
  const resolved = path.resolve(absolute);
  const rootResolved = path.resolve(NAS_ROOT);
  if (resolved !== rootResolved && !resolved.startsWith(`${rootResolved}${path.sep}`)) {
    throw new Error('Invalid path');
  }
  return { absolute: resolved, relative };
}

async function loadLocks() {
  try {
    const data = await fs.readFile(LOCKS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(LOCKS_FILE, JSON.stringify({}, null, 2));
      return {};
    }
    throw error;
  }
}

async function saveLocks(locks) {
  await fs.writeFile(LOCKS_FILE, JSON.stringify(locks, null, 2));
}

function getLockEntry(locks, relativePath) {
  return locks[relativePath];
}

async function assertUnlocked(relativePath, password) {
  const locks = await loadLocks();
  const entry = getLockEntry(locks, relativePath);
  if (!entry) {
    return { locks, entry: null };
  }
  if (!password) {
    const error = new Error('Password required for locked item');
    error.status = 423;
    throw error;
  }
  const match = await bcrypt.compare(password, entry.hash);
  if (!match) {
    const error = new Error('Invalid password for locked item');
    error.status = 403;
    throw error;
  }
  return { locks, entry };
}

function buildBreadcrumbs(relativePath) {
  if (!relativePath) {
    return [];
  }
  const segments = relativePath.split('/');
  const breadcrumbs = [];
  for (let i = 0; i < segments.length; i += 1) {
    const name = segments[i];
    const pathValue = segments.slice(0, i + 1).join('/');
    breadcrumbs.push({ name, path: pathValue });
  }
  return breadcrumbs;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const targetPath = req.body.path || req.query.path || '';
      const { absolute } = resolveAbsolute(targetPath);
      fsSync.mkdirSync(absolute, { recursive: true });
      cb(null, absolute);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/items', async (req, res, next) => {
  try {
    const relativePath = req.query.path ? String(req.query.path) : '';
    const { absolute, relative } = resolveAbsolute(relativePath);
    const stats = await fs.stat(absolute);
    if (!stats.isDirectory()) {
      return res.status(400).json({ message: 'Path must be a directory' });
    }

    const locks = await loadLocks();
    const entries = await fs.readdir(absolute);
    const items = await Promise.all(
      entries.map(async (name) => {
        if (name === '.DS_Store') {
          return null;
        }
        const itemAbsolute = path.join(absolute, name);
        const itemStats = await fs.stat(itemAbsolute);
        const itemRelative = normalizeRelative(path.join(relative, name));
        return {
          name,
          path: itemRelative,
          type: itemStats.isDirectory() ? 'directory' : 'file',
          size: itemStats.isDirectory() ? null : itemStats.size,
          modified: itemStats.mtime.toISOString(),
          isLocked: Boolean(getLockEntry(locks, itemRelative)),
        };
      })
    );

    const filtered = items
      .filter(Boolean)
      .sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      });

    res.json({
      path: relative,
      breadcrumbs: buildBreadcrumbs(relative),
      items: filtered,
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Folder not found' });
    }
    next(error);
  }
});

app.post('/api/folders', async (req, res, next) => {
  try {
    const { path: targetPath = '', name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Folder name is required' });
    }
    const safeName = name.trim();
    if (!safeName) {
      return res.status(400).json({ message: 'Folder name cannot be empty' });
    }

    const { relative: parentRelative } = resolveAbsolute(targetPath);
    const newRelative = normalizeRelative(`${parentRelative ? `${parentRelative}/` : ''}${safeName}`);
    const newAbsolute = path.join(NAS_ROOT, newRelative);
    if (!newAbsolute.startsWith(path.resolve(NAS_ROOT))) {
      return res.status(400).json({ message: 'Invalid folder path' });
    }

    await fs.mkdir(newAbsolute, { recursive: false });
    res.status(201).json({ message: 'Folder created' });
  } catch (error) {
    if (error.code === 'EEXIST') {
      return res.status(409).json({ message: 'A file or folder with this name already exists' });
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Parent folder not found' });
    }
    next(error);
  }
});

app.post('/api/upload', (req, res, next) => {
  upload.array('files')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large' });
      }
      return next(err);
    }

    try {
      const targetPath = req.body.path || '';
      const { relative } = resolveAbsolute(targetPath);
      const locks = await loadLocks();
      const lockedConflicts = [];
      if (Array.isArray(req.files)) {
        await Promise.all(
          req.files.map(async (file) => {
            const relativePath = normalizeRelative(path.join(relative, file.originalname));
            if (getLockEntry(locks, relativePath)) {
              lockedConflicts.push(file.originalname);
              await fs.unlink(file.path);
            }
          })
        );
      }

      if (lockedConflicts.length > 0) {
        return res.status(423).json({
          message: 'Some files are locked and cannot be overwritten',
          files: lockedConflicts,
        });
      }

      res.status(201).json({ message: 'Files uploaded' });
    } catch (error) {
      next(error);
    }
  });
});

function deleteLocksForPath(locks, relativePath) {
  delete locks[relativePath];
  const prefix = `${relativePath}/`;
  Object.keys(locks).forEach((key) => {
    if (key === relativePath || key.startsWith(prefix)) {
      delete locks[key];
    }
  });
}

app.delete('/api/items', async (req, res, next) => {
  try {
    const { path: targetPath, password } = req.body;
    if (typeof targetPath !== 'string') {
      return res.status(400).json({ message: 'Path is required' });
    }

    const { absolute, relative } = resolveAbsolute(targetPath);
    const { locks } = await assertUnlocked(relative, password);

    const stats = await fs.stat(absolute);
    if (stats.isDirectory()) {
      await fs.rm(absolute, { recursive: true, force: true });
    } else {
      await fs.unlink(absolute);
    }

    await deleteLocksForPath(locks, relative);
    await saveLocks(locks);

    res.json({ message: 'Item deleted' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Item not found' });
    }
    next(error);
  }
});

app.put('/api/items/rename', async (req, res, next) => {
  try {
    const { path: targetPath, newName, password } = req.body;
    if (!targetPath || typeof targetPath !== 'string') {
      return res.status(400).json({ message: 'Path is required' });
    }
    if (!newName || typeof newName !== 'string') {
      return res.status(400).json({ message: 'New name is required' });
    }

    const safeName = newName.trim();
    if (!safeName) {
      return res.status(400).json({ message: 'New name cannot be empty' });
    }

    const { absolute, relative } = resolveAbsolute(targetPath);
    const parentRelative = relative
      ? relative.split('/').slice(0, -1).join('/')
      : '';
    const newRelative = normalizeRelative(`${parentRelative ? `${parentRelative}/` : ''}${safeName}`);
    const newAbsolute = path.join(NAS_ROOT, newRelative);

    if (newRelative === relative) {
      return res.json({ message: 'No changes applied' });
    }

    try {
      await fs.access(newAbsolute);
      return res.status(409).json({ message: 'A file or folder with this name already exists' });
    } catch (accessError) {
      if (accessError.code !== 'ENOENT') {
        throw accessError;
      }
    }

    const { locks } = await assertUnlocked(relative, password);

    await fs.rename(absolute, newAbsolute);

    const updatedLocks = {};
    const oldPrefix = `${relative}/`;
    const newPrefix = `${newRelative}/`;
    Object.keys(locks).forEach((key) => {
      if (key === relative) {
        updatedLocks[newRelative] = locks[key];
      } else if (key.startsWith(oldPrefix)) {
        updatedLocks[newPrefix + key.slice(oldPrefix.length)] = locks[key];
      } else {
        updatedLocks[key] = locks[key];
      }
    });
    await saveLocks(updatedLocks);

    res.json({ message: 'Item renamed' });
  } catch (error) {
    if (error.code === 'EEXIST') {
      return res.status(409).json({ message: 'A file or folder with this name already exists' });
    }
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Item not found' });
    }
    next(error);
  }
});

app.post('/api/items/lock', async (req, res, next) => {
  try {
    const { path: targetPath, password } = req.body;
    if (!targetPath || typeof targetPath !== 'string') {
      return res.status(400).json({ message: 'Path is required' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required' });
    }

    const { absolute, relative } = resolveAbsolute(targetPath);
    await fs.access(absolute);
    const locks = await loadLocks();
    if (getLockEntry(locks, relative)) {
      return res.status(409).json({ message: 'Item is already locked' });
    }

    const hash = await bcrypt.hash(password, 10);
    locks[relative] = { hash, lockedAt: new Date().toISOString() };
    await saveLocks(locks);

    res.json({ message: 'Item locked' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'Item not found' });
    }
    next(error);
  }
});

app.post('/api/items/unlock', async (req, res, next) => {
  try {
    const { path: targetPath, password } = req.body;
    if (!targetPath || typeof targetPath !== 'string') {
      return res.status(400).json({ message: 'Path is required' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required' });
    }

    const { relative } = resolveAbsolute(targetPath);
    const locks = await loadLocks();
    const entry = getLockEntry(locks, relative);
    if (!entry) {
      return res.status(404).json({ message: 'Item is not locked' });
    }

    const match = await bcrypt.compare(password, entry.hash);
    if (!match) {
      return res.status(403).json({ message: 'Invalid password' });
    }

    await deleteLocksForPath(locks, relative);
    await saveLocks(locks);

    res.json({ message: 'Item unlocked' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/items/content', async (req, res, next) => {
  try {
    const targetPath = req.query.path ? String(req.query.path) : '';
    if (!targetPath) {
      return res.status(400).json({ message: 'Path is required' });
    }

    const { absolute, relative } = resolveAbsolute(targetPath);
    const stats = await fs.stat(absolute);
    if (stats.isDirectory()) {
      return res.status(400).json({ message: 'Path must be a file' });
    }

    const password = req.get('x-item-password') || (req.query.password ? String(req.query.password) : undefined);
    await assertUnlocked(relative, password);

    const fileName = path.basename(absolute);
    const downloadFlag = req.query.download === '1' || req.query.download === 'true';
    const mimeType = getMimeType(fileName);

    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `${downloadFlag ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );
    res.setHeader('X-File-Name', encodeURIComponent(fileName));

    const stream = fsSync.createReadStream(absolute);
    stream.on('error', next);
    stream.pipe(res);
    return undefined;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'File not found' });
    }
    if (error.status) {
      return res.status(error.status).json({ message: error.message || 'Unable to open file' });
    }
    return next(error);
  }
});

if (fsSync.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`NAS server listening on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Serving files from ${NAS_ROOT}`);
});
