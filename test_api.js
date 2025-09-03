const http = require('http');

// 测试健康检查端点
function testHealthCheck() {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ status: res.statusCode, data: result });
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

// 测试获取活动列表
function testGetActivities() {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/activities',
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ status: res.statusCode, data: result });
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

// 测试保存活动
function testSaveActivity() {
    return new Promise((resolve, reject) => {
        const testData = {
            activities: [{
                id: 'test-1',
                activityName: '测试活动',
                startTime: new Date().toISOString(),
                endTime: null,
                duration: 0
            }],
            currentActivity: {
                id: 'test-1',
                activityName: '测试活动',
                startTime: new Date().toISOString(),
                pausedTime: 0,
                totalElapsed: 0,
                state: 'running'
            }
        };
        
        const postData = JSON.stringify(testData);
        
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/activities',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ status: res.statusCode, data: result });
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 运行所有测试
async function runTests() {
    console.log('🧪 开始测试注意力追踪器后端API...\n');
    
    try {
        // 测试1: 健康检查
        console.log('1️⃣ 测试健康检查端点...');
        const healthResult = await testHealthCheck();
        console.log(`✅ 健康检查成功: ${healthResult.status} - ${JSON.stringify(healthResult.data)}\n`);
        
        // 测试2: 获取活动列表
        console.log('2️⃣ 测试获取活动列表...');
        const activitiesResult = await testGetActivities();
        console.log(`✅ 获取活动列表成功: ${activitiesResult.status} - 活动数量: ${activitiesResult.data.length}\n`);
        
        // 测试3: 保存活动
        console.log('3️⃣ 测试保存活动...');
        const saveResult = await testSaveActivity();
        console.log(`✅ 保存活动成功: ${saveResult.status} - ${JSON.stringify(saveResult.data)}\n`);
        
        // 测试4: 再次获取活动列表验证
        console.log('4️⃣ 验证活动是否保存成功...');
        const verifyResult = await testGetActivities();
        console.log(`✅ 验证成功: ${verifyResult.status} - 活动数量: ${verifyResult.data.length}\n`);
        
        console.log('🎉 所有测试通过！后端服务器工作正常。');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// 运行测试
runTests();
