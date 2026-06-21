<template>
  <a-config-provider :locale="locale">
    <router-view />
  </a-config-provider>
</template>

<script setup>
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { onMounted } from 'vue'
import { useDataStore } from '@/stores/data'

dayjs.locale('zh-cn')
const locale = zhCN

// 应用启动时自动加载数据
const dataStore = useDataStore()
onMounted(() => {
  if (dataStore.config.sources.length > 0 && !dataStore.lastRefresh) {
    dataStore.refresh()
  }
})
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background: #f5f5f5;
}
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
