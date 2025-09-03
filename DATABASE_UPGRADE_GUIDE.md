
# 数据库升级指南 - 从JSON文件到数据库

## 🎯 升级目标

将现有的JSON文件存储升级为数据库存储，保持API接口完全兼容。

## 🔄 升级策略

### 1. **保持API接口不变**
- 所有现有的API端点保持不变
- 请求和响应格式完全一致
- 前端代码无需修改

### 2. **替换存储层**
- JSON文件 → 数据库表
- 文件读写 → SQL查询
- 保持数据模型一致

## 🗄️ 数据库设计

### 1. **活动记录表 (activities)**
```sql
CREATE TABLE activities (
    id VARCHAR(255) PRIMARY KEY,
    activity_name VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_minutes INTEGER,
    continued_from VARCHAR(255),
    is_part_of_series BOOLEAN DEFAULT FALSE,
    note TEXT,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_start_time (start_time),
    INDEX idx_activity_name (activity_name),
    INDEX idx_continued_from (continued_from)
);
```

### 2. **当前活动表 (current_activities)**
```sql
CREATE TABLE current_activities (
    id VARCHAR(255) PRIMARY KEY,
    activity_name VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    paused_time_ms BIGINT DEFAULT 0,
    total_elapsed_ms BIGINT DEFAULT 0,
    state VARCHAR(20) DEFAULT 'running',
    last_update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id) REFERENCES activities(id) ON DELETE CASCADE
);
```

### 3. **活动分段表 (activity_laps) - 可选**
```sql
CREATE TABLE activity_laps (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    activity_id VARCHAR(255) NOT NULL,
    lap_number INTEGER NOT NULL,
    split_time_ms BIGINT,
    total_time_ms BIGINT,
    timestamp DATETIME NOT NULL,
    
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    INDEX idx_activity_id (activity_id)
);
```

## 🔧 代码修改指南

### 1. **替换依赖**
```json
// package.json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",        // 或 "pg" 用于PostgreSQL
    "cors": "^2.8.5"
  }
}
```

### 2. **数据库连接配置**
```javascript
// 替换 fs 导入
const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'time_tracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);
```

### 3. **替换文件操作函数**

#### 原函数 (JSON文件)
```javascript
async function readDataFile() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取数据文件失败:', error);
        return { activities: [] };
    }
}
```

#### 新函数 (数据库)
```javascript
async function readDataFile() {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM activities ORDER BY start_time DESC'
        );
        return { activities: rows };
    } catch (error) {
        console.error('读取数据库失败:', error);
        return { activities: [] };
    }
}
```

#### 原函数 (JSON文件)
```javascript
async function writeDataFile(data) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('写入数据文件失败:', error);
        return false;
    }
}
```

#### 新函数 (数据库)
```javascript
async function writeDataFile(data) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // 清空现有数据
        await connection.execute('DELETE FROM activities');
        
        // 插入新数据
        if (data.activities && data.activities.length > 0) {
            const stmt = await connection.prepare(`
                INSERT INTO activities (
                    id, activity_name, start_time, end_time, duration_minutes,
                    continued_from, is_part_of_series, note, color
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            for (const activity of data.activities) {
                await stmt.execute([
                    activity.id,
                    activity.activityName,
                    activity.startTime,
                    activity.endTime,
                    activity.duration,
                    activity.continuedFrom || null,
                    activity.isPartOfSeries || false,
                    activity.note || null,
                    activity.color || null
                ]);
            }
            
            await stmt.close();
        }
        
        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        console.error('写入数据库失败:', error);
        return false;
    } finally {
        connection.release();
    }
}
```

### 4. **API路由保持不变**
```javascript
// 这些API端点完全不需要修改
app.get('/api/activities', async (req, res) => { ... });
app.post('/api/activities', async (req, res) => { ... });
app.get('/api/current-activity', async (req, res) => { ... });
```

## 📊 数据迁移脚本

### 1. **从JSON文件迁移到数据库**
```javascript
async function migrateFromJSON() {
    try {
        // 读取现有JSON文件
        const activitiesData = await readDataFile();
        const currentActivityData = await readCurrentActivityFile();
        
        // 迁移到数据库
        await writeDataFile(activitiesData);
        await writeCurrentActivityFile(currentActivityData);
        
        console.log('数据迁移完成');
        
        // 可选：备份原JSON文件
        await fs.rename(DATA_FILE, `${DATA_FILE}.backup`);
        await fs.rename(CURRENT_ACTIVITY_FILE, `${CURRENT_ACTIVITY_FILE}.backup`);
        
    } catch (error) {
        console.error('数据迁移失败:', error);
    }
}
```

### 2. **数据验证脚本**
```javascript
async function validateMigration() {
    try {
        // 从数据库读取
        const dbData = await readDataFile();
        
        // 从备份文件读取
        const backupData = await fs.readFile(`${DATA_FILE}.backup`, 'utf8');
        const backupJson = JSON.parse(backupData);
        
        // 比较数据
        const dbCount = dbData.activities.length;
        const backupCount = backupJson.activities.length;
        
        console.log(`数据库记录数: ${dbCount}`);
        console.log(`备份文件记录数: ${backupCount}`);
        console.log(`迁移${dbCount === backupCount ? '成功' : '失败'}`);
        
    } catch (error) {
        console.error('验证失败:', error);
    }
}
```

## 🚀 升级步骤

### 1. **准备阶段**
- 备份现有JSON文件
- 安装数据库依赖
- 创建数据库和表结构

### 2. **代码修改**
- 替换文件操作函数
- 添加数据库连接配置
- 实现数据迁移脚本

### 3. **测试验证**
- 运行数据迁移
- 验证API功能
- 测试数据完整性

### 4. **部署上线**
- 停止旧服务
- 启动新服务
- 监控运行状态

## 🔍 性能优化建议

### 1. **数据库优化**
- 添加适当的索引
- 使用连接池
- 实现查询缓存

### 2. **查询优化**
- 使用预处理语句
- 实现分页查询
- 添加数据聚合

### 3. **监控和日志**
- 添加查询性能监控
- 记录慢查询日志
- 实现数据统计

## 📋 检查清单

- [ ] 数据库表结构创建
- [ ] 依赖包安装
- [ ] 代码函数替换
- [ ] 数据迁移脚本
- [ ] API功能测试
- [ ] 数据完整性验证
- [ ] 性能测试
- [ ] 部署上线

---

**关键点**: 保持API接口完全不变，只替换底层的存储实现。这样可以确保前端无需修改，用户体验完全一致。
