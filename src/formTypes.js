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
    importantPoint: '腹腔内出血や胆汁漏出の持続、術後の胆管閉塞や腸重積などの合併症が生じた場合には再開腹が必要になりますが、その場合の予後は悪いことが予想されます。',
    attachmentIds: ['anesthesia_complications'],
    blocks: [
      {
        type: 'paragraph',
        title: '適応',
        body: '末期の胆嚢粘液嚢腫、内科治療に反応しないまたは繰り返す胆嚢炎、胆石症による胆管閉塞、胆嚢腫瘍に対して"疾患が起こっている場を取り除くため"、あるいは胆嚢破裂に対して緊急的に実施します。',
      },
      {
        type: 'paragraph',
        title: '手術の内容',
        body: '胆嚢は肝臓右側に付属しているナス型の袋状の臓器で、肝臓で産生した胆汁を貯蔵しています。手術はこの胆嚢の出口（胆嚢頸〜胆嚢管）を結紮（糸で縛ること）して胆嚢を摘出します。摘出に際して、同時に総胆管の開通確認も行います。一般的に行われる手術ですが、手術部位の周囲に重要な大血管や臓器が多いことや、動物の体調や胆嚢そのものの状態、基礎疾患によっては手術中および術後の急変に十分な注意が必要です。\n\n胆嚢の疾患に伴い肝臓にも影響が出ていることが多く、その評価のため肝臓の組織検査も同時に行うほか、術後の胆汁漏出の確認のため数日間はドレーンチューブを留置します。また、術後しばらくは食欲不振が続く事が予想されることから、給餌のための食道カテーテルも同時に設置します。',
      },
      {
        type: 'checklist',
        title: '手術中および術後の注意事項',
        items: [
          '術後は安静、疼痛管理および抗菌薬の投与が必要です。',
          '食欲不振、嘔吐や下痢などの消化器症状が見られることが多いため、それらへの対症療法も同時に行います。',
          '食餌は低脂肪食への変更が推奨されます。食欲が安定するまではご自宅でも食道カテーテルを使用した給餌が必要になることがあります。',
          '基礎疾患を持つ場合や肝酵素異常が改善しない場合には術後も長期的な内科療法の継続が必要になることがあります。',
          '腹腔内出血や胆汁漏出の持続、術後に胆管閉塞や腸重積などの合併症が生じた場合には再開腹が必要になりますが、その場合の予後は悪いことが予想されます。',
          '合併症として膵炎、播種性血管内凝固、基礎疾患によっては肺水腫や術後急性腎不全などが考えられます。発症の予測は困難ですが、発症してしまった場合は緊急的な治療が必要になります。術中の出血による貧血や低アルブミン血症を起こした場合には輸血が必要になることがあります。',
        ],
      },
      {
        type: 'paragraph',
        title: '入院期間、費用の目安',
        body: '入院は通常5~7日間（状態によって延長の可能性があります）、費用は50~70万円程度（体重や状態による）です。',
      },
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
