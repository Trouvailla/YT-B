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
      name: '新签商户明细',
      path: 'data/新签商户考核-新签商户明细_20260621103338675.xlsx',
      type: 'excel',
      description: '新签商户考核明细数据',
    },
  ],

  useToken: false,
  tokenMode: 'none',
}
