export const kensaChuijikou = {
  id: 'kensa_chuijikou',
  label: '検査注意事項',
  category: 'reservation',
  requiresResuscitationChoice: false,

  examOptions: [
    'レントゲン検査（胸部・腹部・その他）',
    '超音波検査（心臓・腹部・その他）',
    '血液検査（一般検査・ホルモン検査）',
    'その他',
  ],

  hasFastingOption: true,

  slideVersion: 'v2026-09-13',

  slides: [
    {
      id: 'kensa_chuijikou_01',
      category: '絶食のお願い',
      emphasis: true,
      condition: 'requiresFasting',
      blocks: [
        {
          type: 'main',
          text: '朝は食事をとらないでご来院ください',
          notes: [
            '水は飲んでも大丈夫です。',
          ],
        },
      ],
    },
    {
      id: 'kensa_chuijikou_02',
      category: '費用が発生する場合について',
      emphasis: false,
      blocks: [
        {
          type: 'main',
          text: '1か月以内のノミ・マダニ予防をお願いします',
          notes: [
            '予防が無い場合は隔離お預かりの料金が発生します。',
            '当院で処方した予防薬以外でノミやマダニの寄生が見つかった場合は駆虫と施設消毒費<em>6,000円</em>＋予防薬の費用を頂きます。',
          ],
        },
      ],
    },
    {
      id: 'kensa_chuijikou_03',
      category: '当日のご準備',
      emphasis: false,
      blocks: [
        {
          type: 'main',
          text: '可能であれば排便を済ませてからご来院ください',
          notes: [
            'ただし尿検査を予定している場合、来院直前の排尿はお控えください。',
          ],
        },
      ],
    },
    {
      id: 'kensa_chuijikou_04',
      category: 'あらかじめご了承ください',
      emphasis: false,
      blocks: [
        {
          type: 'list',
          items: [
            '混雑や診察状況により、当日お預かりにお時間をいただくことがあります',
            '超音波検査では毛刈りが必要になることがあります',
            '遅い時間でのご来院や緊急対応中の場合、結果の説明を後日とさせていただくことがあります',
          ],
        },
      ],
    },
  ],

  fullText: {
    noticeBar: '混雑や診察状況により当日お預かりに時間がかかることがあります。お時間に余裕をもってお越しください。',
    items: [
      { text: '朝は食事をとらないでご来院ください。水は飲んでも大丈夫です。', condition: 'requiresFasting' },
      { text: '可能であれば排泄を済ませてからご来院ください。' },
      { text: '1か月以内のノミ・マダニ予防をお願いします。' },
      { text: '予防が無い場合は隔離お預かりの料金が発生します。' },
      { text: '当院で処方した予防薬以外でノミやマダニの寄生が見つかった場合は駆虫と施設消毒費6000円＋予防薬の費用を頂きます。' },
      { text: '尿検査を予定している場合、来院直前の排尿はお控えください。' },
      { text: '超音波検査では毛刈りが必要になることがあります。' },
      { text: 'お迎え時に結果をご説明しますが、遅い時間でのご来院の場合や緊急対応中の場合などでは、結果の説明を後日とさせていただくことがあります。' },
    ],
    footnotes: [],
  },
};
