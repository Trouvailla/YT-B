<template>
  <div class="config-page">
    <!-- 数据加载状态 -->
    <a-alert
      v-if="dataStore.loading"
      type="info"
      message="正在从 GitHub 加载数据..."
      show-icon
      style="margin-bottom: 16px"
    />

    <a-alert
      v-if="dataStore.error"
      type="error"
      :message="`数据加载失败: ${dataStore.error}`"
      closable
      show-icon
      style="margin-bottom: 16px"
    />

    <!-- 第一步：GitHub 仓库配置 -->
    <a-card title="① GitHub 仓库配置" style="margin-bottom: 16px">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="仓库所有者" required>
              <a-input v-model:value="localConfig.repo.owner" placeholder="your-org" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="仓库名" required>
              <a-input v-model:value="localConfig.repo.name" placeholder="dashboard" />
            </a-form-item>
          </a-col>
          <a-col :span="4">
            <a-form-item label="分支">
              <a-input v-model:value="localConfig.repo.branch" placeholder="main" />
            </a-form-item>
          </a-col>
          <a-col :span="8" style="display: flex; align-items: flex-end">
            <a-form-item>
              <a-button type="primary" @click="saveAndRefresh" :loading="dataStore.loading">
                <reload-outlined /> 保存并加载数据
              </a-button>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <!-- Token 配置 -->
      <a-collapse ghost>
        <a-collapse-panel key="token">
          <template #header>
            <span>🔒 私有仓库设置 <span v-if="dataStore.hasToken" style="color: #52c41a">(已配置 Token)</span></span>
          </template>
          <a-input-search
            v-model:value="tokenInput"
            :type="showToken ? 'text' : 'password'"
            placeholder="GitHub Personal Access Token"
            enter-button="保存 Token"
            @search="saveToken"
          />
          <p style="color: #999; font-size: 12px; margin-top: 8px">
            Token 仅需 <code>repo</code> 权限（私有仓库）或 <code>public_repo</code> 权限（公开仓库）。
            Token 只存储在浏览器本地，不会上传到任何服务器。
          </p>
        </a-collapse-panel>
      </a-collapse>
    </a-card>

    <!-- 第二步：数据文件配置 -->
    <a-card title="② 数据文件配置" style="margin-bottom: 16px">
      <a-table
        :dataSource="localConfig.sources"
        :columns="sourceColumns"
        size="small"
        rowKey="id"
        :pagination="false"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.dataIndex === 'path'">
            <a-input v-model:value="record.path" size="small" placeholder="data/file.xlsx" />
          </template>
          <template v-else-if="column.dataIndex === 'type'">
            <a-select v-model:value="record.type" size="small" style="width: 90px">
              <a-select-option value="excel">Excel</a-select-option>
              <a-select-option value="csv">CSV</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.dataIndex === 'action'">
            <a-button type="link" danger size="small" @click="removeSource(index)">删除</a-button>
          </template>
        </template>
      </a-table>

      <a-button type="dashed" block style="margin-top: 12px" @click="addSource">
        <plus-outlined /> 添加数据文件
      </a-button>
    </a-card>

    <!-- 第三步：数据文件存放指引 -->
    <a-card title="③ 数据文件存放指引">
      <a-result status="info" title="如何将数据文件放入 GitHub 仓库？">
        <template #extra>
          <div style="text-align: left; max-width: 600px; margin: 0 auto">
            <h4>📁 方法一：直接在 GitHub 网页上传</h4>
            <ol>
              <li>打开仓库 <code>{{ repoFull }}</code></li>
              <li>进入 <code>data/</code> 目录（如果没有则新建）</li>
              <li>点击 "Add file" → "Upload files"</li>
              <li>上传你的 Excel/CSV 文件</li>
              <li>提交到 main 分支</li>
            </ol>

            <h4>💻 方法二：Git 命令行</h4>
            <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 13px">
git clone {{ repoFull }}.git
cd {{ localConfig.repo.name }}
cp /path/to/your/data.xlsx data/
git add data/
git commit -m "update daily report"
git push</pre>

            <h4>✅ 要求</h4>
            <ul>
              <li>文件路径和文件名需与上方"数据文件配置"中的路径一致</li>
              <li>支持 <code>.xlsx</code> / <code>.xls</code> / <code>.csv</code> 格式</li>
              <li>数据更新后，点击看板右上角的 "刷新" 按钮即可加载最新数据</li>
            </ul>
          </div>
        </template>
      </a-result>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import { verifyToken } from '@/api/github'

const dataStore = useDataStore()
const tokenInput = ref('')
const showToken = ref(false)

// 本地配置副本（可编辑）
const localConfig = reactive({
  repo: { ...dataStore.config.repo },
  sources: dataStore.config.sources.map(s => ({ ...s })),
})

const repoFull = computed(() =>
  `${localConfig.repo.owner}/${localConfig.repo.name}`
)

const sourceColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '文件路径', dataIndex: 'path', key: 'path' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '说明', dataIndex: 'description', key: 'description' },
  { title: '操作', dataIndex: 'action', key: 'action', width: 80 },
]

function addSource() {
  const idx = localConfig.sources.length + 1
  localConfig.sources.push({
    id: `source-${idx}`,
    name: `数据源 ${idx}`,
    path: 'data/data.xlsx',
    type: 'excel',
    description: '',
  })
}

function removeSource(index) {
  localConfig.sources.splice(index, 1)
}

function saveAndRefresh() {
  // 同步配置到 store
  dataStore.updateConfig({
    repo: { ...localConfig.repo },
    sources: localConfig.sources.map(s => ({ ...s })),
  })
  // 刷新数据
  dataStore.refresh()
}

async function saveToken() {
  if (!tokenInput.value.trim()) return
  const info = await verifyToken(tokenInput.value.trim())
  if (info) {
    dataStore.setToken(tokenInput.value.trim())
    dataStore.config.useToken = true
    alert(`Token 验证成功！用户: ${info.login}`)
    saveAndRefresh()
  } else {
    alert('Token 无效，请检查权限')
  }
}

onMounted(() => {
  // 如果还没有数据，自动加载
  if (!dataStore.lastRefresh && dataStore.config.sources.length > 0) {
    dataStore.refresh()
  }
})
</script>
