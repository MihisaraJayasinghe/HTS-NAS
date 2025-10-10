const path = require('path');
const fs = require('fs/promises');

const RECYCLE_BIN_FILE = path.join(__dirname, '..', '..', 'recycleBin.json');

async function readRecycleBinFile() {
  try {
    const data = await fs.readFile(RECYCLE_BIN_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => ({ ...entry }));
    }
    if (parsed && Array.isArray(parsed.entries)) {
      return parsed.entries.map((entry) => ({ ...entry }));
    }
    return [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(
        RECYCLE_BIN_FILE,
        JSON.stringify({ entries: [] }, null, 2)
      );
      return [];
    }
    throw error;
  }
}

async function writeRecycleBinFile(entries) {
  const payload = Array.isArray(entries) ? entries.map((entry) => ({ ...entry })) : [];
  await fs.writeFile(
    RECYCLE_BIN_FILE,
    JSON.stringify({ entries: payload }, null, 2)
  );
}

async function ensureRecycleBinInitialized() {
  await readRecycleBinFile();
}

async function loadRecycleBinEntries() {
  const entries = await readRecycleBinFile();
  return entries.map((entry) => ({ ...entry }));
}

async function saveRecycleBinEntries(entries) {
  await writeRecycleBinFile(entries);
}

async function addRecycleBinEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('Recycle bin entry must be an object');
  }
  const entries = await readRecycleBinFile();
  entries.push({ ...entry });
  await writeRecycleBinFile(entries);
  return entry;
}

module.exports = {
  ensureRecycleBinInitialized,
  loadRecycleBinEntries,
  saveRecycleBinEntries,
  addRecycleBinEntry,
};

