import { normalizeDateOnly } from "./dateOnly.js";

function normalizeSimplifiedRow(
  row = null,
  {
    relationIds = {},
    dateOnlyFields = []
  } = {}
) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const normalizedRow = {
    ...row
  };

  for (const [fieldName, relationName] of Object.entries(relationIds)) {
    const fieldValue = row[fieldName];
    normalizedRow[fieldName] =
      fieldValue && typeof fieldValue === "object"
        ? fieldValue.id ?? row[relationName]?.id ?? null
        : fieldValue ?? row[relationName]?.id ?? null;
  }

  for (const fieldName of dateOnlyFields) {
    normalizedRow[fieldName] = normalizeDateOnly(row[fieldName]);
  }

  return normalizedRow;
}

export { normalizeSimplifiedRow };
