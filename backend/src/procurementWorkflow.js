const crypto = require('crypto');
const {
  loadProcurementStore,
  saveProcurementStore,
  nextReferenceId,
  cloneRequest,
} = require('./procurementStore');

const FORM_TYPES = ['equipment', 'software'];

const STATUS = {
  DEPARTMENT_REVIEW: 'department_review',
  DEPARTMENT_REJECTED: 'department_rejected',
  FINANCE_REVIEW: 'finance_review',
  FINANCE_REJECTED: 'finance_rejected',
  PROCUREMENT: 'procurement',
  PO_SENT: 'po_sent',
  AWAITING_RECEIPT: 'awaiting_receipt',
  DEPARTMENT_RECEIPT_REVIEW: 'department_receipt_review',
  FINANCE_INVOICE_REVIEW: 'finance_invoice_review',
  COMPLETED: 'completed',
};

const HISTORY_ACTIONS = {
  CREATED: 'request.created',
  UPDATED: 'request.updated',
  DEPARTMENT_REVIEW: 'department.review',
  FINANCE_REVIEW: 'finance.review',
  PROCUREMENT_DECISION: 'procurement.decision',
  RECEIPT_SUBMITTED: 'receipt.submitted',
  RECEIPT_REVIEW: 'receipt.review',
  INVOICE_REVIEW: 'invoice.review',
};

function nowIso() {
  return new Date().toISOString();
}

function asCleanString(value, { maxLength = 2000 } = {}) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.slice(0, maxLength).trim();
}

function sanitizeNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/,/g, ''));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function sanitizeDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function sanitizeAttachments(input) {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .map((item) => asCleanString(item, { maxLength: 256 }))
    .filter(Boolean);
}

function historyEntry({ action, actor, role, notes = '', details = {} }) {
  return {
    id: crypto.randomUUID(),
    action,
    actor,
    role,
    notes: asCleanString(notes, { maxLength: 1000 }),
    details,
    timestamp: nowIso(),
  };
}

function ensureRequest(store, refId) {
  const request = store.requests.find((entry) => entry.id === refId);
  if (!request) {
    const error = new Error('Procurement request not found');
    error.status = 404;
    throw error;
  }
  return request;
}

function pushHistory(request, entry) {
  if (!Array.isArray(request.history)) {
    request.history = [];
  }
  request.history.push(entry);
}

function baseRequestProjection(request) {
  return cloneRequest(request);
}

async function createProcurementRequest({
  requester,
  role,
  body,
}) {
  const formType = asCleanString(body?.formType).toLowerCase();
  if (!FORM_TYPES.includes(formType)) {
    const error = new Error('Unknown procurement form type');
    error.status = 400;
    throw error;
  }

  const department = asCleanString(body?.department, { maxLength: 120 });
  if (!department) {
    const error = new Error('Department is required');
    error.status = 400;
    throw error;
  }

  const title = asCleanString(body?.title, { maxLength: 160 });
  if (!title) {
    const error = new Error('Request title is required');
    error.status = 400;
    throw error;
  }

  const description = asCleanString(body?.description, { maxLength: 4000 });
  if (!description) {
    const error = new Error('Description is required');
    error.status = 400;
    throw error;
  }

  const justification = asCleanString(body?.justification, { maxLength: 4000 });
  const amount = sanitizeNumber(body?.amount);
  const currency = asCleanString(body?.currency || 'USD', { maxLength: 8 }) || 'USD';
  const neededBy = sanitizeDate(body?.neededBy);
  const supplierPreference = asCleanString(body?.supplierPreference, { maxLength: 160 });
  const attachments = sanitizeAttachments(body?.attachments);
  const assignee = asCleanString(body?.assignee, { maxLength: 160 });

  const store = await loadProcurementStore();
  const sequence = store.nextSequence || 1;
  const referenceId = nextReferenceId(sequence);
  const now = nowIso();

  const requestEntry = {
    id: referenceId,
    sequence,
    formType,
    requester,
    requesterRole: role,
    department,
    title,
    description,
    justification,
    amount,
    currency,
    neededBy,
    supplierPreference,
    attachments,
    assignee,
    status: STATUS.DEPARTMENT_REVIEW,
    currentStep: 'department_review',
    departmentReview: {
      status: 'pending',
      reviewer: null,
      reviewedAt: null,
      notes: '',
    },
    financeReview: {
      status: 'idle',
      reviewer: null,
      reviewedAt: null,
      notes: '',
      budgetCode: '',
      decision: null,
    },
    procurementAction: {
      status: 'idle',
      actor: null,
      actedAt: null,
      supplier: '',
      poNumber: '',
      poDate: null,
      notes: '',
      emailLog: '',
    },
    assetReceipt: {
      status: 'idle',
      submittedBy: null,
      submittedAt: null,
      notes: '',
      reference: '',
      attachments: [],
    },
    departmentReceiptReview: {
      status: 'idle',
      reviewer: null,
      reviewedAt: null,
      notes: '',
      decision: null,
    },
    invoiceVerification: {
      status: 'idle',
      reviewer: null,
      reviewedAt: null,
      notes: '',
      invoiceNumber: '',
      paymentReference: '',
      decision: null,
    },
    history: [],
    createdAt: now,
    updatedAt: now,
  };

  pushHistory(
    requestEntry,
    historyEntry({
      action: HISTORY_ACTIONS.CREATED,
      actor: requester,
      role,
      notes: body?.notes || '',
      details: {
        title,
        department,
        amount,
        currency,
      },
    })
  );

  store.nextSequence = sequence + 1;
  store.requests.push(requestEntry);
  await saveProcurementStore(store);

  return baseRequestProjection(requestEntry);
}

function filterByRole(requests, { role, username }) {
  if (role === 'admin') {
    return requests;
  }
  if (role === 'user') {
    return requests.filter((entry) => entry.requester === username);
  }
  if (role === 'dept-head') {
    return requests.filter((entry) =>
      entry.status === STATUS.DEPARTMENT_REVIEW ||
      entry.departmentReceiptReview?.status === 'pending' ||
      entry.departmentReceiptReview?.status === 'idle'
    );
  }
  if (role === 'finance') {
    return requests.filter((entry) =>
      entry.status === STATUS.FINANCE_REVIEW ||
      entry.status === STATUS.FINANCE_INVOICE_REVIEW ||
      entry.status === STATUS.FINANCE_REJECTED ||
      entry.status === STATUS.COMPLETED
    );
  }
  if (role === 'procurement') {
    return requests.filter((entry) =>
      entry.status === STATUS.PROCUREMENT ||
      entry.status === STATUS.PO_SENT ||
      entry.status === STATUS.AWAITING_RECEIPT ||
      entry.status === STATUS.COMPLETED
    );
  }
  return requests;
}

async function listProcurementRequests({ role, username }) {
  const store = await loadProcurementStore();
  const filtered = filterByRole(store.requests, { role, username });
  return filtered.map((entry) => baseRequestProjection(entry));
}

async function getProcurementRequest(referenceId) {
  const store = await loadProcurementStore();
  const request = ensureRequest(store, referenceId);
  return baseRequestProjection(request);
}

async function departmentReview({ referenceId, reviewer, role, decision, notes }) {
  const normalizedDecision = asCleanString(decision).toLowerCase();
  if (!['approved', 'rejected'].includes(normalizedDecision)) {
    const error = new Error('Decision must be approved or rejected');
    error.status = 400;
    throw error;
  }

  const store = await loadProcurementStore();
  const request = ensureRequest(store, referenceId);

  if (request.status !== STATUS.DEPARTMENT_REVIEW) {
    const error = new Error('Request is not awaiting department review');
    error.status = 400;
    throw error;
  }

  request.departmentReview.status = normalizedDecision;
  request.departmentReview.reviewer = reviewer;
  request.departmentReview.reviewedAt = nowIso();
  request.departmentReview.notes = asCleanString(notes, { maxLength: 2000 });
  request.departmentReview.decision = normalizedDecision;

  if (normalizedDecision === 'approved') {
    request.status = STATUS.FINANCE_REVIEW;
    request.currentStep = 'finance_review';
    request.financeReview.status = 'pending';
  } else {
    request.status = STATUS.DEPARTMENT_REJECTED;
    request.currentStep = 'closed';
    request.financeReview.status = 'idle';
  }

  request.updatedAt = nowIso();

  pushHistory(
    request,
    historyEntry({
      action: HISTORY_ACTIONS.DEPARTMENT_REVIEW,
      actor: reviewer,
      role,
      notes,
      details: { decision: normalizedDecision },
    })
  );

  await saveProcurementStore(store);
  return baseRequestProjection(request);
}

async function financeReview({
  referenceId,
  reviewer,
  role,
  decision,
  notes,
  budgetCode,
  invoiceNumber,
  paymentReference,
}) {
  const normalizedDecision = asCleanString(decision).toLowerCase();
  if (!['approved', 'rejected'].includes(normalizedDecision)) {
    const error = new Error('Decision must be approved or rejected');
    error.status = 400;
    throw error;
  }

  const store = await loadProcurementStore();
  const request = ensureRequest(store, referenceId);

  if (
    request.status !== STATUS.FINANCE_REVIEW &&
    request.status !== STATUS.FINANCE_INVOICE_REVIEW
  ) {
    const error = new Error('Request is not awaiting finance action');
    error.status = 400;
    throw error;
  }

  const targetStage = request.status === STATUS.FINANCE_REVIEW ? 'budget' : 'invoice';

  const record = request.status === STATUS.FINANCE_REVIEW ? request.financeReview : request.invoiceVerification;

  record.status = normalizedDecision;
  record.decision = normalizedDecision;
  record.reviewer = reviewer;
  record.reviewedAt = nowIso();
  record.notes = asCleanString(notes, { maxLength: 2000 });
  if (targetStage === 'budget') {
    record.budgetCode = asCleanString(budgetCode, { maxLength: 64 });
  } else {
    record.invoiceNumber = asCleanString(invoiceNumber, { maxLength: 64 }) || record.invoiceNumber || '';
    record.paymentReference = asCleanString(paymentReference, { maxLength: 80 }) || record.paymentReference || '';
  }

  if (request.status === STATUS.FINANCE_REVIEW) {
    if (normalizedDecision === 'approved') {
      request.status = STATUS.PROCUREMENT;
      request.currentStep = 'procurement';
      request.procurementAction.status = 'pending';
    } else {
      request.status = STATUS.FINANCE_REJECTED;
      request.currentStep = 'closed';
      request.procurementAction.status = 'idle';
    }
  } else if (request.status === STATUS.FINANCE_INVOICE_REVIEW) {
    if (normalizedDecision === 'approved') {
      request.status = STATUS.COMPLETED;
      request.currentStep = 'closed';
    } else {
      request.status = STATUS.FINANCE_REJECTED;
      request.currentStep = 'closed';
    }
  }

  request.updatedAt = nowIso();

  pushHistory(
    request,
    historyEntry({
      action: HISTORY_ACTIONS.FINANCE_REVIEW,
      actor: reviewer,
      role,
      notes,
      details: {
        decision: normalizedDecision,
        stage: targetStage,
        budgetCode: targetStage === 'budget' ? record.budgetCode : undefined,
        invoiceNumber: targetStage === 'invoice' ? record.invoiceNumber : undefined,
        paymentReference:
          targetStage === 'invoice' ? request.invoiceVerification.paymentReference : undefined,
      },
    })
  );

  await saveProcurementStore(store);
  return baseRequestProjection(request);
}

async function procurementSelection({ referenceId, actor, role, supplier, poNumber, poDate, notes, emailLog }) {
  const store = await loadProcurementStore();
  const request = ensureRequest(store, referenceId);

  if (request.status !== STATUS.PROCUREMENT) {
    const error = new Error('Request is not awaiting procurement action');
    error.status = 400;
    throw error;
  }

  request.procurementAction.status = 'completed';
  request.procurementAction.actor = actor;
  request.procurementAction.actedAt = nowIso();
  request.procurementAction.supplier = asCleanString(supplier, { maxLength: 160 });
  request.procurementAction.poNumber = asCleanString(poNumber, { maxLength: 64 });
  request.procurementAction.poDate = sanitizeDate(poDate);
  request.procurementAction.notes = asCleanString(notes, { maxLength: 2000 });
  request.procurementAction.emailLog = asCleanString(emailLog, { maxLength: 1000 });

  request.status = STATUS.PO_SENT;
  request.currentStep = 'awaiting_receipt';
  request.assetReceipt.status = 'pending';
  request.updatedAt = nowIso();

  pushHistory(
    request,
    historyEntry({
      action: HISTORY_ACTIONS.PROCUREMENT_DECISION,
      actor,
      role,
      notes,
      details: {
        supplier: request.procurementAction.supplier,
        poNumber: request.procurementAction.poNumber,
        poDate: request.procurementAction.poDate,
      },
    })
  );

  await saveProcurementStore(store);
  return baseRequestProjection(request);
}

async function recordReceipt({ referenceId, actor, role, reference, notes, attachments }) {
  const store = await loadProcurementStore();
  const request = ensureRequest(store, referenceId);

  if (request.status !== STATUS.PO_SENT && request.status !== STATUS.AWAITING_RECEIPT) {
    const error = new Error('Request is not awaiting receipt');
    error.status = 400;
    throw error;
  }

  request.assetReceipt.status = 'submitted';
  request.assetReceipt.submittedBy = actor;
  request.assetReceipt.submittedAt = nowIso();
  request.assetReceipt.notes = asCleanString(notes, { maxLength: 2000 });
  request.assetReceipt.reference = asCleanString(reference, { maxLength: 160 });
  request.assetReceipt.attachments = sanitizeAttachments(attachments);

  request.status = STATUS.AWAITING_RECEIPT;
  request.currentStep = 'department_receipt';
  request.departmentReceiptReview.status = 'pending';
  request.updatedAt = nowIso();

  pushHistory(
    request,
    historyEntry({
      action: HISTORY_ACTIONS.RECEIPT_SUBMITTED,
      actor,
      role,
      notes,
      details: {
        reference: request.assetReceipt.reference,
      },
    })
  );

  await saveProcurementStore(store);
  return baseRequestProjection(request);
}

async function receiptReview({ referenceId, reviewer, role, decision, notes, assignee }) {
  const normalizedDecision = asCleanString(decision).toLowerCase();
  if (!['approved', 'rejected'].includes(normalizedDecision)) {
    const error = new Error('Decision must be approved or rejected');
    error.status = 400;
    throw error;
  }

  const store = await loadProcurementStore();
  const request = ensureRequest(store, referenceId);

  if (request.status !== STATUS.AWAITING_RECEIPT) {
    const error = new Error('Receipt is not awaiting department review');
    error.status = 400;
    throw error;
  }

  request.departmentReceiptReview.status = normalizedDecision;
  request.departmentReceiptReview.decision = normalizedDecision;
  request.departmentReceiptReview.reviewer = reviewer;
  request.departmentReceiptReview.reviewedAt = nowIso();
  request.departmentReceiptReview.notes = asCleanString(notes, { maxLength: 2000 });
  request.assignee = asCleanString(assignee, { maxLength: 160 }) || request.assignee;

  if (normalizedDecision === 'approved') {
    request.status = STATUS.FINANCE_INVOICE_REVIEW;
    request.currentStep = 'finance_invoice_review';
    request.invoiceVerification.status = 'pending';
  } else {
    request.status = STATUS.PO_SENT;
    request.currentStep = 'awaiting_receipt';
    request.assetReceipt.status = 'pending';
  }

  request.updatedAt = nowIso();

  pushHistory(
    request,
    historyEntry({
      action: HISTORY_ACTIONS.RECEIPT_REVIEW,
      actor: reviewer,
      role,
      notes,
      details: {
        decision: normalizedDecision,
        assignee: request.assignee,
      },
    })
  );

  await saveProcurementStore(store);
  return baseRequestProjection(request);
}

module.exports = {
  STATUS,
  createProcurementRequest,
  listProcurementRequests,
  getProcurementRequest,
  departmentReview,
  financeReview,
  procurementSelection,
  recordReceipt,
  receiptReview,
};
