#!/bin/bash

echo "🚀 启动注意力追踪器后端服务器..."
echo "=================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

# 检查端口是否被占用
if lsof -i :3000 &> /dev/null; then
    echo "⚠️  警告: 端口3000已被占用"
    echo "正在停止现有进程..."
    lsof -ti :3000 | xargs kill -9
    sleep 2
fi

echo "✅ 启动服务器..."
echo "🌐 前端应用: http://localhost:3000"
echo "🔧 API接口: http://localhost:3000/api/*"
echo "📊 健康检查: http://localhost:3000/api/health"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "=================================="

# 启动服务器
npm start
