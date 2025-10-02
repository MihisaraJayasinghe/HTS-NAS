const path = require('path');
const fs = require('fs/promises');
const {
  loadAccounts,
  saveAccounts,
  toPublicUser,
} = require('../stores/accountStore');

const CHAT_FILE = path.join(__dirname, '..', '..', 'chat.json');
const NOTICES_FILE = path.join(__dirname, '..', '..', 'notices.json');
const PROCUREMENT_FILE = path.join(__dirname, '..', '..', 'procurement.json');

async function loadJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT' && typeof fallback !== 'undefined') {
      return fallback;
    }
    throw error;
  }
}

async function saveJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

function replaceUsernameDeep(value, oldUsername, newUsername) {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const result = replaceUsernameDeep(item, oldUsername, newUsername);
      if (result.changed) {
        changed = true;
      }
      return result.value;
    });
    return { changed, value: next };
  }
  if (value && typeof value === 'object') {
    let changed = false;
    const next = {};
    Object.entries(value).forEach(([key, val]) => {
      const result = replaceUsernameDeep(val, oldUsername, newUsername);
      if (result.changed) {
        changed = true;
      }
      next[key] = result.value;
    });
    return { changed, value: next };
  }
  if (typeof value === 'string' && value === oldUsername) {
    return { changed: true, value: newUsername };
  }
  return { changed: false, value };
}

async function replaceInStore(filePath, fallback, oldUsername, newUsername) {
  const data = await loadJson(filePath, fallback);
  const { changed, value } = replaceUsernameDeep(data, oldUsername, newUsername);
  if (changed) {
    await saveJson(filePath, value);
  }
}

async function renameAccountUsername(oldUsername, newUsername) {
  const accounts = await loadAccounts();
  const account = accounts.users[oldUsername];
  if (!account) {
    const error = new Error('Account not found');
    error.status = 404;
    throw error;
  }
  if (accounts.users[newUsername]) {
    const error = new Error('A user with this username already exists');
    error.status = 409;
    throw error;
  }

  delete accounts.users[oldUsername];
  account.username = newUsername;
  account.updatedAt = new Date().toISOString();
  accounts.users[newUsername] = account;
  await saveAccounts(accounts);

  await Promise.all([
    replaceInStore(CHAT_FILE, { conversations: {} }, oldUsername, newUsername),
    replaceInStore(NOTICES_FILE, { notices: [] }, oldUsername, newUsername),
    replaceInStore(PROCUREMENT_FILE, { nextSequence: 1, requests: [] }, oldUsername, newUsername),
  ]);

  return {
    account,
    publicUser: toPublicUser(account),
  };
}

module.exports = {
  renameAccountUsername,
};
