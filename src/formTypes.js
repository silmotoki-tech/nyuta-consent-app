// 書類の分類（category）の表示名・並び順を定義
export const categories = [
  { id: 'surgery_explanation', label: '手術・処置の説明同意書' },
  { id: 'hospitalization', label: '入院・お預かり' },
  { id: 'reservation', label: '予約案内' },
  { id: 'attachment', label: '添付書類（単独では使用しません）' },
];

function defineForm({ id, label, category, attachmentIds = [], blocks = [], importantPoint = null }) {
  return { id, label, category, importantPoint, blocks, attachmentIds };
}

// 共通添付書類（単独では使わず、他の書類と組み合わせて使う）
export const attachments = [
  {
    id: 'anesthesia_complications',
    label: '麻酔および手術における合併症について',
    blocks: [],
  },
  {
    id: 'anesthesia_explanation',
    label: '麻酔のおはなし',
    blocks: [],
  },
];

// 本文は次フェーズで流し込む。今回は blocks の型だけ用意する。
export const formTypes = [
  defineForm({
    id: 'gallbladder_removal',
    label: '胆嚢摘出術',
    category: 'surgery_explanation',
    attachmentIds: ['anesthesia_complications'],
    blocks: [
      { type: 'paragraph', title: '適応', body: '' },
      { type: 'paragraph', title: '手術の内容', body: '' },
      { type: 'checklist', title: '手術中および術後の注意事項', items: [] },
    ],
  }),
  defineForm({
    id: 'soft_palate_resection',
    label: '軟口蓋切除',
    category: 'surgery_explanation',
    attachmentIds: ['anesthesia_complications'],
  }),
  defineForm({
    id: 'cruciate_ligament',
    label: '十字靭帯',
    category: 'surgery_explanation',
    attachmentIds: ['anesthesia_complications'],
  }),
  defineForm({
    id: 'patella_luxation',
    label: '膝蓋骨脱臼',
    category: 'surgery_explanation',
    attachmentIds: ['anesthesia_complications'],
  }),
  defineForm({
    id: 'chemotherapy_side_effects',
    label: '抗がん剤副作用',
    category: 'surgery_explanation',
  }),
  defineForm({
    id: 'boarding_notice',
    label: 'お預かりにあたってのご注意',
    category: 'hospitalization',
  }),
  defineForm({
    id: 'hospitalization_general',
    label: '承諾書（一般）',
    category: 'hospitalization',
  }),
  defineForm({
    id: 'examination_schedule',
    label: '検査予定',
    category: 'reservation',
  }),
  defineForm({
    id: 'surgery_schedule',
    label: '手術予定',
    category: 'reservation',
  }),
  defineForm({
    id: 'cardiology_appointment',
    label: '循環器診療予約',
    category: 'reservation',
  }),
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
