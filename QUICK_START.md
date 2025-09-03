# 🚀 注意力追踪器快速启动指南

## ✨ 已完成的功能

✅ **后端服务器**: 基于Node.js + Express的完整后端服务  
✅ **数据存储**: JSON文件存储，自动创建和管理  
✅ **API接口**: 完整的RESTful API，支持增删改查  
✅ **数据管理**: 支持导入/导出功能  
✅ **健康检查**: 服务器状态监控  
✅ **测试验证**: 完整的API测试脚本  

## 🎯 快速启动

### 方法1: 使用启动脚本（推荐）
```bash
./start_server.sh
```

### 方法2: 手动启动
```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

## 🌐 访问地址

- **前端应用**: http://localhost:3000
- **API接口**: http://localhost:3000/api/*
- **健康检查**: http://localhost:3000/api/health

## 🔧 API接口说明

### 基础接口
- `GET /api/activities` - 获取所有活动记录
- `POST /api/activities` - 保存活动记录
- `GET /api/current-activity` - 获取当前活动

### 统计接口
- `GET /api/stats` - 获取统计数据
- `POST /api/stats` - 保存统计数据

### 数据管理
- `GET /api/export` - 导出所有数据
- `POST /api/import` - 导入数据

## 📁 数据文件

服务器会自动创建以下文件：
- `attention_tracker_activities.json` - 活动记录
- `attention_tracker_current.json` - 当前活动
- `attention_tracker_stats.json` - 统计数据

## 🧪 测试验证

运行测试脚本验证API功能：
```bash
node test_api.js
```

## 🛠️ 技术架构

```
前端应用 (HTML/CSS/JS)
    ↓ HTTP API
Express服务器 (Node.js)
    ↓ 文件系统
JSON数据文件
```

## 🔮 下一步计划

根据您的需求，我们可以：

1. **数据库升级**: 从JSON文件升级到SQLite/MySQL
2. **前端集成**: 修改前端代码使用后端API
3. **功能增强**: 添加用户认证、数据同步等
4. **部署优化**: 生产环境部署配置

## 📞 技术支持

如有问题，请检查：
1. Node.js版本 (需要14.0.0+)
2. 端口3000是否被占用
3. 依赖是否正确安装
4. 查看控制台错误日志

---

**🎉 恭喜！您的注意力追踪器后端服务器已经成功运行！**
