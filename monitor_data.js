const fs = require('fs');
const path = require('path');

console.log('🔍 实时监控数据文件变化...');
console.log('📁 监控文件: attention_tracker_activities.json');
console.log('⏰ 每2秒检查一次，按 Ctrl+C 停止\n');

let lastContent = '';
let checkCount = 0;

function checkFile() {
    checkCount++;
    const timestamp = new Date().toLocaleTimeString();
    
    try {
        const filePath = './attention_tracker_activities.json';
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content !== lastContent) {
            console.log(`\n🔄 [${timestamp}] 第${checkCount}次检查 - 文件内容已变化！`);
            console.log('📄 当前文件内容:');
            console.log(content);
            console.log('─'.repeat(50));
            
            lastContent = content;
        } else {
            process.stdout.write(`\r⏳ [${timestamp}] 第${checkCount}次检查 - 文件无变化...`);
        }
    } catch (error) {
        console.error(`\n❌ [${timestamp}] 检查失败:`, error.message);
    }
}

// 每2秒检查一次
const interval = setInterval(checkFile, 2000);

// 优雅退出
process.on('SIGINT', () => {
    console.log('\n\n🛑 监控已停止');
    clearInterval(interval);
    process.exit(0);
});

// 初始检查
checkFile();
