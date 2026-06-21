import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchAllSources, verifyToken } from '@/api/github'
import sourcesConfig from '@/config/sources'

export const useDataStore = defineStore('data', () => {
  const config = ref({ ...sourcesConfig })
  const datasets = ref({})
  const loading = ref(false)
  const error = ref(null)
  const lastRefresh = ref(null)

  // 当前激活的数据集
  const activeSourceId = ref(
    config.value.sources.length > 0 ? config.value.sources[0].id : null
  )

  // 当前展示的数据
  const activeData = computed(() => {
    if (!activeSourceId.value || !datasets.value[activeSourceId.value]) {
      return { data: [], columns: [], rowCount: 0 }
    }
    return datasets.value[activeSourceId.value]
  })

  // 是否有可用数据
  const hasData = computed(() => activeData.value.data.length > 0)

  // 数值型列
  const numericColumns = computed(() => {
    if (!activeData.value.data.length) return []
    const sample = activeData.value.data[0]
    return Object.keys(sample).filter(key => {
      const val = sample[key]
      return typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)) && val !== '')
    })
  })

  // 字符串型列（维度）
  const stringColumns = computed(() => {
    if (!activeData.value.data.length) return []
    const sample = activeData.value.data[0]
    return Object.keys(sample).filter(key => {
      const val = sample[key]
      return typeof val === 'string' && isNaN(parseFloat(val))
    })
  })

  // 所有列
  const allColumns = computed(() => activeData.value.columns)

  // 刷新所有数据
  async function refresh() {
    loading.value = true
    error.value = null
    try {
      const results = await fetchAllSources(config.value)
      datasets.value = results
      lastRefresh.value = new Date().toISOString()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // 更新配置
  function updateConfig(newConfig) {
    config.value = { ...config.value, ...newConfig }
  }

  // 设置 GitHub Token
  function setToken(token) {
    localStorage.setItem('github_token', token)
  }

  function clearToken() {
    localStorage.removeItem('github_token')
  }

  const hasToken = computed(() => !!localStorage.getItem('github_token'))

  return {
    config,
    datasets,
    loading,
    error,
    lastRefresh,
    activeSourceId,
    activeData,
    hasData,
    numericColumns,
    stringColumns,
    allColumns,
    refresh,
    updateConfig,
    setToken,
    clearToken,
    hasToken,
  }
})
