import { AppError } from "@jskit-ai/kernel/server/runtime/errors";
import { returnJsonApiDocument } from "@jskit-ai/http-runtime/shared";

function return404IfNotFound(document = null) {
  if (!document) {
    throw new AppError(404, "Document not found.");
  }
  return document;
}

function createService({ workoutOccurrencesRepository } = {}) {
  if (!workoutOccurrencesRepository) {
    throw new TypeError("createService requires workoutOccurrencesRepository.");
  }

  async function queryDocuments(query = {}, options = {}) {
    return returnJsonApiDocument(await workoutOccurrencesRepository.queryDocuments(query, {
      trx: options?.trx || null,
      context: options?.context || null
    }));
  }

  async function getDocumentById(recordId, options = {}) {
    return returnJsonApiDocument(return404IfNotFound(await workoutOccurrencesRepository.getDocumentById(recordId, {
      trx: options?.trx || null,
      context: options?.context || null,
      include: options?.include
    })));
  }

  async function createDocument(payload = {}, options = {}) {
    return returnJsonApiDocument(await workoutOccurrencesRepository.createDocument(payload, {
      trx: options?.trx || null,
      context: options?.context || null
    }));
  }

  async function patchDocumentById(recordId, payload = {}, options = {}) {
    return returnJsonApiDocument(return404IfNotFound(await workoutOccurrencesRepository.patchDocumentById(recordId, payload, {
      trx: options?.trx || null,
      context: options?.context || null
    })));
  }

  async function deleteDocumentById(recordId, options = {}) {
    return workoutOccurrencesRepository.deleteDocumentById(recordId, {
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
