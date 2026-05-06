import { AppError } from "@jskit-ai/kernel/server/runtime/errors";
import { returnJsonApiDocument } from "@jskit-ai/http-runtime/shared";

function return404IfNotFound(document = null) {
  if (!document) {
    throw new AppError(404, "Document not found.");
  }
  return document;
}

function createService({ programTemplatesRepository } = {}) {
  if (!programTemplatesRepository) {
    throw new TypeError("createService requires programTemplatesRepository.");
  }

  async function queryDocuments(query = {}, options = {}) {
    return returnJsonApiDocument(await programTemplatesRepository.queryDocuments(query, {
      trx: options?.trx || null,
      context: options?.context || null
    }));
  }

  async function getDocumentById(recordId, options = {}) {
    return returnJsonApiDocument(return404IfNotFound(await programTemplatesRepository.getDocumentById(recordId, {
      trx: options?.trx || null,
      context: options?.context || null,
      include: options?.include
    })));
  }

  async function createDocument(payload = {}, options = {}) {
    return returnJsonApiDocument(await programTemplatesRepository.createDocument(payload, {
      trx: options?.trx || null,
      context: options?.context || null
    }));
  }

  async function patchDocumentById(recordId, payload = {}, options = {}) {
    return returnJsonApiDocument(return404IfNotFound(await programTemplatesRepository.patchDocumentById(recordId, payload, {
      trx: options?.trx || null,
      context: options?.context || null
    })));
  }

  async function deleteDocumentById(recordId, options = {}) {
    return programTemplatesRepository.deleteDocumentById(recordId, {
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
