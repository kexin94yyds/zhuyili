const http = require('http');

console.log('🧪 测试数据保存功能...');

// 测试数据
const testData = {
    activities: [{
        id: 'test-db-' + Date.now(),
        activityName: '数据库测试',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 5,
        color: '#FF6B6B'
    }],
    currentActivity: null
};

// 保存数据
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
        console.log('📤 保存响应:', res.statusCode);
        console.log('📄 响应内容:', data);
        
        if (res.statusCode === 200) {
            console.log('✅ 保存成功！');
            console.log('🔍 现在检查数据文件...');
            
            // 读取数据文件验证
            const fs = require('fs');
            try {
                const fileData = fs.readFileSync('./attention_tracker_activities.json', 'utf8');
                const parsed = JSON.parse(fileData);
                console.log('📁 文件内容:', JSON.stringify(parsed, null, 2));
            } catch (error) {
                console.error('❌ 读取文件失败:', error);
            }
        } else {
            console.log('❌ 保存失败');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ 请求失败:', error);
});

req.write(postData);
req.end();
