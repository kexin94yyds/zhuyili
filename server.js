const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8080;

// 数据文件路径
const DATA_FILE = './time_tracker_data.json';
const CURRENT_ACTIVITY_FILE = './current_activity.json';

// 中间件
app.use(cors());
app.use(express.json());

// 提供静态文件服务 - 包括HTML、CSS、JS文件
app.use(express.static(__dirname));

// 确保数据文件存在
async function ensureDataFiles() {
    try {
        // 检查数据文件是否存在
        try {
            await fs.access(DATA_FILE);
        } catch {
            // 如果不存在，创建空的JSON文件
            await fs.writeFile(DATA_FILE, JSON.stringify({ activities: [] }, null, 2));
        }
        
        // 检查当前活动文件是否存在
        try {
            await fs.access(CURRENT_ACTIVITY_FILE);
        } catch {
            // 如果不存在，创建空的JSON文件
            await fs.writeFile(CURRENT_ACTIVITY_FILE, JSON.stringify(null, null, 2));
        }
        
        console.log('数据文件初始化完成');
    } catch (error) {
        console.error('初始化数据文件失败:', error);
    }
}

// 读取数据文件
async function readDataFile() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取数据文件失败:', error);
        return { activities: [] };
    }
}

// 写入数据文件
async function writeDataFile(data) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('写入数据文件失败:', error);
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

// API路由

// 获取所有活动记录
app.get('/api/activities', async (req, res) => {
    try {
        const data = await readDataFile();
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
        const saveSuccess = await writeDataFile(data);
        
        // 保存当前活动
        const currentSaveSuccess = await writeCurrentActivityFile(currentActivity);
        
        if (saveSuccess && currentSaveSuccess) {
            res.json({ success: true, message: '数据保存成功' });
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

// 启动服务器
app.listen(PORT, async () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    await ensureDataFiles();
});




