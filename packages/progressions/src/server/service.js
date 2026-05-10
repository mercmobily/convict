import { AppError } from "@jskit-ai/kernel/server/runtime/errors";
import { returnJsonApiDocument } from "@jskit-ai/http-runtime/shared";

function return404IfNotFound(document = null) {
  if (!document) {
    throw new AppError(404, "Document not found.");
  }
  return document;
}

function createService({ progressionsRepository } = {}) {
  if (!progressionsRepository) {
    throw new TypeError("createService requires progressionsRepository.");
  }

  async function queryDocuments(query = {}, options = {}) {
    return returnJsonApiDocument(await progressionsRepository.queryDocuments(query, {
      trx: options?.trx || null,
      context: options?.context || null
    }));
  }

  async function getDocumentById(recordId, options = {}) {
    return returnJsonApiDocument(return404IfNotFound(await progressionsRepository.getDocumentById(recordId, {
      trx: options?.trx || null,
      context: options?.context || null,
      include: options?.include
    })));
  }

  async function createDocument(payload = {}, options = {}) {
    return returnJsonApiDocument(await progressionsRepository.createDocument(payload, {
      trx: options?.trx || null,
      context: options?.context || null
    }));
  }

  async function patchDocumentById(recordId, payload = {}, options = {}) {
    return returnJsonApiDocument(return404IfNotFound(await progressionsRepository.patchDocumentById(recordId, payload, {
      trx: options?.trx || null,
      context: options?.context || null
    })));
  }

  async function deleteDocumentById(recordId, options = {}) {
    return progressionsRepository.deleteDocumentById(recordId, {
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
