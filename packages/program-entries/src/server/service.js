import { AppError } from "@jskit-ai/kernel/server/runtime/errors";
import { returnJsonApiDocument } from "@jskit-ai/http-runtime/shared";

function return404IfNotFound(document = null) {
  if (!document) {
    throw new AppError(404, "Document not found.");
  }
  return document;
}

function createService({ programEntriesRepository } = {}) {
  if (!programEntriesRepository) {
    throw new TypeError("createService requires programEntriesRepository.");
  }

  async function queryDocuments(query = {}, options = {}) {
    return returnJsonApiDocument(await programEntriesRepository.queryDocuments(query, {
      trx: options?.trx || null,
      context: options?.context || null
    }));
  }

  async function getDocumentById(recordId, options = {}) {
    return returnJsonApiDocument(return404IfNotFound(await programEntriesRepository.getDocumentById(recordId, {
      trx: options?.trx || null,
      context: options?.context || null,
      include: options?.include
    })));
  }

  async function createDocument(payload = {}, options = {}) {
    return returnJsonApiDocument(await programEntriesRepository.createDocument(payload, {
      trx: options?.trx || null,
      context: options?.context || null
    }));
  }

  async function patchDocumentById(recordId, payload = {}, options = {}) {
    return returnJsonApiDocument(return404IfNotFound(await programEntriesRepository.patchDocumentById(recordId, payload, {
      trx: options?.trx || null,
      context: options?.context || null
    })));
  }

  async function deleteDocumentById(recordId, options = {}) {
    return programEntriesRepository.deleteDocumentById(recordId, {
      trx: options?.trx || null,
      context: options?.context || null
    });
  }

  return Object.freeze({
    queryDocuments,
    getDocumentById,
    createDocument,
    patchDocumentById,
    deleteDocumentById
  });
}

export { createService };
