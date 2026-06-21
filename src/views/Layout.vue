<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible theme="light" width="220">
      <div class="logo">
        <span v-if="!collapsed" class="logo-text">📊 YT-B 看板</span>
        <span v-else class="logo-text">📊</span>
      </div>
      <a-menu v-model:selectedKeys="selectedKeys" mode="inline" @click="handleMenu">
        <a-menu-item key="/">
          <pie-chart-outlined />
          <span>总览看板</span>
        </a-menu-item>
        <a-menu-item key="/bkpi">
          <bar-chart-outlined />
          <span>B端KPI看板</span>
        </a-menu-item>
        <a-menu-item key="/daibu">
          <dollar-outlined />
          <span>代补看板</span>
        </a-menu-item>
        <a-menu-item key="/chaoqiang">
          <fire-outlined />
          <span>超抢手板块</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="header-bar">
        <div class="header-left">
          <menu-unfold-outlined v-if="collapsed" @click="collapsed = !collapsed" />
          <menu-fold-outlined v-else @click="collapsed = !collapsed" />
          <span class="header-title">{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <!-- 数据刷新状态 -->
          <a v-if="dataStore.lastRefresh" style="color: #999; font-size: 12px">
            更新于 {{ formatTime(dataStore.lastRefresh) }}
          </a>
          <a-button size="small" @click="dataStore.refresh()" :loading="dataStore.loading">
            <reload-outlined /> 刷新
          </a-button>
          <!-- 数据源切换 -->
          <a-select
            v-if="dataStore.config.sources.length > 1"
            v-model:value="dataStore.activeSourceId"
            size="small"
            style="width: 140px"
          >
            <a-select-option
              v-for="s in dataStore.config.sources"
              :key="s.id"
              :value="s.id"
            >
              {{ s.name }}
            </a-select-option>
          </a-select>
          <!-- Token 状态 -->
          <a-tooltip v-if="dataStore.config.useToken && !dataStore.hasToken" title="未配置 Token，私有仓库无法读取">
            <lock-outlined style="color: #faad14; cursor: pointer" @click="$router.push('/config')" />
          </a-tooltip>
        </div>
      </a-layout-header>

      <a-layout-content class="content-area">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDataStore } from '@/stores/data'
import {
  PieChartOutlined,
  BarChartOutlined,
  DollarOutlined,
  FireOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'

const dataStore = useDataStore()
const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const selectedKeys = ref(['/'])

const pageTitles = {
  '/': '总览看板',
  '/bkpi': 'B端KPI看板',
  '/daibu': '代补看板',
  '/chaoqiang': '超抢手板块',
}
const pageTitle = computed(() => pageTitles[route.path] || '数据看板')

watch(() => route.path, (path) => {
  selectedKeys.value = [path]
})

function handleMenu({ key }) {
  router.push(key)
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
}
.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1677ff;
}
.header-bar {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  height: 64px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-title {
  font-size: 16px;
  font-weight: 500;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.content-area {
  margin: 24px;
  min-height: calc(100vh - 64px - 48px);
}
</style>
