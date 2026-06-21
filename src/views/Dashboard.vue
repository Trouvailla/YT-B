<template>
  <div class="dashboard-page">
    <!-- 加载状态 -->
    <a-skeleton v-if="dataStore.loading" active :paragraph="{ rows: 8 }" />

    <!-- 错误状态 -->
    <a-result v-else-if="dataStore.error" status="error" title="数据加载失败">
      <template #extra>
        <p>{{ dataStore.error }}</p>
        <a-button type="primary" @click="dataStore.refresh()">重试</a-button>
        <a-button @click="$router.push('/config')">去配置</a-button>
      </template>
    </a-result>

    <!-- 空数据状态 -->
    <a-empty v-else-if="!dataStore.hasData" description="暂无数据">
      <template #extra>
        <p>请先在数据配置中设置 GitHub 仓库和数据文件路径</p>
        <a-button type="primary" @click="$router.push('/config')">去配置</a-button>
      </template>
    </a-empty>

    <template v-else>
      <!-- KPI 卡片行 -->
      <a-row :gutter="[16, 16]">
        <a-col :xs="12" :sm="12" :md="6" v-for="card in kpiCards" :key="card.label">
          <a-card class="kpi-card" :body-style="{ padding: '20px' }">
            <div class="kpi-label">{{ card.label }}</div>
            <div class="kpi-value" :style="{ color: card.color || '#1677ff' }">
              {{ formatNum(card.total) }}
            </div>
            <div class="kpi-extra">
              均值 {{ formatNum(card.mean) }} | 最大 {{ formatNum(card.max) }}
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 数据概览 -->
      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col :span="24">
          <a-card :title="`数据概览 — ${activeSource?.name || ''}`">
            <div style="padding: 20px 0">
              <a-statistic :title="`${activeSource?.name || '数据'} 总行数`" :value="dataStore.activeData.rowCount" suffix="条" />
            </div>
            <a-divider />
            <div class="column-tags">
              <span class="tag-label">数值指标：</span>
              <a-tag v-for="col in dataStore.numericColumns" :key="col" color="blue">{{ col }}</a-tag>
            </div>
            <div class="column-tags" style="margin-top: 8px">
              <span class="tag-label">维度字段：</span>
              <a-tag v-for="col in dataStore.stringColumns" :key="col" color="green">{{ col }}</a-tag>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 数据预览表格 -->
      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="数据预览（前 20 条）">
            <a-table
              :dataSource="previewData"
              :columns="previewColumns"
              size="small"
              bordered
              :pagination="false"
              :scroll="{ x: 'max-content' }"
            />
          </a-card>
        </a-col>
      </a-row>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/data'

const dataStore = useDataStore()

const activeSource = computed(() =>
  dataStore.config.sources.find(s => s.id === dataStore.activeSourceId)
)

// KPI 卡片：从前几列数值型数据生成
const kpiCards = computed(() => {
  const data = dataStore.activeData.data
  const cols = dataStore.numericColumns
  if (!data.length || !cols.length) return []

  return cols.slice(0, 6).map(col => {
    const values = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v))
    const total = values.reduce((a, b) => a + b, 0)
    const mean = values.length ? total / values.length : 0
    const max = values.length ? Math.max(...values) : 0
    const min = values.length ? Math.min(...values) : 0
    return { label: col, total, mean, max, min, color: total > 0 ? '#1677ff' : '#999' }
  })
})

// 预览表格
const previewData = computed(() => dataStore.activeData.data.slice(0, 20))
const previewColumns = computed(() =>
  dataStore.activeData.columns.map(col => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
  }))
)

function formatNum(val) {
  if (val == null) return '-'
  if (Math.abs(val) >= 10000) {
    return (val / 10000).toFixed(1) + '万'
  }
  return Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })
}
</script>

<style scoped>
.dashboard-page {
  max-width: 1400px;
}
.kpi-card {
  border-radius: 8px;
  transition: box-shadow 0.3s;
}
.kpi-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.kpi-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}
.kpi-value {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
}
.kpi-extra {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}
.column-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.tag-label {
  color: #666;
  font-size: 13px;
  white-space: nowrap;
}
</style>
