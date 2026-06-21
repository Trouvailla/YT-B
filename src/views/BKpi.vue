<template>
  <div class="bkpi-page">
    <a-empty v-if="!dataStore.hasData" description="暂无数据，请先在数据配置中设置数据源">
      <template #extra>
        <a-button type="primary" @click="$router.push('/config')">去配置</a-button>
      </template>
    </a-empty>

    <template v-else>
      <!-- KPI 指标卡 -->
      <a-row :gutter="[16, 16]">
        <a-col :xs="12" :sm="12" :md="6" v-for="card in kpiCards" :key="card.label">
          <a-card class="kpi-card" :body-style="{ padding: '20px' }">
            <div class="kpi-label">{{ card.label }}</div>
            <div class="kpi-value" :style="{ color: card.color }">{{ formatNum(card.total) }}</div>
            <div class="kpi-extra">均值 {{ formatNum(card.mean) }}</div>
          </a-card>
        </a-col>
      </a-row>

      <!-- B端图表区域 -->
      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col :span="12">
          <a-card title="指标分布">
            <div style="height: 350px">
              <v-chart :option="barOption" autoresize />
            </div>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="占比分析">
            <div style="height: 350px">
              <v-chart :option="pieOption" autoresize />
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 数据表格 -->
      <a-card style="margin-top: 16px" title="详细数据">
        <a-table
          :dataSource="tableData"
          :columns="tableColumns"
          :pagination="{ pageSize: 10 }"
          size="small"
          bordered
          :scroll="{ x: 'max-content' }"
        />
      </a-card>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useDataStore } from '@/stores/data'

use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const dataStore = useDataStore()

const kpiCards = computed(() => {
  const cols = dataStore.numericColumns
  if (!cols.length) return []
  return cols.slice(0, 6).map(col => {
    const vals = dataStore.activeData.data.map(r => parseFloat(r[col])).filter(v => !isNaN(v))
    return {
      label: col,
      total: vals.reduce((a, b) => a + b, 0),
      mean: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
      color: '#1677ff',
    }
  })
})

const firstNumeric = computed(() => dataStore.numericColumns[0] || '')
const firstString = computed(() => dataStore.stringColumns[0] || '')

const barOption = computed(() => {
  const data = dataStore.activeData.data
  const label = firstString.value
  const metric = firstNumeric.value
  if (!data.length || !label || !metric) return {}
  const groups = {}
  data.forEach(r => {
    const key = r[label] || '未知'
    groups[key] = (groups[key] || 0) + (parseFloat(r[metric]) || 0)
  })
  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 15)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 20, bottom: 80, top: 20 },
    xAxis: { type: 'category', data: sorted.map(s => s[0]), axisLabel: { rotate: 45, fontSize: 10 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: sorted.map(s => s[1]), itemStyle: { color: '#1677ff' } }],
  }
})

const pieOption = computed(() => {
  const data = dataStore.activeData.data
  const label = firstString.value
  const metric = firstNumeric.value
  if (!data.length || !label || !metric) return {}
  const groups = {}
  data.forEach(r => {
    const key = r[label] || '未知'
    groups[key] = (groups[key] || 0) + (parseFloat(r[metric]) || 0)
  })
  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie', radius: ['0%', '60%'],
      data: sorted.map(s => ({ name: s[0], value: s[1] })),
      label: { show: true, formatter: '{b}: {d}%', fontSize: 10 },
    }],
  }
})

const tableColumns = computed(() =>
  dataStore.allColumns.slice(0, 10).map(col => ({ title: col, dataIndex: col, key: col, ellipsis: true }))
)
const tableData = computed(() => dataStore.activeData.data.slice(0, 50))

function formatNum(val) {
  if (val == null) return '-'
  return Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })
}
</script>

<style scoped>
.kpi-card { border-radius: 8px; transition: box-shadow 0.3s; }
.kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.kpi-label { color: #666; font-size: 14px; margin-bottom: 8px; }
.kpi-value { font-size: 28px; font-weight: 600; line-height: 1.2; }
.kpi-extra { color: #999; font-size: 12px; margin-top: 8px; }
</style>
