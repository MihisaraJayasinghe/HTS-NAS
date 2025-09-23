const path = require('path');
const fs = require('fs/promises');

const PROCUREMENT_STORE_PATH = path.join(__dirname, '..', 'procurement.json');

const DEFAULT_STORE = {
  nextSequence: 1,
  requests: [],
};

async function loadProcurementStore() {
  try {
    const raw = await fs.readFile(PROCUREMENT_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.nextSequence !== 'number' ||
      !Array.isArray(parsed.requests)
    ) {
      throw new Error('Invalid procurement store format');
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT' || error.name === 'SyntaxError') {
      await saveProcurementStore(DEFAULT_STORE);
      return { ...DEFAULT_STORE };
    }
    throw error;
  }
}

async function saveProcurementStore(store) {
  const payload = {
    nextSequence: typeof store?.nextSequence === 'number' ? store.nextSequence : 1,
    requests: Array.isArray(store?.requests) ? store.requests : [],
  };
  await fs.writeFile(PROCUREMENT_STORE_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

function nextReferenceId(sequence) {
  const padded = String(sequence).padStart(5, '0');
  return `PR-${padded}`;
}

function cloneRequest(request) {
  return JSON.parse(JSON.stringify(request));
}

module.exports = {
  loadProcurementStore,
  saveProcurementStore,
  nextReferenceId,
  cloneRequest,
};
