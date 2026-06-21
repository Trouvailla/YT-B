import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
      },
      {
        path: 'bkpi',
        name: 'BKpi',
        component: () => import('@/views/BKpi.vue'),
      },
      {
        path: 'daibu',
        name: 'Daibu',
        component: () => import('@/views/Daibu.vue'),
      },
      {
        path: 'chaoqiang',
        name: 'Chaoqiang',
        component: () => import('@/views/Chaoqiang.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
