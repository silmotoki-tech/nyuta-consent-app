import { ippanShujutsu } from './ippan-shujutsu';
import { kensaChuijikou } from './kensa-chuijikou';

export const documents = [ippanShujutsu, kensaChuijikou];

export function getDocument(id) {
  return documents.find((document) => document.id === id) || null;
}

export function getDocumentsByIds(ids) {
  return (ids || []).map((id) => getDocument(id)).filter(Boolean);
}
