@echo off
REM =============================================
REM  一键推送脚本 — 数据看板到 Trouvailla/YT-B
REM  使用方式：双击运行，或在终端执行
REM =============================================

echo ========================================
echo   📊 数据看板 — 推送到 GitHub
echo   仓库：Trouvailla / YT-B
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] 添加所有文件到 Git...
git add .

echo [2/4] 创建初始提交...
git commit -m "🎉 init: 数据看板初始版本"

echo [3/4] 添加远程仓库...
git remote add origin https://github.com/Trouvailla/YT-B.git 2>nul
echo     远程仓库已添加（如已存在则忽略）

echo [4/4] 推送到 GitHub...
git push -u origin main

echo.
echo ========================================
echo   ✅ 完成！
echo.
echo   请检查 Actions 是否运行成功：
echo   https://github.com/Trouvailla/YT-B/actions
echo.
echo   部署后访问：
echo   https://trouvailla.github.io/YT-B/
echo ========================================
pause
