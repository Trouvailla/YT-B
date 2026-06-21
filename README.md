# 📊 数据看板 — Trouvailla / YT-B

> 纯前端数据看板，数据文件存放在 GitHub 仓库中，通过 GitHub Raw API 直接读取。
> 无需后端服务器，零运维成本。每次 push 数据 → 看板自动更新 ✨

**在线地址：** https://trouvailla.github.io/YT-B/

---

## 🚀 一键启动指南

### 第一步：创建 GitHub 仓库

打开 https://github.com/new

- **Repository name:** `YT-B`
- **Description:** （选填）
- **Public / Private** 都可以（公开更方便，私有需要配置 Token）
- **不要勾选** "Initialize this repository with a README"
- 点击 **Create repository**

### 第二步：推送代码到 GitHub

在下面的终端中，逐行执行：

```bash
cd 项目所在目录/dashboard
git add .
git commit -m "🎉 init: 数据看板初始版本"
git remote add origin https://github.com/Trouvailla/YT-B.git
git push -u origin main
```

### 第三步：开启 GitHub Pages

1. 打开 https://github.com/Trouvailla/YT-B/settings/pages
2. **Source** 选择 **GitHub Actions**
3. 返回仓库的 **Actions** 标签页，应该能看到正在运行的部署工作流
4. 等待绿色 ✅ 完成
5. 访问 https://trouvailla.github.io/YT-B/

### 第四步：放入数据文件

把你的 Excel/CSV 文件放入 `data/` 目录：

```bash
cp /path/to/your/data.xlsx data/
git add data/
git commit -m "📊 add daily report"
git push
```

推送后，Actions 会自动重新部署，几分钟后看板就更新了。

---

## 🗂️ 项目结构

```
YT-B/
├── data/                     ← 📁 把你的 Excel/CSV 放这里
│   └── daily-report.xlsx     ← 示例（可删除替换）
├── src/
│   ├── config/sources.js     ← ⚙️ 数据源配置
│   ├── api/github.js         ← GitHub 数据读取
│   ├── stores/data.js        ← 数据状态管理
│   └── views/
│       ├── Dashboard.vue     ← 总览看板
│       ├── Analysis.vue      ← 图表分析
│       ├── Detail.vue        ← 数据明细
│       └── RepoConfig.vue    ← 配置页面
├── .github/workflows/deploy.yml  ← 自动部署
└── package.json
```

## ⚙️ 本地开发

```bash
npm install
npm run dev      # → http://localhost:3000
```

## 🔑 私有仓库

如果你选择私有仓库，需要配置 Token：
1. 生成 [Personal Access Token](https://github.com/settings/tokens)（权限：repo）
2. 打开看板 → **数据配置** → 填入 Token
