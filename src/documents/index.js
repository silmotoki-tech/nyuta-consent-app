import { ippanShujutsu } from './ippan-shujutsu';

export const documents = [ippanShujutsu];

export function getDocument(id) {
  return documents.find((document) => document.id === id) || null;
}

export function getDocumentsByIds(ids) {
  return (ids || []).map((id) => getDocument(id)).filter(Boolean);
}
