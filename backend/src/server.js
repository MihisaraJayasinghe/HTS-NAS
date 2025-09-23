const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const morgan = require('morgan');
const {
  STATUS: PROCUREMENT_STATUS,
  createProcurementRequest,
  listProcurementRequests,
  getProcurementRequest,
  departmentReview,
  financeReview,
  procurementSelection,
  recordReceipt,
  receiptReview,
} = require('./procurementWorkflow');

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
const ACCOUNTS_FILE = path.join(__dirname, '..', 'accounts.json');
const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
const CHAT_FILE = path.join(__dirname, '..', 'chat.json');
const NOTICES_FILE = path.join(__dirname, '..', 'notices.json');

const DEFAULT_CHAT_GROUPS = [
  {
    id: 'group:public',
    name: 'Public Lobby',
    description: 'Chat with everyone in the workspace.',
  },
];

const VALID_ROLES = ['admin', 'user', 'dept-head', 'finance', 'procurement'];

const MAX_CHAT_MESSAGE_LENGTH = 2000;
const MAX_NOTICE_LENGTH = 2000;

const sessions = new Map();

function createSession(username) {
  const token = crypto.randomBytes(48).toString('hex');
  sessions.set(token, { username, createdAt: Date.now() });
  return token;
}

function revokeSession(token) {
  sessions.delete(token);
}

function revokeUserSessions(username) {
  Array.from(sessions.entries()).forEach(([token, session]) => {
    if (session.username === username) {
      sessions.delete(token);
    }
  });
}

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

async function loadAccounts() {
  try {
    const data = await fs.readFile(ACCOUNTS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.users !== 'object') {
      throw new Error('Invalid accounts file');
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      const empty = { users: {} };
      await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(empty, null, 2));
      return empty;
    }
    throw error;
  }
}

async function saveAccounts(accounts) {
  const payload = {
    users: accounts.users || {},
  };
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(payload, null, 2));
}

async function ensureAccountsInitialized() {
  const accounts = await loadAccounts();
  if (!accounts.users || typeof accounts.users !== 'object') {
    accounts.users = {};
  }
  if (!accounts.users.Admin) {
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash('HTS', 10);
    accounts.users.Admin = {
      username: 'Admin',
      role: 'admin',
      passwordHash,
      access: [],
      createdAt: now,
      updatedAt: now,
    };
    await saveAccounts(accounts);
  }

  const seededUsers = [
    { username: 'Finance', role: 'finance' },
    { username: 'Procurement', role: 'procurement' },
    { username: 'DepartmentHead', role: 'dept-head' },
  ];

  let changed = false;
  // eslint-disable-next-line no-restricted-syntax
  for (const seed of seededUsers) {
    if (!accounts.users[seed.username]) {
      const now = new Date().toISOString();
      const passwordHash = await bcrypt.hash('HTS', 10);
      accounts.users[seed.username] = {
        username: seed.username,
        role: seed.role,
        passwordHash,
        access: [],
        createdAt: now,
        updatedAt: now,
      };
      changed = true;
    }
  }

  if (changed) {
    await saveAccounts(accounts);
  }
}

async function loadChatData() {
  try {
    const raw = await fs.readFile(CHAT_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.conversations !== 'object') {
      throw new Error('Invalid chat store format');
    }
    const normalized = {};
    Object.entries(parsed.conversations).forEach(([id, value]) => {
      if (value && typeof value === 'object') {
        normalized[id] = {
          id,
          type: value.type === 'group' ? 'group' : 'dm',
          name: typeof value.name === 'string' ? value.name : undefined,
          description: typeof value.description === 'string' ? value.description : undefined,
          participants: Array.isArray(value.participants) ? value.participants : [],
          messages: Array.isArray(value.messages) ? value.messages : [],
          createdAt: value.createdAt || new Date().toISOString(),
        };
      }
    });
    return { conversations: normalized };
  } catch (error) {
    if (error.code === 'ENOENT' || error.name === 'SyntaxError' || error.message === 'Invalid chat store format') {
      const empty = { conversations: {} };
      await fs.writeFile(CHAT_FILE, JSON.stringify(empty, null, 2));
      return empty;
    }
    throw error;
  }
}

async function saveChatData(chatData) {
  const payload = {
    conversations: chatData.conversations || {},
  };
  await fs.writeFile(CHAT_FILE, JSON.stringify(payload, null, 2));
}

async function loadNotices() {
  try {
    const raw = await fs.readFile(NOTICES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.notices)) {
      throw new Error('Invalid notices store format');
    }
    return { notices: parsed.notices };
  } catch (error) {
    if (error.code === 'ENOENT' || error.name === 'SyntaxError' || error.message === 'Invalid notices store format') {
      const empty = { notices: [] };
      await saveNotices(empty);
      return empty;
    }
    throw error;
  }
}

async function saveNotices(noticeData) {
  const payload = {
    notices: Array.isArray(noticeData?.notices) ? noticeData.notices : [],
  };
  await fs.writeFile(NOTICES_FILE, JSON.stringify(payload, null, 2));
}

function buildDmConversationId(userA, userB) {
  const participants = [userA, userB].map((name) => String(name || '').trim());
  participants.sort((a, b) => a.localeCompare(b));
  return `dm:${participants.join('|')}`;
}

function ensureDmConversation(chatData, userA, userB) {
  const participants = [userA, userB].map((name) => String(name || '').trim());
  if (participants.some((name) => !name)) {
    const error = new Error('Both participants are required for a direct message');
    error.status = 400;
    throw error;
  }
  participants.sort((a, b) => a.localeCompare(b));
  const [first, second] = participants;
  const id = buildDmConversationId(first, second);
  const existing = chatData.conversations[id];
  if (existing && existing.type === 'dm') {
    let changed = false;
    if (!Array.isArray(existing.participants) || existing.participants.length !== 2) {
      existing.participants = [first, second];
      changed = true;
    }
    if (!Array.isArray(existing.messages)) {
      existing.messages = [];
      changed = true;
    }
    return { conversation: existing, changed };
  }
  const created = {
    id,
    type: 'dm',
    participants: [first, second],
    messages: existing && Array.isArray(existing.messages) ? existing.messages : [],
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  chatData.conversations[id] = created;
  return { conversation: created, changed: true };
}

function ensureGroupConversation(chatData, groupId) {
  const group = DEFAULT_CHAT_GROUPS.find((item) => item.id === groupId);
  if (!group) {
    const error = new Error('Unknown chat group');
    error.status = 404;
    throw error;
  }
  const existing = chatData.conversations[group.id];
  if (existing && existing.type === 'group') {
    let changed = false;
    if (!Array.isArray(existing.messages)) {
      existing.messages = [];
      changed = true;
    }
    if (existing.name !== group.name) {
      existing.name = group.name;
      changed = true;
    }
    if (existing.description !== group.description) {
      existing.description = group.description;
      changed = true;
    }
    return { conversation: existing, changed };
  }
  const created = {
    id: group.id,
    type: 'group',
    name: group.name,
    description: group.description,
    messages: existing && Array.isArray(existing.messages) ? existing.messages : [],
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  chatData.conversations[group.id] = created;
  return { conversation: created, changed: true };
}

async function ensureChatDataInitialized() {
  const chatData = await loadChatData();
  let changed = false;
  DEFAULT_CHAT_GROUPS.forEach((group) => {
    const { changed: groupChanged } = ensureGroupConversation(chatData, group.id);
    if (groupChanged) {
      changed = true;
    }
  });
  if (changed) {
    await saveChatData(chatData);
  }
}

async function ensureNoticesInitialized() {
  await loadNotices();
}

function sanitizeUsername(input) {
  if (typeof input !== 'string') {
    return '';
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }
  const safe = trimmed.replace(/[^A-Za-z0-9_.-]/g, '');
  return safe;
}

function getAccessList(account) {
  if (!account || !Array.isArray(account.access)) {
    return [];
  }
  return account.access.map((entry) => ({
    path: normalizeRelative(entry.path || ''),
    password: String(entry.password || ''),
  }));
}

function toPublicUser(account) {
  return {
    username: account.username,
    role: account.role,
    access: getAccessList(account),
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

function canAccessPath(account, relativePath) {
  if (!account) {
    return false;
  }
  if (account.role === 'admin') {
    return true;
  }
  const normalized = normalizeRelative(relativePath);
  const accessList = getAccessList(account);
  if (!accessList.length) {
    return false;
  }
  return accessList.some(({ path: allowedPath }) => {
    if (!allowedPath) {
      return true;
    }
    if (normalized === allowedPath) {
      return true;
    }
    return normalized.startsWith(`${allowedPath}/`);
  });
}

function ensureAccountAccess(account, relativePath) {
  if (!canAccessPath(account, relativePath)) {
    const error = new Error('Access denied for this path');
    error.status = 403;
    throw error;
  }
}

function isUserRootPath(account, relativePath) {
  if (!account || account.role === 'admin') {
    return false;
  }
  const normalized = normalizeRelative(relativePath);
  return getAccessList(account).some(({ path: allowedPath }) => allowedPath === normalized);
}

async function normalizeAccessEntries(access) {
  if (access === undefined) {
    return undefined;
  }
  if (!Array.isArray(access)) {
    const error = new Error('Access list must be an array');
    error.status = 400;
    throw error;
  }
  const normalized = [];
  const seen = new Set();
  // eslint-disable-next-line no-restricted-syntax
  for (const entry of access) {
    if (!entry || typeof entry !== 'object') {
      const error = new Error('Invalid access entry');
      error.status = 400;
      throw error;
    }
    const relativePath = normalizeRelative(entry.path || '');
    if (seen.has(relativePath)) {
      const error = new Error('Duplicate access path');
      error.status = 400;
      throw error;
    }
    seen.add(relativePath);
    const password = typeof entry.password === 'string' ? entry.password.trim() : '';
    if (!password) {
      const error = new Error('Password is required for each access entry');
      error.status = 400;
      throw error;
    }
    const { absolute } = resolveAbsolute(relativePath);
    try {
      const stats = await fs.stat(absolute);
      if (!stats.isDirectory()) {
        const error = new Error(`Access path “${relativePath}” must be a directory`);
        error.status = 400;
        throw error;
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        const error = new Error(`Access path “${relativePath}” does not exist`);
        error.status = 404;
        throw error;
      }
      throw err;
    }
    normalized.push({ path: relativePath, password });
  }
  return normalized;
}

async function applyAccessLocks(accessEntries) {
  if (!Array.isArray(accessEntries) || !accessEntries.length) {
    return;
  }
  const locks = await loadLocks();
  let updated = false;
  // eslint-disable-next-line no-restricted-syntax
  for (const entry of accessEntries) {
    if (!entry.path) {
      // Skip root level locks
      // eslint-disable-next-line no-continue
      continue;
    }
    const current = locks[entry.path];
    let needsUpdate = true;
    if (current) {
      // eslint-disable-next-line no-await-in-loop
      const matches = await bcrypt.compare(entry.password, current.hash);
      needsUpdate = !matches;
    }
    if (needsUpdate) {
      // eslint-disable-next-line no-await-in-loop
      const hash = await bcrypt.hash(entry.password, 10);
      locks[entry.path] = { hash, lockedAt: new Date().toISOString() };
      updated = true;
    }
  }
  if (updated) {
    await saveLocks(locks);
  }
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : '';
  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const session = sessions.get(token);
  if (!session) {
    res.status(401).json({ message: 'Invalid or expired session' });
    return;
  }
  const accounts = await loadAccounts();
  const account = accounts.users[session.username];
  if (!account) {
    revokeSession(token);
    res.status(401).json({ message: 'Account no longer exists' });
    return;
  }
  req.authToken = token;
  req.account = account;
  req.accounts = accounts;
  next();
});

function requireAdmin(req, res, next) {
  if (!req.account || req.account.role !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  return next();
}

function requireRoles(...roles) {
  const allowed = roles.flat().map((role) => String(role || '').toLowerCase());
  return (req, res, next) => {
    if (!req.account) {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }
    if (req.account.role === 'admin') {
      return next();
    }
    if (!allowed.includes(req.account.role)) {
      return res.status(403).json({ message: 'Insufficient privileges' });
    }
    return next();
  };
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

async function assertUnlocked(relativePath, password, account) {
  const locks = await loadLocks();
  const entry = getLockEntry(locks, relativePath);
  if (!entry) {
    return { locks, entry: null };
  }
  let effectivePassword = password;
  if (!effectivePassword && account) {
    const accessEntry = getAccessList(account).find((item) => item.path === relativePath);
    if (accessEntry?.password) {
      effectivePassword = accessEntry.password;
    }
  }
  if (!effectivePassword) {
    const error = new Error('Password required for locked item');
    error.status = 423;
    throw error;
  }
  const match = await bcrypt.compare(effectivePassword, entry.hash);
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
      if (!req.account) {
        const error = new Error('Authentication required');
        error.status = 401;
        throw error;
      }
      const { absolute, relative } = resolveAbsolute(targetPath);
      ensureAccountAccess(req.account, relative);
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

app.get(
  '/api/chat/roster',
  requireAuth,
  asyncHandler(async (req, res) => {
    const accounts = req.accounts || (await loadAccounts());
    const users = Object.values(accounts.users || {})
      .filter((account) => account.username !== req.account.username)
      .map((account) => ({
        username: account.username,
        role: account.role,
      }))
      .sort((a, b) => a.username.localeCompare(b.username));

    res.json({
      users,
      groups: DEFAULT_CHAT_GROUPS.map(({ id, name, description }) => ({
        id,
        name,
        description,
      })),
    });
  })
);

app.get(
  '/api/chat/messages',
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUsernameRaw = req.query.username ? String(req.query.username) : '';
    const conversationIdRaw = req.query.conversationId ? String(req.query.conversationId) : '';

    if (!targetUsernameRaw && !conversationIdRaw) {
      return res.status(400).json({ message: 'Select a conversation to view messages' });
    }

    const chatData = await loadChatData();
    let conversation;
    let changed = false;

    if (targetUsernameRaw) {
      const safeUsername = sanitizeUsername(targetUsernameRaw);
      if (!safeUsername) {
        return res.status(400).json({ message: 'Invalid recipient' });
      }
      const targetAccount = req.accounts.users[safeUsername];
      if (!targetAccount) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
      if (targetAccount.username === req.account.username) {
        return res.status(400).json({ message: 'Cannot open a direct conversation with yourself' });
      }
      const ensured = ensureDmConversation(chatData, req.account.username, targetAccount.username);
      conversation = ensured.conversation;
      changed = ensured.changed;
    } else {
      const ensured = ensureGroupConversation(chatData, conversationIdRaw);
      conversation = ensured.conversation;
      changed = ensured.changed;
    }

    if (changed) {
      await saveChatData(chatData);
    }

    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    const normalizedMessages = messages.map((entry, index) => ({
      id: entry.id || `${conversation.id}-${index}`,
      sender: entry.sender,
      content: typeof entry.content === 'string' ? entry.content : '',
      timestamp: entry.timestamp || null,
    }));

    return res.json({
      conversationId: conversation.id,
      type: conversation.type,
      name:
        conversation.name ||
        (conversation.type === 'dm'
          ? conversation.participants?.find((name) => name !== req.account.username)
          : undefined),
      description: conversation.description,
      participants: conversation.participants || [],
      messages: normalizedMessages,
    });
  })
);

app.post(
  '/api/chat/messages',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rawContent = typeof req.body?.content === 'string' ? req.body.content : '';
    const content = rawContent.trim();
    if (!content) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    if (content.length > MAX_CHAT_MESSAGE_LENGTH) {
      return res
        .status(400)
        .json({ message: `Message cannot exceed ${MAX_CHAT_MESSAGE_LENGTH} characters` });
    }

    const targetUsernameRaw = typeof req.body?.username === 'string' ? req.body.username : '';
    const conversationIdRaw = typeof req.body?.conversationId === 'string' ? req.body.conversationId : '';

    if (!targetUsernameRaw && !conversationIdRaw) {
      return res.status(400).json({ message: 'Specify a recipient or conversation' });
    }

    const chatData = await loadChatData();
    let conversation;

    if (targetUsernameRaw) {
      const safeUsername = sanitizeUsername(targetUsernameRaw);
      if (!safeUsername) {
        return res.status(400).json({ message: 'Invalid recipient' });
      }
      const targetAccount = req.accounts.users[safeUsername];
      if (!targetAccount) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
      if (targetAccount.username === req.account.username) {
        return res.status(400).json({ message: 'Cannot send messages to yourself' });
      }
      ({ conversation } = ensureDmConversation(chatData, req.account.username, targetAccount.username));
    } else {
      ({ conversation } = ensureGroupConversation(chatData, conversationIdRaw));
    }

    if (!Array.isArray(conversation.messages)) {
      conversation.messages = [];
    }

    const entry = {
      id: crypto.randomUUID(),
      sender: req.account.username,
      content,
      timestamp: new Date().toISOString(),
    };

    conversation.messages.push(entry);
    await saveChatData(chatData);

    return res.status(201).json({
      conversationId: conversation.id,
      type: conversation.type,
      entry,
    });
  })
);

app.get(
  '/api/notices',
  requireAuth,
  asyncHandler(async (req, res) => {
    const noticeData = await loadNotices();
    const entries = Array.isArray(noticeData.notices) ? noticeData.notices : [];
    const seenIds = new Set();
    let changed = false;

    const normalized = entries.map((entry) => {
      const original = entry && typeof entry === 'object' ? entry : {};
      let id = typeof original.id === 'string' && original.id ? original.id : '';
      if (!id || seenIds.has(id)) {
        id = crypto.randomUUID();
        changed = true;
      }
      seenIds.add(id);
      const author = typeof original.author === 'string' ? original.author : '';
      if (author !== original.author) {
        changed = true;
      }
      const message = typeof original.message === 'string' ? original.message : '';
      if (message !== original.message) {
        changed = true;
      }
      const timestamp = typeof original.timestamp === 'string' ? original.timestamp : null;
      if (timestamp !== original.timestamp) {
        changed = true;
      }
      return { id, author, message, timestamp };
    });

    if (changed) {
      noticeData.notices = normalized;
      await saveNotices(noticeData);
    }

    const sorted = normalized
      .slice()
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });

    res.json({ notices: sorted });
  })
);

app.post(
  '/api/notices',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rawMessage = typeof req.body?.message === 'string' ? req.body.message : '';
    const message = rawMessage.trim();
    if (!message) {
      return res.status(400).json({ message: 'Notice message cannot be empty' });
    }
    if (message.length > MAX_NOTICE_LENGTH) {
      return res
        .status(400)
        .json({ message: `Notice cannot exceed ${MAX_NOTICE_LENGTH} characters` });
    }

    const noticeData = await loadNotices();
    if (!Array.isArray(noticeData.notices)) {
      noticeData.notices = [];
    }

    const entry = {
      id: crypto.randomUUID(),
      author: req.account.username,
      message,
      timestamp: new Date().toISOString(),
    };

    noticeData.notices.push(entry);
    if (noticeData.notices.length > 200) {
      noticeData.notices = noticeData.notices.slice(-200);
    }

    await saveNotices(noticeData);

    res.status(201).json({ notice: entry });
  })
);

app.get(
  '/api/procurement/requests',
  requireAuth,
  asyncHandler(async (req, res) => {
    const requests = await listProcurementRequests({
      role: req.account.role,
      username: req.account.username,
    });
    res.json({ requests });
  })
);

app.get(
  '/api/procurement/requests/:referenceId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const referenceId = String(req.params.referenceId || '').trim();
    const request = await getProcurementRequest(referenceId);
    if (req.account.role === 'user' && request.requester !== req.account.username) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }
    res.json({ request });
  })
);

app.post(
  '/api/procurement/requests',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!['user', 'dept-head', 'procurement', 'finance', 'admin'].includes(req.account.role)) {
      return res.status(403).json({ message: 'Not authorized to submit procurement requests' });
    }
    const request = await createProcurementRequest({
      requester: req.account.username,
      role: req.account.role,
      body: req.body,
    });
    res.status(201).json({ request });
  })
);

app.post(
  '/api/procurement/requests/:referenceId/department-review',
  requireAuth,
  requireRoles('dept-head'),
  asyncHandler(async (req, res) => {
    const referenceId = String(req.params.referenceId || '').trim();
    const decision = req.body?.decision;
    const notes = req.body?.notes;
    const request = await departmentReview({
      referenceId,
      reviewer: req.account.username,
      role: req.account.role,
      decision,
      notes,
    });
    res.json({ request });
  })
);

app.post(
  '/api/procurement/requests/:referenceId/finance-review',
  requireAuth,
  requireRoles('finance'),
  asyncHandler(async (req, res) => {
    const referenceId = String(req.params.referenceId || '').trim();
    const { decision, notes, budgetCode, invoiceNumber, paymentReference } = req.body || {};
    const request = await financeReview({
      referenceId,
      reviewer: req.account.username,
      role: req.account.role,
      decision,
      notes,
      budgetCode,
      invoiceNumber,
      paymentReference,
    });
    res.json({ request });
  })
);

app.post(
  '/api/procurement/requests/:referenceId/procurement-selection',
  requireAuth,
  requireRoles('procurement'),
  asyncHandler(async (req, res) => {
    const referenceId = String(req.params.referenceId || '').trim();
    const { supplier, poNumber, poDate, notes, emailLog } = req.body || {};
    const request = await procurementSelection({
      referenceId,
      actor: req.account.username,
      role: req.account.role,
      supplier,
      poNumber,
      poDate,
      notes,
      emailLog,
    });
    res.json({ request });
  })
);

app.post(
  '/api/procurement/requests/:referenceId/receipt',
  requireAuth,
  asyncHandler(async (req, res) => {
    const referenceId = String(req.params.referenceId || '').trim();
    const request = await getProcurementRequest(referenceId);
    if (
      req.account.role !== 'admin' &&
      req.account.role !== 'procurement' &&
      request.requester !== req.account.username
    ) {
      return res.status(403).json({ message: 'Only the requester can submit the receipt' });
    }
    const { reference, notes, attachments } = req.body || {};
    const updated = await recordReceipt({
      referenceId,
      actor: req.account.username,
      role: req.account.role,
      reference,
      notes,
      attachments,
    });
    res.json({ request: updated });
  })
);

app.post(
  '/api/procurement/requests/:referenceId/receipt-review',
  requireAuth,
  requireRoles('dept-head'),
  asyncHandler(async (req, res) => {
    const referenceId = String(req.params.referenceId || '').trim();
    const { decision, notes, assignee } = req.body || {};
    const request = await receiptReview({
      referenceId,
      reviewer: req.account.username,
      role: req.account.role,
      decision,
      notes,
      assignee,
    });
    res.json({ request });
  })
);

app.post(
  '/api/auth/login',
  asyncHandler(async (req, res) => {
    const rawUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const safeUsername = sanitizeUsername(rawUsername);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!rawUsername || rawUsername !== safeUsername) {
      return res.status(400).json({ message: 'Invalid username' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const accounts = await loadAccounts();
    const account = accounts.users[safeUsername];
    if (!account) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, account.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createSession(account.username);
    return res.json({
      token,
      user: toPublicUser(account),
    });
  })
);

app.post(
  '/api/auth/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.authToken) {
      revokeSession(req.authToken);
    }
    res.json({ message: 'Logged out' });
  })
);

app.get(
  '/api/auth/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const accounts = await loadAccounts();
    const account = accounts.users[req.account.username];
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    return res.json({ user: toPublicUser(account) });
  })
);

app.put(
  '/api/users/me/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'New password must be at least 4 characters long' });
    }

    const accounts = await loadAccounts();
    const username = req.account.username;
    const account = accounts.users[username];
    if (!account) {
      revokeSession(req.authToken);
      return res.status(404).json({ message: 'Account not found' });
    }

    const match = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!match) {
      return res.status(403).json({ message: 'Current password is incorrect' });
    }

    account.passwordHash = await bcrypt.hash(newPassword, 10);
    account.updatedAt = new Date().toISOString();
    await saveAccounts(accounts);

    res.json({ message: 'Password updated' });
  })
);

app.get(
  '/api/users/me/access',
  requireAuth,
  (req, res) => {
    res.json({ access: getAccessList(req.account) });
  }
);

app.get(
  '/api/admin/users',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const accounts = await loadAccounts();
    const users = Object.values(accounts.users).map((account) => toPublicUser(account));
    res.json({ users });
  })
);

app.post(
  '/api/admin/users',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const rawUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const safeUsername = sanitizeUsername(rawUsername);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const roleInput = typeof req.body?.role === 'string' ? req.body.role.trim().toLowerCase() : 'user';

    if (!rawUsername || rawUsername !== safeUsername) {
      return res.status(400).json({ message: 'Username may only include letters, numbers, dots, underscores, and dashes' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters long' });
    }
    if (!VALID_ROLES.includes(roleInput)) {
      return res
        .status(400)
        .json({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const accounts = await loadAccounts();
    if (accounts.users[safeUsername]) {
      return res.status(409).json({ message: 'A user with this username already exists' });
    }

    const normalizedAccess = await normalizeAccessEntries(Array.isArray(req.body?.access) ? req.body.access : []);
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 10);
    accounts.users[safeUsername] = {
      username: safeUsername,
      role: roleInput,
      passwordHash,
      access: normalizedAccess,
      createdAt: now,
      updatedAt: now,
    };
    await saveAccounts(accounts);
    await applyAccessLocks(normalizedAccess);

    res.status(201).json({ user: toPublicUser(accounts.users[safeUsername]) });
  })
);

app.put(
  '/api/admin/users/:username',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const rawUsername = typeof req.params.username === 'string' ? req.params.username.trim() : '';
    const safeUsername = sanitizeUsername(rawUsername);
    if (!rawUsername || rawUsername !== safeUsername) {
      return res.status(400).json({ message: 'Invalid username' });
    }

    const accounts = await loadAccounts();
    const account = accounts.users[safeUsername];
    if (!account) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {};
    if (typeof req.body?.password === 'string' && req.body.password) {
      if (req.body.password.length < 4) {
        return res.status(400).json({ message: 'Password must be at least 4 characters long' });
      }
      updates.passwordHash = await bcrypt.hash(req.body.password, 10);
    }

    if (typeof req.body?.role === 'string') {
      const role = req.body.role.trim().toLowerCase();
      if (!VALID_ROLES.includes(role)) {
        return res
          .status(400)
          .json({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` });
      }
      updates.role = role;
    }

    let normalizedAccess;
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'access')) {
      normalizedAccess = await normalizeAccessEntries(req.body.access);
      updates.access = normalizedAccess;
    }

    if (updates.passwordHash) {
      account.passwordHash = updates.passwordHash;
    }
    if (updates.role) {
      account.role = updates.role;
    }
    if (updates.access) {
      account.access = updates.access;
    }
    if (!updates.passwordHash && !updates.role && !updates.access) {
      return res.json({ user: toPublicUser(account) });
    }

    account.updatedAt = new Date().toISOString();
    await saveAccounts(accounts);
    if (updates.access) {
      await applyAccessLocks(updates.access);
    }

    res.json({ user: toPublicUser(account) });
  })
);

app.delete(
  '/api/admin/users/:username',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const rawUsername = typeof req.params.username === 'string' ? req.params.username.trim() : '';
    const safeUsername = sanitizeUsername(rawUsername);
    if (!rawUsername || rawUsername !== safeUsername) {
      return res.status(400).json({ message: 'Invalid username' });
    }

    if (safeUsername === 'Admin') {
      return res.status(400).json({ message: 'The default Admin account cannot be removed' });
    }
    if (safeUsername === req.account.username) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const accounts = await loadAccounts();
    const account = accounts.users[safeUsername];
    if (!account) {
      return res.status(404).json({ message: 'User not found' });
    }

    const remainingAdmins = Object.values(accounts.users).filter((user) => user.role === 'admin' && user.username !== safeUsername);
    if (account.role === 'admin' && remainingAdmins.length === 0) {
      return res.status(400).json({ message: 'At least one admin account must remain' });
    }

    delete accounts.users[safeUsername];
    await saveAccounts(accounts);
    revokeUserSessions(safeUsername);

    res.json({ message: 'User deleted' });
  })
);

app.get('/api/items', requireAuth, async (req, res, next) => {
  try {
    const relativePath = req.query.path ? String(req.query.path) : '';
    const { absolute, relative } = resolveAbsolute(relativePath);
    if (req.account.role !== 'admin' && !relative) {
      const hasRootAccess = getAccessList(req.account).some((entry) => entry.path === '');
      if (!hasRootAccess) {
        return res
          .status(403)
          .json({ message: 'Select a folder from your dashboard to browse files' });
      }
    }
    ensureAccountAccess(req.account, relative);

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

app.post('/api/folders', requireAuth, async (req, res, next) => {
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

    ensureAccountAccess(req.account, parentRelative);

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

app.post('/api/upload', requireAuth, (req, res, next) => {
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
      ensureAccountAccess(req.account, relative);
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

app.delete('/api/items', requireAuth, async (req, res, next) => {
  try {
    const { path: targetPath, password } = req.body;
    if (typeof targetPath !== 'string') {
      return res.status(400).json({ message: 'Path is required' });
    }

    const { absolute, relative } = resolveAbsolute(targetPath);
    ensureAccountAccess(req.account, relative);
    if (isUserRootPath(req.account, relative)) {
      return res.status(403).json({ message: 'You cannot delete a folder that grants your access' });
    }
    const { locks } = await assertUnlocked(relative, password, req.account);

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

app.put('/api/items/rename', requireAuth, async (req, res, next) => {
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

    ensureAccountAccess(req.account, relative);
    ensureAccountAccess(req.account, parentRelative);
    ensureAccountAccess(req.account, newRelative);
    if (isUserRootPath(req.account, relative)) {
      return res.status(403).json({ message: 'You cannot rename a folder that grants your access' });
    }
    const { locks } = await assertUnlocked(relative, password, req.account);

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

app.post('/api/items/lock', requireAuth, requireAdmin, async (req, res, next) => {
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
    ensureAccountAccess(req.account, relative);
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

app.post('/api/items/unlock', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { path: targetPath, password } = req.body;
    if (!targetPath || typeof targetPath !== 'string') {
      return res.status(400).json({ message: 'Path is required' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required' });
    }

    const { relative } = resolveAbsolute(targetPath);
    ensureAccountAccess(req.account, relative);
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

app.get('/api/items/content', requireAuth, async (req, res, next) => {
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
    ensureAccountAccess(req.account, relative);
    await assertUnlocked(relative, password, req.account);

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

Promise.all([ensureAccountsInitialized(), ensureChatDataInitialized(), ensureNoticesInitialized()])
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`NAS server listening on port ${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`Serving files from ${NAS_ROOT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize data stores', error);
    process.exit(1);
  });
