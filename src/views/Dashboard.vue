<template>
  <div class="dashboard-page">
    <!-- 加载状态 -->
    <a-skeleton v-if="dataStore.loading" active :paragraph="{ rows: 10 }" />

    <!-- 空数据 -->
    <a-empty v-else-if="!dataStore.hasData" description="暂无数据，请先在 data 目录放入数据文件并刷新">
      <template #extra>
        <a-button type="primary" @click="goToGuide">查看使用说明</a-button>
      </template>
    </a-empty>

    <template v-else>
      <!-- 筛选栏 -->
      <a-card style="margin-bottom: 16px" :body-style="{ paddingBottom: 0 }">
        <a-row :gutter="16" align="middle">
          <a-col>
            <span style="font-weight:500; margin-right:8px">📍 城市：</span>
            <a-select
              v-model:value="selectedCity"
              style="width: 200px"
              allow-clear
              placeholder="全部城市"
              @change="onCityChange"
            >
              <a-select-option value="">全部城市</a-select-option>
              <a-select-option v-for="c in cityList" :key="c" :value="c">{{ c }}</a-select-option>
            </a-select>
          </a-col>
          <a-col>
            <a-tag v-if="selectedCity" closable @close="selectedCity = ''" color="blue">
              当前筛选：{{ selectedCity }}
            </a-tag>
            <a-tag v-else color="default">查看全部</a-tag>
          </a-col>
        </a-row>
      </a-card>

      <!-- ===== 第一部分：商户概况 ===== -->
      <a-card title="🏪 商户概况" style="margin-bottom: 16px">
        <a-row :gutter="[16, 16]">
          <a-col :xs="12" :sm="8" :md="6">
            <a-statistic title="整商商户数" :value="metrics.totalMerchants" />
          </a-col>
          <a-col :xs="12" :sm="8" :md="6">
            <a-statistic title="FML+CKA商户数" :value="metrics.fmlCkaMerchants" />
          </a-col>
          <a-col :xs="12" :sm="8" :md="6">
            <a-statistic title="营业率" :value="metrics.operatingRate" suffix="%" :precision="1" />
          </a-col>
          <a-col :xs="12" :sm="8" :md="6">
            <a-statistic title="营业商户数" :value="metrics.operatingMerchants" />
          </a-col>
        </a-row>
      </a-card>

      <!-- ===== 第二部分：订单分析 ===== -->
      <a-card title="📦 订单分析" style="margin-bottom: 16px">
        <a-row :gutter="[16, 24]">
          <a-col :xs="12" :sm="8" :md="4">
            <a-statistic title="总订单" :value="metrics.totalOrders" />
          </a-col>
          <a-col :xs="12" :sm="8" :md="4">
            <a-statistic title="拼团订单" :value="metrics.groupOrders" />
          </a-col>
          <a-col :xs="12" :sm="8" :md="4">
            <a-statistic title="非拼团订单" :value="metrics.nonGroupOrders" />
          </a-col>
          <a-col :xs="12" :sm="8" :md="4">
            <a-statistic title="超抢手订单" :value="metrics.chaoqiangOrders" />
          </a-col>
          <a-col :xs="12" :sm="8" :md="4">
            <a-statistic title="免配订单" :value="metrics.freeDeliveryOrders" />
          </a-col>
          <a-col :xs="12" :sm="8" :md="4">
            <a-statistic title="减配覆盖商户数" :value="metrics.reducedCoverage" />
          </a-col>
          <a-col :xs="12" :sm="8" :md="4">
            <a-statistic title="爆单覆盖率" :value="metrics.boomCoverage" suffix="%" :precision="1" />
          </a-col>
        </a-row>
      </a-card>

      <!-- ===== 第三部分：超抢手数据 ===== -->
      <a-card title="🔥 超抢手分析" style="margin-bottom: 16px">
        <a-row :gutter="[16, 24]">
          <a-col :xs="12" :sm="8" :md="6">
            <a-statistic title="超抢手有效商户" :value="metrics.activeChaoqiang" />
          </a-col>
          <a-col :xs="12" :sm="8" :md="6">
            <a-statistic title="超抢手百单有效商户" :value="metrics.activeChaoqiang100" />
          </a-col>
        </a-row>
      </a-card>

      <!-- ===== 图表区域 ===== -->
      <a-row :gutter="[16, 16]" style="margin-bottom: 16px">
        <a-col :span="12">
          <a-card title="各城市订单分布">
            <div style="height: 360px">
              <v-chart :option="cityOrderOption" autoresize />
            </div>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="订单构成">
            <div style="height: 360px">
              <v-chart :option="orderPieOption" autoresize />
            </div>
          </a-card>
        </a-col>
      </a-row>

      <!-- ===== 城市对比表格 ===== -->
      <a-card title="各城市指标对比">
        <a-table
          :dataSource="cityTableData"
          :columns="cityTableColumns"
          :pagination="{ pageSize: 20 }"
          size="small"
          bordered
          :scroll="{ x: 'max-content' }"
        />
      </a-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import { useDataStore } from '@/stores/data'
import { useRouter } from 'vue-router'

use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const dataStore = useDataStore()
const router = useRouter()
const selectedCity = ref('')

// ---- 智能列名匹配 ----
const COLUMN_ALIASES = {
  // 城市列
  city: ['城市', '地区', '区域', 'city', 'City', '所在城市'],
  // 商户数
  totalMerchants: ['整商商户数', '商户总数', '总商户数', '商户数', 'merchant_count'],
  fmlCka: ['FML+CKA商户数', 'FML_CKA', 'fml_cka', 'FMLCKA'],
  operating: ['营业商户', '营业商户数', 'operating'],
  // 订单
  totalOrders: ['总订单', '订单总数', '订单量', 'total_orders'],
  groupOrders: ['拼团订单', '拼团', 'group_orders'],
  nonGroupOrders: ['非拼团订单', '非拼团', 'non_group_orders'],
  chaoqiangOrders: ['超抢手订单', '超抢手', 'chaoqiang_orders'],
  freeDelivery: ['免配订单', '免配', 'free_delivery'],
  reducedCoverage: ['减配覆盖商户数', '减配覆盖', '减配商户'],
  boomCoverage: ['爆单覆盖率', '爆单率', '爆单覆盖', 'boom_coverage'],
  activeChaoqiang: ['超抢手有效商户', '有效超抢手', 'active_chaoqiang'],
  chaoqiang100: ['超抢手百单有效商户', '百单有效', 'chaoqiang_100'],
}

// 在数据中查找匹配的列名
function findCol(aliases) {
  const cols = dataStore.activeData.columns
  for (const alias of aliases) {
    if (cols.includes(alias)) return alias
  }
  return null
}

// 获取某列数值之和（支持按城市筛选）
function sumCol(colKey, cityFilter = null) {
  const col = findCol(COLUMN_ALIASES[colKey])
  if (!col) return 0
  const data = dataStore.activeData.data
  const rows = cityFilter ? data.filter(r => String(r[cityCol.value] || '') === cityFilter) : data
  return rows.reduce((s, r) => s + (parseFloat(r[col]) || 0), 0)
}

// 行数（支持按城市筛选）
function countRows(cityFilter = null) {
  const data = dataStore.activeData.data
  if (!data.length) return 0
  if (!cityFilter) return data.length
  return data.filter(r => String(r[cityCol.value] || '') === cityFilter).length
}

// 城市列
const cityCol = computed(() => findCol(COLUMN_ALIASES.city))

// 城市列表
const cityList = computed(() => {
  const col = cityCol.value
  if (!col) return []
  const cities = [...new Set(dataStore.activeData.data.map(r => r[col]))].filter(Boolean)
  return cities.sort()
})

// 当前筛选数据
const filteredData = computed(() => {
  const data = dataStore.activeData.data
  if (!selectedCity.value || !cityCol.value) return data
  return data.filter(r => String(r[cityCol.value] || '') === selectedCity.value)
})

const cityFilter = computed(() => selectedCity.value || null)

// ---- 核心指标计算 ----
const metrics = computed(() => {
  const city = cityFilter.value

  // 商户数
  const totalMerchants = sumCol('totalMerchants', city) || countRows(city)
  const fmlCkaMerchants = sumCol('fmlCka', city)

  // 营业率
  const operatingCol = findCol(COLUMN_ALIASES.operating)
  let operatingMerchants = 0
  if (operatingCol) {
    operatingMerchants = sumCol('operating', city)
  }
  const operatingRate = fmlCkaMerchants > 0
    ? Math.round((operatingMerchants / fmlCkaMerchants) * 1000) / 10
    : 0

  // 订单
  const totalOrders = sumCol('totalOrders', city)
  const groupOrders = sumCol('groupOrders', city)
  const nonGroupOrders = sumCol('nonGroupOrders', city)
  const chaoqiangOrders = sumCol('chaoqiangOrders', city)
  const freeDeliveryOrders = sumCol('freeDelivery', city)
  const reducedCoverage = sumCol('reducedCoverage', city)
  const boomCoverage = sumCol('boomCoverage', city)
  const activeChaoqiang = sumCol('activeChaoqiang', city)
  const chaoqiang100 = sumCol('chaoqiang100', city)

  return {
    totalMerchants: Math.round(totalMerchants),
    fmlCkaMerchants: Math.round(fmlCkaMerchants),
    operatingRate,
    operatingMerchants: Math.round(operatingMerchants),
    totalOrders: Math.round(totalOrders),
    groupOrders: Math.round(groupOrders),
    nonGroupOrders: Math.round(nonGroupOrders),
    chaoqiangOrders: Math.round(chaoqiangOrders),
    freeDeliveryOrders: Math.round(freeDeliveryOrders),
    reducedCoverage: Math.round(reducedCoverage),
    boomCoverage: Math.round(boomCoverage * 100) / 100,
    activeChaoqiang: Math.round(activeChaoqiang),
    activeChaoqiang100: Math.round(chaoqiang100),
  }
})

// ---- 图表：各城市订单分布 ----
const cityOrderOption = computed(() => {
  const cityColName = cityCol.value
  const orderColName = findCol(COLUMN_ALIASES.totalOrders)
  if (!cityColName || !orderColName) return {}

  const groups = {}
  dataStore.activeData.data.forEach(r => {
    const city = r[cityColName] || '未知'
    groups[city] = (groups[city] || 0) + (parseFloat(r[orderColName]) || 0)
  })

  const sorted = Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 80, right: 20, bottom: 60, top: 20 },
    xAxis: { type: 'category', data: sorted.map(s => s[0]), axisLabel: { rotate: 45, fontSize: 11 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: sorted.map(s => s[1]), itemStyle: { color: '#1677ff' } }],
  }
})

// ---- 图表：订单构成 ----
const orderPieOption = computed(() => {
  const groupCol = findCol(COLUMN_ALIASES.groupOrders)
  const nonGroupCol = findCol(COLUMN_ALIASES.nonGroupOrders)
  const chaoqiangCol = findCol(COLUMN_ALIASES.chaoqiangOrders)
  const freeCol = findCol(COLUMN_ALIASES.freeDelivery)

  const pieData = []
  if (groupCol) pieData.push({ name: '拼团订单', value: sumCol('groupOrders', cityFilter.value) })
  if (nonGroupCol) pieData.push({ name: '非拼团订单', value: sumCol('nonGroupOrders', cityFilter.value) })
  if (chaoqiangCol) pieData.push({ name: '超抢手订单', value: sumCol('chaoqiangOrders', cityFilter.value) })
  if (freeCol) pieData.push({ name: '免配订单', value: sumCol('freeDelivery', cityFilter.value) })

  if (!pieData.length) return {}

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['0%', '65%'],
      data: pieData,
      label: { show: true, formatter: '{b}: {d}%' },
    }],
  }
})

// ---- 城市对比表格 ----
const cityTableColumns = computed(() => {
  const cols = [{ title: '城市', dataIndex: '_city', key: '_city', fixed: 'left' }]
  dataStore.numericColumns.slice(0, 15).forEach(c => {
    cols.push({ title: c, dataIndex: c, key: c, align: 'right' })
  })
  return cols
})

const cityTableData = computed(() => {
  const cityColName = cityCol.value
  if (!cityColName || !dataStore.activeData.data.length) return []

  const grouped = {}
  dataStore.activeData.data.forEach(r => {
    const city = r[cityColName] || '未知'
    if (!grouped[city]) grouped[city] = {}
    dataStore.numericColumns.forEach(col => {
      grouped[city][col] = (grouped[city][col] || 0) + (parseFloat(r[col]) || 0)
    })
  })

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([city, vals]) => ({
      _city: city,
      ...vals,
      _totalOrders: vals[findCol(COLUMN_ALIASES.totalOrders)] || 0,
    }))
    .sort((a, b) => (b._totalOrders || 0) - (a._totalOrders || 0))
    .map(({ _totalOrders, ...rest }) => rest)
})

function onCityChange() {
  // reactivity handles the rest
}

function goToGuide() {
  window.open('https://github.com/Trouvailla/YT-B', '_blank')
}
</script>

<style scoped>
.dashboard-page {
  max-width: 100%;
}
</style>
