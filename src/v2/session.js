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

export function uncheckedSlideNumbers(documentDef, documentSession) {
  if (!documentDef || !documentSession) return [];
  return documentDef.slides
    .map((slide, index) => (documentSession.slideCheckTimestamps?.[slide.id] ? null : index + 1))
    .filter(Boolean);
}

export function allSlidesChecked(documentDef, documentSession) {
  return uncheckedSlideNumbers(documentDef, documentSession).length === 0;
}

export function formatCheckedAt(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
