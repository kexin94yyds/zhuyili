# 时间追踪应用后端逻辑文档

## 🎯 项目概述

这是一个基于Node.js + Express的时间追踪应用后端，使用JSON文件作为数据存储，提供RESTful API接口。

## 🏗️ 技术架构

```
前端应用 (HTML/CSS/JS)
    ↓ HTTP API
Express服务器 (Node.js)
    ↓ 文件系统
JSON数据文件
```

## 📁 核心文件结构

```
server.js              # 主服务器文件
package.json           # 项目依赖配置
time_tracker_data.json # 活动记录数据文件
current_activity.json  # 当前活动数据文件
```

## 🔧 技术栈

- **运行时**: Node.js
- **Web框架**: Express.js
- **数据存储**: JSON文件 (fs.promises)
- **跨域支持**: CORS
- **端口**: 3000

## 📊 数据模型

### 1. 活动记录 (Activity)
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

### 2. 当前活动 (CurrentActivity)
```json
{
  "id": "唯一标识符",
  "activityName": "活动名称",
  "startTime": "开始时间 (ISO格式)",
  "endTime": null,
  "duration": 0,
  "pausedTime": "暂停时间 (毫秒)",
  "totalElapsed": "总经过时间 (毫秒)",
  "state": "状态 (running/paused/stopped)"
}
```

## 🚀 API接口设计

### 1. 获取所有活动记录
```
GET /api/activities
响应: 活动记录数组
```

### 2. 保存活动记录
```
POST /api/activities
请求体: { activities: [...], currentActivity: {...} }
响应: { success: true, message: "数据保存成功" }
```

### 3. 获取当前活动
```
GET /api/current-activity
响应: 当前活动对象或null
```

## 💾 数据存储逻辑

### 1. 文件管理
- **活动记录文件**: `time_tracker_data.json`
- **当前活动文件**: `current_activity.json`
- 自动创建文件（如果不存在）
- 使用JSON.stringify格式化存储

### 2. 数据操作
- **读取**: 异步读取文件，解析JSON
- **写入**: 异步写入文件，格式化JSON
- **错误处理**: 读取失败时返回默认值，写入失败时返回false

### 3. 数据同步
- 每次保存时同时更新两个文件
- 支持批量保存活动记录
- 原子性操作（要么全部成功，要么全部失败）

## 🔄 核心函数逻辑

### 1. 文件初始化 (ensureDataFiles)
```javascript
async function ensureDataFiles() {
    // 检查并创建活动记录文件
    // 检查并创建当前活动文件
    // 设置默认数据结构
}
```

### 2. 数据读取 (readDataFile)
```javascript
async function readDataFile() {
    // 异步读取文件
    // JSON解析
    // 错误处理，返回默认值
}
```

### 3. 数据写入 (writeDataFile)
```javascript
async function writeDataFile(data) {
    // 格式化JSON数据
    // 异步写入文件
    // 返回操作结果
}
```

### 4. 当前活动管理
```javascript
// 读取当前活动
async function readCurrentActivityFile()

// 写入当前活动
async function writeCurrentActivityFile(data)
```

## 🛡️ 错误处理策略

### 1. 文件操作错误
- 文件不存在时自动创建
- 读取失败时返回默认数据结构
- 写入失败时返回错误状态

### 2. API错误处理
- 使用try-catch包装所有异步操作
- 返回标准HTTP状态码
- 提供详细的错误信息

### 3. 数据验证
- 检查请求体格式
- 验证必要字段
- 设置默认值

## 🔧 配置选项

### 1. 服务器配置
```javascript
const PORT = 3000;                    // 服务端口
const DATA_FILE = './time_tracker_data.json';        // 活动记录文件路径
const CURRENT_ACTIVITY_FILE = './current_activity.json'; // 当前活动文件路径
```

### 2. 中间件配置
```javascript
app.use(cors());           // 允许跨域请求
app.use(express.json());   // 解析JSON请求体
app.use(express.static(__dirname)); // 提供静态文件服务
```

## 📈 扩展建议

### 1. 数据库升级
- 替换JSON文件为SQLite/MySQL/PostgreSQL
- 保持相同的API接口
- 添加数据索引和查询优化

### 2. 功能增强
- 添加用户认证
- 支持数据分页
- 添加数据统计接口
- 支持数据导入导出

### 3. 性能优化
- 添加数据缓存
- 实现增量更新
- 支持数据压缩
- 添加日志记录

## 🧪 测试验证

### 1. API测试
```bash
# 测试获取活动列表
curl http://localhost:3000/api/activities

# 测试添加活动
curl -X POST -H "Content-Type: application/json" \
  -d '{"activities":[...],"currentActivity":null}' \
  http://localhost:3000/api/activities

# 测试获取当前活动
curl http://localhost:3000/api/current-activity
```

### 2. 功能验证
- 数据文件自动创建
- 数据读写操作
- 错误处理机制
- 跨域请求支持

## 📦 部署说明

### 1. 环境要求
- Node.js 14.0.0+
- npm 6.0.0+

### 2. 安装步骤
```bash
npm install
npm start
```

### 3. 访问地址
- 主应用: http://localhost:3000
- API接口: http://localhost:3000/api/*

## 🔍 故障排除

### 1. 常见问题
- 端口被占用: 修改PORT常量或杀死占用进程
- 文件权限: 确保有读写权限
- 依赖缺失: 运行npm install

### 2. 调试方法
- 查看控制台输出
- 检查数据文件内容
- 使用API测试工具验证

---

**注意**: 这个后端逻辑可以作为数据库设计的基础，核心是理解数据模型、API接口和存储机制。在实现数据库版本时，可以保持相同的API接口，只替换底层的存储层。
