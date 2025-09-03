# 注意力追踪器后端服务器

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务器
```bash
# 生产环境
npm start

# 开发环境（自动重启）
npm run dev
```

### 3. 访问应用
- **前端应用**: 
http://localhost:3000
- **API接口**: http://localhost:3000/api/*

## 📁 数据文件结构

服务器会自动创建以下数据文件：

```
attention_tracker_activities.json  # 活动记录数据
attention_tracker_current.json     # 当前活动数据
attention_tracker_stats.json       # 统计数据
```

## 🔌 API接口

### 基础接口

#### 获取所有活动记录
```
GET /api/activities
响应: 活动记录数组
```

#### 保存活动记录
```
POST /api/activities
请求体: { activities: [...], currentActivity: {...} }
响应: { success: true, message: "注意力追踪数据保存成功" }
```

#### 获取当前活动
```
GET /api/current-activity
响应: 当前活动对象或null
```

### 统计接口

#### 获取统计数据
```
GET /api/stats
响应: 统计数据对象
```

#### 保存统计数据
```
POST /api/stats
请求体: 统计数据对象
响应: { success: true, message: "统计数据保存成功" }
```

### 数据管理接口

#### 导出所有数据
```
GET /api/export
响应: 包含所有数据的JSON文件下载
```

#### 导入数据
```
POST /api/import
请求体: 导入数据对象
响应: { success: true, message: "数据导入成功" }
```

#### 健康检查
```
GET /api/health
响应: 服务器状态信息
```

## 🛠️ 技术特性

- **Express.js**: 现代化的Node.js Web框架
- **CORS支持**: 允许跨域请求
- **JSON文件存储**: 轻量级数据存储方案
- **自动文件创建**: 首次运行时自动初始化数据文件
- **错误处理**: 完善的错误处理和日志记录
- **静态文件服务**: 同时提供前端和后端服务

## 🔧 配置选项

### 端口配置
```javascript
const PORT = 3000; // 可在server.js中修改
```

### 数据文件路径
```javascript
const ACTIVITIES_DATA_FILE = './attention_tracker_activities.json';
const CURRENT_ACTIVITY_FILE = './attention_tracker_current.json';
const STATS_DATA_FILE = './attention_tracker_stats.json';
```

## 📊 数据模型

### 活动记录 (Activity)
```json
{
  "id": "唯一标识符",
  "activityName": "活动名称",
  "startTime": "开始时间 (ISO格式)",
  "endTime": "结束时间 (ISO格式)",
  "duration": "持续时间 (分钟)",
  "continuedFrom": "连续活动的上一个ID (可选)",
  "isPartOfSeries": "是否为系列活动 (布尔值)",
  "note": "备注信息 (可选)",
  "color": "活动颜色 (可选)"
}
```

### 当前活动 (CurrentActivity)
```json
{
  "id": "唯一标识符",
  "activityName": "活动名称",
  "startTime": "开始时间 (ISO格式)",
  "pausedTime": "暂停时间 (毫秒)",
  "totalElapsed": "总经过时间 (毫秒)",
  "state": "状态 (running/paused/stopped)"
}
```

### 统计数据 (Stats)
```json
{
  "dailyStats": {
    "2024-01-01": {
      "totalTime": 480,
      "activities": [...]
    }
  },
  "activityStats": {
    "活动名称": {
      "totalTime": 1200,
      "count": 5
    }
  }
}
```

## 🔄 数据迁移

### 从现有JSON文件迁移
1. 将现有数据文件重命名
2. 启动服务器，会自动创建新的数据文件
3. 使用导入接口恢复数据

### 备份建议
- 定期备份数据文件
- 使用导出接口创建数据快照
- 考虑版本控制数据文件

## 🚨 故障排除

### 常见问题

#### 端口被占用
```bash
# 查看端口占用
lsof -i :3000

# 杀死占用进程
kill -9 <PID>
```

#### 文件权限问题
```bash
# 确保有读写权限
chmod 644 *.json
```

#### 依赖安装失败
```bash
# 清除npm缓存
npm cache clean --force

# 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 日志查看
服务器会在控制台输出详细的运行日志，包括：
- 启动信息
- 数据文件初始化状态
- API请求日志
- 错误信息

## 🔮 未来扩展

### 数据库升级
- 支持SQLite/MySQL/PostgreSQL
- 保持API接口兼容性
- 添加数据索引和查询优化

### 功能增强
- 用户认证和授权
- 数据分页和搜索
- 实时数据同步
- 数据备份和恢复

### 性能优化
- 数据缓存机制
- 增量更新支持
- 数据压缩
- 性能监控

## 📞 技术支持

如有问题，请检查：
1. Node.js版本 (需要14.0.0+)
2. 依赖包是否正确安装
3. 端口是否被占用
4. 文件权限是否正确

---

**注意**: 这是一个轻量级的后端服务器，适合个人使用和小型项目。如需生产环境部署，建议考虑数据库存储和更完善的错误处理。
