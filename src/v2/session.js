export function createInitialSession() {
  return {
    ownerName: '',
    petName: '',
    date: new Date().toISOString().split('T')[0],
    visitTime: '',
    foodPortions: '',
    phone: '',
    emergencyContact: '',
    selectedDocumentIds: ['ippan_shujutsu'],
    procedureSelections: {
      ippan_shujutsu: { selected: [], other: '' },
    },
    requiresFasting: false,
    documentSessions: [],
  };
}

export function createDocumentSession(documentId) {
  return {
    documentId,
    slideCheckTimestamps: {},
    resuscitationChoice: null,
    signatureDataUrl: null,
    signedAt: null,
    explainerStaff: '',
    scheduleEntryStaff: '',
    scheduleEntryChecked: false,
    printedAt: [],
  };
}

export function ensureDocumentSession(session, documentId) {
  const existing = (session.documentSessions || []).find((item) => item.documentId === documentId);
  if (existing) return existing;
  return createDocumentSession(documentId);
}

export function isConditionMet(condition, session) {
  if (!condition) return true;
  return Boolean(session?.[condition]);
}

export function visibleSlides(documentDef, session) {
  return (documentDef?.slides || []).filter((slide) => isConditionMet(slide.condition, session));
}

export function normalizeContentItem(item) {
  if (typeof item === 'string') return { text: item };
  return item || { text: '' };
}

export function visibleContentItems(items, session) {
  return (items || [])
    .map(normalizeContentItem)
    .filter((item) => isConditionMet(item.condition, session));
}

export function uncheckedSlideNumbers(documentDef, documentSession, session) {
  if (!documentDef || !documentSession) return [];
  return visibleSlides(documentDef, session)
    .map((slide, index) => (documentSession.slideCheckTimestamps?.[slide.id] ? null : index + 1))
    .filter(Boolean);
}

export function allSlidesChecked(documentDef, documentSession, session) {
  return uncheckedSlideNumbers(documentDef, documentSession, session).length === 0;
}

export function formatCheckedAt(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
