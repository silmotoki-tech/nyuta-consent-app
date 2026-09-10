import slide01 from '../assets/slides/ippan-shujutsu/01.png';
import slide02 from '../assets/slides/ippan-shujutsu/02.png';
import slide03 from '../assets/slides/ippan-shujutsu/03.png';

export const ippanShujutsu = {
  id: 'ippan_shujutsu',
  label: '一般手術注意事項',
  category: 'reservation',
  requiresResuscitationChoice: false,

  procedureOptions: [
    '去勢手術',
    '避妊手術',
    '歯石除去',
    '乳腺腫瘍切除',
    '抗がん剤治療',
    'その他',
  ],

  slides: [
    { id: 'ippan_shujutsu_01', image: slide01 },
    { id: 'ippan_shujutsu_02', image: slide02 },
    { id: 'ippan_shujutsu_03', image: slide03 },
  ],
  slideVersion: 'v2026-09-08',

  fullText: {
    noticeBar: '混雑や診察状況により当日お預かりに時間がかかることがあります。お時間に余裕をもってお越しください。',
    items: [
      '前日の22時以降は食事(水以外)をとらないでご来院ください。（食べたものを吐いてしまうと危険なため）水はご来院前まで飲んでも大丈夫です。',
      '普段食べているフードを＿＿＿回分ご持参ください。',
      '可能であれば、排便排尿をしてからご来院ください。',
      '１か月以内のノミ・ダニの予防と１年以内のワクチン接種が必要です。(予防がない場合は隔離お預かりの料金が発生します)',
    ],
    footnotes: [
      '当院で処方の予防薬を使用していない場合に、ノミやダニを発見した場合は駆虫と施設消毒費用(6000円)＋予防薬の費用を頂きます。',
      '手術にあたっては手術部位の毛刈りが必要になります。',
      '当日キャンセルの場合は予約変更手数料として3000円かかります。絶食指示を必ず守ってご来院ください。',
    ],
  },
};
