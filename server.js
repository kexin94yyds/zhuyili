const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 数据文件路径 - 专门为注意力追踪器应用
const ACTIVITIES_DATA_FILE = './attention_tracker_activities.json';
const CURRENT_ACTIVITY_FILE = './attention_tracker_current.json';
const STATS_DATA_FILE = './attention_tracker_stats.json';

// 中间件
app.use(cors());
app.use(express.json());

// 提供静态文件服务 - 包括HTML、CSS、JS文件
app.use(express.static(__dirname));

// 确保数据文件存在
async function ensureDataFiles() {
    try {
        // 检查活动记录文件是否存在
        try {
            await fs.access(ACTIVITIES_DATA_FILE);
        } catch {
            // 如果不存在，创建空的JSON文件
            await fs.writeFile(ACTIVITIES_DATA_FILE, JSON.stringify({ activities: [] }, null, 2));
        }
        
        // 检查当前活动文件是否存在
        try {
            await fs.access(CURRENT_ACTIVITY_FILE);
        } catch {
            // 如果不存在，创建空的JSON文件
            await fs.writeFile(CURRENT_ACTIVITY_FILE, JSON.stringify(null, null, 2));
        }

        // 检查统计数据文件是否存在
        try {
            await fs.access(STATS_DATA_FILE);
        } catch {
            // 如果不存在，创建空的JSON文件
            await fs.writeFile(STATS_DATA_FILE, JSON.stringify({ dailyStats: {}, activityStats: {} }, null, 2));
        }
        
        console.log('注意力追踪器数据文件初始化完成');
    } catch (error) {
        console.error('初始化数据文件失败:', error);
    }
}

// 读取活动记录文件
async function readActivitiesFile() {
    try {
        const data = await fs.readFile(ACTIVITIES_DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取活动记录文件失败:', error);
        return { activities: [] };
    }
}

// 写入活动记录文件
async function writeActivitiesFile(data) {
    try {
        await fs.writeFile(ACTIVITIES_DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('写入活动记录文件失败:', error);
        return false;
    }
}

// 读取当前活动文件
async function readCurrentActivityFile() {
    try {
        const data = await fs.readFile(CURRENT_ACTIVITY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取当前活动文件失败:', error);
        return null;
    }
}

// 写入当前活动文件
async function writeCurrentActivityFile(data) {
    try {
        await fs.writeFile(CURRENT_ACTIVITY_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('写入当前活动文件失败:', error);
        return false;
    }
}

// 读取统计数据文件
async function readStatsFile() {
    try {
        const data = await fs.readFile(STATS_DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取统计数据文件失败:', error);
        return { dailyStats: {}, activityStats: {} };
    }
}

// 写入统计数据文件
async function writeStatsFile(data) {
    try {
        await fs.writeFile(STATS_DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('写入统计数据文件失败:', error);
        return false;
    }
}

// API路由

// 获取所有活动记录
app.get('/api/activities', async (req, res) => {
    try {
        const data = await readActivitiesFile();
        res.json(data.activities || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 保存活动记录
app.post('/api/activities', async (req, res) => {
    try {
        const { activities, currentActivity } = req.body;
        
        // 保存活动记录
        const data = { activities: activities || [] };
        const saveSuccess = await writeActivitiesFile(data);
        
        // 保存当前活动
        const currentSaveSuccess = await writeCurrentActivityFile(currentActivity);
        
        if (saveSuccess && currentSaveSuccess) {
            res.json({ success: true, message: '注意力追踪数据保存成功' });
        } else {
            res.status(500).json({ error: '保存数据失败' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取当前活动
app.get('/api/current-activity', async (req, res) => {
    try {
        const currentActivity = await readCurrentActivityFile();
        res.json(currentActivity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 新增：获取统计数据
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await readStatsFile();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 新增：保存统计数据
app.post('/api/stats', async (req, res) => {
    try {
        const statsData = req.body;
        const saveSuccess = await writeStatsFile(statsData);
        
        if (saveSuccess) {
            res.json({ success: true, message: '统计数据保存成功' });
        } else {
            res.status(500).json({ error: '保存统计数据失败' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 新增：导出所有数据
app.get('/api/export', async (req, res) => {
    try {
        const [activities, currentActivity, stats] = await Promise.all([
            readActivitiesFile(),
            readCurrentActivityFile(),
            readStatsFile()
        ]);
        
        const exportData = {
            activities: activities.activities || [],
            currentActivity,
            stats,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="attention_tracker_export.json"');
        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 新增：导入数据
app.post('/api/import', async (req, res) => {
    try {
        const importData = req.body;
        
        // 验证导入数据格式
        if (!importData.activities || !Array.isArray(importData.activities)) {
            return res.status(400).json({ error: '无效的导入数据格式' });
        }
        
        // 保存导入的数据
        const activitiesSave = await writeActivitiesFile({ activities: importData.activities });
        const currentSave = await writeCurrentActivityFile(importData.currentActivity || null);
        const statsSave = await writeStatsFile(importData.stats || { dailyStats: {}, activityStats: {} });
        
        if (activitiesSave && currentSave && statsSave) {
            res.json({ success: true, message: '数据导入成功' });
        } else {
            res.status(500).json({ error: '数据导入失败' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'Attention Span Tracker Backend',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 启动服务器
app.listen(PORT, async () => {
    console.log(`🚀 注意力追踪器后端服务器运行在 http://localhost:${PORT}`);
    console.log(`📱 前端应用访问地址: http://localhost:${PORT}`);
    console.log(`🔧 API接口地址: http://localhost:${PORT}/api/*`);
    await ensureDataFiles();
});




