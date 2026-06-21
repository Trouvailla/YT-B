<template>
  <div class="analysis-page">
    <!-- 无数据提示 -->
    <a-empty v-if="!dataStore.hasData" description="暂无数据，请先配置数据源">
      <template #extra>
        <a-button type="primary" @click="$router.push('/config')">去配置</a-button>
      </template>
    </a-empty>

    <template v-else>
      <!-- 筛选配置 -->
      <a-card>
        <template #title>数据透视分析</template>
        <a-form layout="inline" :model="filters">
          <a-form-item label="分组字段">
            <a-select v-model:value="filters.group_by" style="width: 160px" allow-clear placeholder="选择维度">
              <a-select-option v-for="col in dataStore.stringColumns" :key="col" :value="col">{{ col }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="指标">
            <a-select v-model:value="filters.metric" style="width: 160px" allow-clear placeholder="选择指标">
              <a-select-option v-for="col in dataStore.numericColumns" :key="col" :value="col">{{ col }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="聚合方式">
            <a-select v-model:value="filters.agg_func" style="width: 100px">
              <a-select-option value="sum">合计</a-select-option>
              <a-select-option value="mean">均值</a-select-option>
              <a-select-option value="count">计数</a-select-option>
              <a-select-option value="max">最大</a-select-option>
              <a-select-option value="min">最小</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="doAnalysis">分析</a-button>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 图表 -->
      <a-card style="margin-top: 16px">
        <a-radio-group v-model:value="chartType" button-style="solid" style="margin-bottom: 16px">
          <a-radio-button value="bar">📊 柱状图</a-radio-button>
          <a-radio-button value="line">📈 折线图</a-radio-button>
          <a-radio-button value="pie">🥧 饼图</a-radio-button>
        </a-radio-group>

        <div v-if="aggregatedData.length" style="height: 420px">
          <v-chart :option="chartOption" autoresize />
        </div>
        <a-empty v-else description="请选择维度和指标后点击分析" />
      </a-card>

      <!-- 明细表格 -->
      <a-card style="margin-top: 16px" title="聚合结果">
        <a-table
          :dataSource="aggregatedData"
          :columns="aggColumns"
          :pagination="{ pageSize: 10 }"
          size="small"
          bordered
          rowKey="__row"
        />
      </a-card>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { use } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useDataStore } from '@/stores/data'

use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const dataStore = useDataStore()
const chartType = ref('bar')
const aggregatedData = ref([])

const filters = reactive({
  group_by: '',
  metric: '',
  agg_func: 'sum',
})

function doAnalysis() {
  if (!filters.group_by || !filters.metric) return

  const { group_by, metric, agg_func } = filters
  const raw = dataStore.activeData.data

  // 分组聚合
  const groups = {}
  for (const row of raw) {
    const key = String(row[group_by] ?? '未知')
    const val = parseFloat(row[metric]) || 0
    if (!groups[key]) groups[key] = { values: [], count: 0 }
    groups[key].values.push(val)
    groups[key].count++
  }

  const result = Object.entries(groups).map(([key, g]) => {
    const vals = g.values
    let value
    switch (agg_func) {
      case 'sum':   value = vals.reduce((a, b) => a + b, 0); break
      case 'mean':  value = vals.reduce((a, b) => a + b, 0) / vals.length; break
      case 'count': value = vals.length; break
      case 'max':   value = Math.max(...vals); break
      case 'min':   value = Math.min(...vals); break
      default:      value = vals.reduce((a, b) => a + b, 0)
    }
    return { [group_by]: key, [metric]: Math.round(value * 100) / 100, __row: key }
  })

  result.sort((a, b) => b[metric] - a[metric])
  aggregatedData.value = result
}

const aggColumns = computed(() => {
  if (!aggregatedData.value.length) return []
  const keys = Object.keys(aggregatedData.value[0]).filter(k => k !== '__row')
  return keys.map(k => ({ title: k, dataIndex: k, key: k }))
})

const chartOption = computed(() => {
  const data = aggregatedData.value
  if (!data.length) return {}

  const labelKey = filters.group_by
  const valueKey = filters.metric
  const labels = data.map(r => r[labelKey])
  const values = data.map(r => r[valueKey])

  if (chartType.value === 'pie') {
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['0%', '60%'],
        data: data.map(r => ({ name: r[labelKey], value: r[valueKey] })),
        label: { show: true, formatter: '{b}: {d}%' },
      }],
    }
  }

  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 20, bottom: 80, top: 20 },
    xAxis: { type: 'category', data: labels, axisLabel: { rotate: 45, fontSize: 11 } },
    yAxis: { type: 'value' },
    series: [{ type: chartType.value, data: values, itemStyle: { color: '#1677ff' } }],
  }
})
</script>
