import {
  createJsonRestContext,
  extractJsonRestCollectionRows
} from "@jskit-ai/json-rest-api-core/server/jsonRestApiHost";

function compactIds(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean))];
}

function jsonRestContext(options = {}) {
  return createJsonRestContext(options?.context || null);
}

function transaction(options = {}) {
  return options?.trx || null;
}

function documentId(document = null) {
  return document?.data?.id ? String(document.data.id) : null;
}

function simplifiedRows(payload = null, normalize = (row) => row) {
  return extractJsonRestCollectionRows(payload).map((row) => normalize(row)).filter(Boolean);
}

export {
  compactIds,
  documentId,
  jsonRestContext,
  simplifiedRows,
  transaction
};
