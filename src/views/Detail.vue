<template>
  <div class="detail-page">
    <a-empty v-if="!dataStore.hasData" description="暂无数据，请先配置数据源">
      <template #extra>
        <a-button type="primary" @click="$router.push('/config')">去配置</a-button>
      </template>
    </a-empty>

    <a-card v-else>
      <template #title>数据明细</template>
      <template #extra>
        <a-space>
          <span style="color: #999;">共 {{ total }} 条</span>
          <a-button @click="exportCSV">导出 CSV</a-button>
        </a-space>
      </template>

      <div v-if="!dataStore.activeData.data.length" style="padding: 40px 0; text-align: center; color: #999;">
        当前数据源为空
      </div>

      <a-table
        v-else
        :dataSource="displayData"
        :columns="dynamicColumns"
        :loading="dataStore.loading"
        :pagination="pagination"
        size="small"
        bordered
        :scroll="{ x: 'max-content' }"
        @change="handleTableChange"
      />
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/data'

const dataStore = useDataStore()
const page = ref(1)
const pageSize = ref(50)
const sortField = ref('')
const sortOrder = ref('')

const allData = computed(() => dataStore.activeData.data)
const total = computed(() => allData.value.length)

const displayData = computed(() => {
  let data = [...allData.value]

  // Sort
  if (sortField.value) {
    data.sort((a, b) => {
      const va = a[sortField.value]
      const vb = b[sortField.value]
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortOrder.value === 'ascend' ? va - vb : vb - va
      }
      return sortOrder.value === 'ascend'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
  }

  // Paginate
  const start = (page.value - 1) * pageSize.value
  return data.slice(start, start + pageSize.value)
})

const dynamicColumns = computed(() =>
  dataStore.activeData.columns.map(col => ({
    title: col,
    dataIndex: col,
    key: col,
    sorter: true,
    ellipsis: true,
  }))
)

const pagination = computed(() => ({
  current: page.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showTotal: (t) => `共 ${t} 条`,
}))

function handleTableChange(pag, _filters, sorter) {
  page.value = pag.current
  pageSize.value = pag.pageSize
  if (sorter?.field) {
    sortField.value = sorter.field
    sortOrder.value = sorter.order || ''
  }
}

function exportCSV() {
  const columns = dataStore.activeData.columns
  const data = allData.value

  const csvContent = [
    columns.join(','),
    ...data.map(row =>
      columns.map(col => `"${(row[col] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `数据明细_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
</script>
