// 書類の分類（category）の表示名・並び順を定義
// 実際の文言（本文）は別フェーズで詰めるため、ここでは仮テキストのみ扱う。
export const categories = [
  { id: 'surgery_explanation', label: '手術・処置の説明同意書' },
  { id: 'hospitalization', label: '入院・お預かり' },
  { id: 'reservation', label: '予約案内' },
  { id: 'attachment', label: '添付書類（単独では使用しません）' },
];

// 共通添付書類（単独では使わず、他の書類と組み合わせて使う）
export const attachments = [
  {
    id: 'anesthesia_complications',
    label: '麻酔および手術における合併症について',
    bodyPlaceholder: true,
  },
  {
    id: 'anesthesia_explanation',
    label: '麻酔のおはなし',
    bodyPlaceholder: true,
  },
];

// 書類タイプ定義。本文は仮テキスト（プレースホルダー）とし、
// 後で本物の文言に差し替えるだけで済むようにする。
export const formTypes = [
  {
    id: 'gallbladder_removal',
    label: '胆嚢摘出術',
    category: 'surgery_explanation',
    bodyPlaceholder: true,
    attachmentIds: ['anesthesia_complications'],
  },
  {
    id: 'soft_palate_resection',
    label: '軟口蓋切除',
    category: 'surgery_explanation',
    bodyPlaceholder: true,
    attachmentIds: ['anesthesia_complications'],
  },
  {
    id: 'cruciate_ligament',
    label: '十字靭帯',
    category: 'surgery_explanation',
    bodyPlaceholder: true,
    attachmentIds: ['anesthesia_complications'],
  },
  {
    id: 'patella_luxation',
    label: '膝蓋骨脱臼',
    category: 'surgery_explanation',
    bodyPlaceholder: true,
    attachmentIds: ['anesthesia_complications'],
  },
  {
    id: 'chemotherapy_side_effects',
    label: '抗がん剤副作用',
    category: 'surgery_explanation',
    bodyPlaceholder: true,
    attachmentIds: [],
  },
  {
    id: 'boarding_notice',
    label: 'お預かりにあたってのご注意',
    category: 'hospitalization',
    bodyPlaceholder: true,
    attachmentIds: [],
  },
  {
    id: 'hospitalization_general',
    label: '承諾書（一般）',
    category: 'hospitalization',
    bodyPlaceholder: true,
    attachmentIds: [],
  },
  {
    id: 'examination_schedule',
    label: '検査予定',
    category: 'reservation',
    bodyPlaceholder: true,
    attachmentIds: [],
  },
  {
    id: 'surgery_schedule',
    label: '手術予定',
    category: 'reservation',
    bodyPlaceholder: true,
    attachmentIds: [],
  },
  {
    id: 'cardiology_appointment',
    label: '循環器診療予約',
    category: 'reservation',
    bodyPlaceholder: true,
    attachmentIds: [],
  },
  // ... 以下、種類を追加していく
];

export function getCategoryLabel(categoryId) {
  return categories.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export function getFormType(formTypeId) {
  return formTypes.find((f) => f.id === formTypeId);
}

export function getAttachment(attachmentId) {
  return attachments.find((a) => a.id === attachmentId);
}

// 予約案内（reservation）は同意書というより予約票のため、署名欄を簡易にする
export function isSignatureRequired(categoryId) {
  return categoryId !== 'reservation';
}
