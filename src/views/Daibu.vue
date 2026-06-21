<template>
  <div class="daibu-page">
    <a-empty v-if="!dataStore.hasData" description="暂无数据" />

    <template v-else>
      <!-- 顶部 KPI -->
      <a-row :gutter="[16, 16]">
        <a-col :span="6" v-for="card in topCards" :key="card.label">
          <a-card :body-style="{ padding: '20px' }">
            <div class="kpi-label">{{ card.label }}</div>
            <div class="kpi-value" style="color: #52c41a">{{ formatNum(card.value) }}</div>
          </a-card>
        </a-col>
      </a-row>

      <!-- 两个图表 -->
      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col :span="12">
          <a-card title="代补分布">
            <div style="height: 350px">
              <v-chart :option="barOpt" autoresize />
            </div>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="代补占比">
            <div style="height: 350px">
              <v-chart :option="pieOpt" autoresize />
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- Top N 表格 -->
      <a-card style="margin-top: 16px" title="代补明细 Top 50">
        <a-table
          :dataSource="tableData"
          :columns="tableColumns"
          :pagination="{ pageSize: 10 }"
          size="small"
          bordered
        />
      </a-card>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useDataStore } from '@/stores/data'

use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const dataStore = useDataStore()

const topCards = computed(() => {
  const cols = dataStore.numericColumns
  if (!cols.length) return []
  return cols.slice(0, 4).map(col => ({
    label: col,
    value: dataStore.activeData.data.reduce((s, r) => s + (parseFloat(r[col]) || 0), 0),
  }))
})

const firstStr = computed(() => dataStore.stringColumns[0] || '')
const firstNum = computed(() => dataStore.numericColumns[0] || '')

const barOpt = computed(() => {
  const d = dataStore.activeData.data
  const l = firstStr.value
  const m = firstNum.value
  if (!d.length || !l || !m) return {}
  const g = {}
  d.forEach(r => { const k = r[l] || '未知'; g[k] = (g[k] || 0) + (parseFloat(r[m]) || 0) })
  const s = Object.entries(g).sort((a, b) => b[1] - a[1]).slice(0, 15)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 20, bottom: 80, top: 20 },
    xAxis: { type: 'category', data: s.map(x => x[0]), axisLabel: { rotate: 45, fontSize: 10 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: s.map(x => x[1]), itemStyle: { color: '#52c41a' } }],
  }
})

const pieOpt = computed(() => {
  const d = dataStore.activeData.data
  const l = firstStr.value
  const m = firstNum.value
  if (!d.length || !l || !m) return {}
  const g = {}
  d.forEach(r => { const k = r[l] || '未知'; g[k] = (g[k] || 0) + (parseFloat(r[m]) || 0) })
  const s = Object.entries(g).sort((a, b) => b[1] - a[1]).slice(0, 10)
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{ type: 'pie', radius: ['0%', '60%'], data: s.map(x => ({ name: x[0], value: x[1] })), label: { show: true } }],
  }
})

const tableColumns = computed(() =>
  dataStore.allColumns.slice(0, 8).map(col => ({ title: col, dataIndex: col, key: col, ellipsis: true }))
)
const tableData = computed(() => dataStore.activeData.data.slice(0, 50))

function formatNum(val) {
  if (val == null) return '-'
  return Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })
}
</script>

<style scoped>
.kpi-label { color: #666; font-size: 14px; margin-bottom: 8px; }
.kpi-value { font-size: 28px; font-weight: 600; }
</style>
