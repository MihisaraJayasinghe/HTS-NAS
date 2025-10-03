const path = require('path');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs');

const ACCOUNTS_FILE = path.join(__dirname, '..', '..', 'accounts.json');

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

module.exports = {
  ACCOUNTS_FILE,
  loadAccounts,
  saveAccounts,
  ensureAccountsInitialized,
  sanitizeUsername,
  getAccessList,
  toPublicUser,
};
