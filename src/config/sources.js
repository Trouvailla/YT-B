/**
 * 数据源配置文件
 * 已配置为 Trouvailla / B端数据
 */
export default {
  repo: {
    owner: 'Trouvailla',
    name: 'YT-B',
    branch: 'main',
  },

  sources: [
    {
      id: 'merchant-detail',
      name: '有效商户明细',
      path: 'data/有效商户明细_FY26-有效商户明细.xlsx',
      type: 'excel',
      description: '有效商户明细数据',
    },
  ],

  useToken: false,
  tokenMode: 'none',
}
