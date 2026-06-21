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
      id: 'daily-report',
      name: '日报数据',
      path: 'data/daily-report.xlsx',
      type: 'excel',
      description: '每日业务数据',
    },
  ],

  useToken: false,
  tokenMode: 'none',
}
