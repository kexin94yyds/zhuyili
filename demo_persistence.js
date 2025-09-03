const http = require('http');

console.log('🎯 演示注意力追踪器的数据持久化功能');
console.log('=====================================\n');

// 模拟用户使用场景
async function demonstratePersistence() {
    console.log('📱 场景1: 用户第一次打开应用，开始记录活动');
    
    // 模拟用户开始一个活动
    const activity1 = {
        activities: [{
            id: 'work-1',
            activityName: '编程工作',
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0,
            color: '#FF6B6B'
        }],
        currentActivity: {
            id: 'work-1',
            activityName: '编程工作',
            startTime: new Date().toISOString(),
            pausedTime: 0,
            totalElapsed: 0,
            state: 'running'
        }
    };
    
    console.log('✅ 用户开始记录: 编程工作');
    await saveActivity(activity1);
    
    console.log('\n📱 场景2: 用户关闭应用，数据已保存到后端');
    console.log('💾 数据已保存到: attention_tracker_activities.json');
    
    // 模拟用户重新打开应用
    console.log('\n📱 场景3: 用户重新打开应用，数据自动恢复');
    const recoveredData = await getActivities();
    console.log(`✅ 恢复的活动数量: ${recoveredData.length}`);
    console.log(`📝 恢复的活动: ${recoveredData[0]?.activityName}`);
    
    // 模拟用户继续记录
    console.log('\n📱 场景4: 用户继续添加新活动');
    const activity2 = {
        activities: [
            ...recoveredData,
            {
                id: 'study-1',
                activityName: '学习新技能',
                startTime: new Date().toISOString(),
                endTime: null,
                duration: 0,
                color: '#4ECDC4'
            }
        ],
        currentActivity: {
            id: 'study-1',
            activityName: '学习新技能',
            startTime: new Date().toISOString(),
            pausedTime: 0,
            totalElapsed: 0,
            state: 'running'
        }
    };
    
    console.log('✅ 用户添加新活动: 学习新技能');
    await saveActivity(activity2);
    
    // 最终验证
    console.log('\n📱 场景5: 最终验证所有数据都保存成功');
    const finalData = await getActivities();
    console.log(`✅ 最终活动总数: ${finalData.length}`);
    finalData.forEach((activity, index) => {
        console.log(`   ${index + 1}. ${activity.activityName} (ID: ${activity.id})`);
    });
    
    console.log('\n🎉 数据持久化演示完成！');
    console.log('💡 这就是有后端和没有后端的区别：');
    console.log('   ❌ 没有后端: 刷新页面数据丢失');
    console.log('   ✅ 有后端: 数据永久保存，随时恢复');
}

// 保存活动数据
function saveActivity(data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
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
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    if (result.success) {
                        resolve(result);
                    } else {
                        reject(new Error(result.error));
                    }
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

// 获取活动数据
function getActivities() {
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
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

// 等待服务器启动
function waitForServer() {
    return new Promise((resolve) => {
        const checkServer = () => {
            const req = http.request({
                hostname: 'localhost',
                port: 3000,
                path: '/api/health',
                method: 'GET'
            }, (res) => {
                if (res.statusCode === 200) {
                    console.log('🚀 后端服务器已启动，开始演示...\n');
                    resolve();
                } else {
                    setTimeout(checkServer, 1000);
                }
            });
            
            req.on('error', () => {
                setTimeout(checkServer, 1000);
            });
            
            req.end();
        };
        
        checkServer();
    });
}

// 主函数
async function main() {
    try {
        await waitForServer();
        await demonstratePersistence();
    } catch (error) {
        console.error('❌ 演示失败:', error.message);
    }
}

main();
