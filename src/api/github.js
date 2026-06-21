/**
 * GitHub 数据源读取模块
 *
 * 直接从 GitHub Raw API 获取 Excel/CSV 文件并在浏览器端解析。
 * 无需后端，纯前端实现。
 */
import * as XLSX from 'xlsx'

/**
 * 构建 GitHub raw 文件 URL
 */
function buildRawUrl(owner, repo, branch, path) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
}

/**
 * 获取 GitHub Token（用于私有仓库）
 */
function getToken() {
  return localStorage.getItem('github_token') || ''
}

/**
 * 获取 fetch 请求头
 */
function getHeaders() {
  const token = getToken()
  const headers = {}
  if (token) {
    headers['Authorization'] = `token ${token}`
  }
  return headers
}

/**
 * 从 GitHub 拉取并解析 Excel 文件
 * @param {string} owner - 仓库所有者
 * @param {string} repo - 仓库名
 * @param {string} branch - 分支
 * @param {string} path - 文件路径
 * @returns {Promise<{data: object[], columns: string[], rowCount: number, fileName: string}>}
 */
export async function fetchExcel(owner, repo, branch, path) {
  const url = buildRawUrl(owner, repo, branch, path)
  const headers = getHeaders()

  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`GitHub 读取失败 (${response.status}): ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : []
  const fileName = path.split('/').pop()

  return {
    data: jsonData,
    columns,
    rowCount: jsonData.length,
    fileName,
    sheetName,
  }
}

/**
 * 从 GitHub 拉取并解析 CSV 文件
 */
export async function fetchCSV(owner, repo, branch, path) {
  const url = buildRawUrl(owner, repo, branch, path)
  const headers = getHeaders()

  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new Error(`GitHub 读取失败 (${response.status}): ${response.statusText}`)
  }

  const text = await response.text()
  // 用 XLSX 解析 CSV（它也能处理 CSV）
  const workbook = XLSX.read(text, { type: 'string' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : []
  const fileName = path.split('/').pop()

  return {
    data: jsonData,
    columns,
    rowCount: jsonData.length,
    fileName,
    sheetName,
  }
}

/**
 * 通用数据获取函数（自动识别类型）
 */
export async function fetchDataSource(owner, repo, branch, path, type) {
  if (type === 'csv') {
    return fetchCSV(owner, repo, branch, path)
  }
  return fetchExcel(owner, repo, branch, path)
}

/**
 * 获取所有配置的数据源
 */
export async function fetchAllSources(config) {
  const { owner, name: repo, branch } = config.repo
  const results = {}

  for (const source of config.sources) {
    try {
      const result = await fetchDataSource(owner, repo, branch, source.path, source.type)
      results[source.id] = {
        ...result,
        config: source,
        loaded: true,
        error: null,
      }
    } catch (e) {
      results[source.id] = {
        data: [],
        columns: [],
        rowCount: 0,
        config: source,
        loaded: false,
        error: e.message,
      }
    }
  }

  return results
}

/**
 * 验证 GitHub Token 是否有效
 */
export async function verifyToken(token) {
  const response = await fetch('https://api.github.com/user', {
    headers: { Authorization: `token ${token}` },
  })
  if (!response.ok) return null
  const data = await response.json()
  return { login: data.login, type: data.type }
}
