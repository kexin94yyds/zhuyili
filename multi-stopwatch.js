// 多活动计时器管理器
class MultiStopwatchManager {
    constructor() {
        this.timers = new Map(); // 存储所有活动的计时器
        this.updateIntervals = new Map(); // 存储更新间隔ID
        this.loadData();
        this.initMainPageUI();
    }

    // 创建或获取活动计时器
    getTimer(activityName) {
        if (!this.timers.has(activityName)) {
            this.timers.set(activityName, {
                name: activityName,
                startTime: null,
                elapsedTime: 0,
                isRunning: false,
                laps: [],
                created: Date.now()
            });
        }
        return this.timers.get(activityName);
    }

    // 开始计时
    start(activityName) {
        const timer = this.getTimer(activityName);
        if (!timer.isRunning) {
            timer.startTime = Date.now() - timer.elapsedTime;
            timer.isRunning = true;
            this.saveData();
            this.updateMainPageUI();
        }
    }

    // 停止计时
    stop(activityName) {
        console.log(`MultiStopwatchManager: 尝试停止活动 "${activityName}"`);
        
        const timer = this.getTimer(activityName);
        if (timer.isRunning) {
            const endTime = Date.now();
            timer.elapsedTime = endTime - timer.startTime;
            timer.isRunning = false;
            
            console.log(`MultiStopwatchManager: 活动 "${activityName}" 已停止，用时 ${Math.floor(timer.elapsedTime / 1000)} 秒`);
            
            // 如果计时时间超过1分钟，保存为完成的活动记录
            if (timer.elapsedTime >= 60000) { // 60秒 = 60000毫秒
                this.completeActivity(activityName, timer.startTime, endTime);
            }
            
            this.saveData();
            this.updateMainPageUI();
        } else {
            console.log(`MultiStopwatchManager: 活动 "${activityName}" 未在运行中`);
        }
    }

    // 重置计时器
    reset(activityName) {
        const timer = this.getTimer(activityName);
        timer.startTime = null;
        timer.elapsedTime = 0;
        timer.isRunning = false;
        timer.laps = [];
        this.saveData();
        this.updateMainPageUI();
    }

    // 删除计时器
    delete(activityName) {
        if (this.timers.has(activityName)) {
            // 停止更新间隔
            if (this.updateIntervals.has(activityName)) {
                clearInterval(this.updateIntervals.get(activityName));
                this.updateIntervals.delete(activityName);
            }
            
            this.timers.delete(activityName);
            this.saveData();
            this.updateMainPageUI();
        }
    }

    // 添加Lap
    addLap(activityName) {
        const timer = this.getTimer(activityName);
        if (timer.isRunning) {
            const currentTime = Date.now() - timer.startTime;
            const lastLapTime = timer.laps.length > 0 ? timer.laps[timer.laps.length - 1].total : 0;
            
            timer.laps.push({
                number: timer.laps.length + 1,
                split: currentTime - lastLapTime,
                total: currentTime,
                timestamp: Date.now()
            });
            this.saveData();
        }
    }

    // 获取当前时间
    getCurrentTime(activityName) {
        const timer = this.getTimer(activityName);
        if (timer.isRunning) {
            return Date.now() - timer.startTime;
        } else {
            return timer.elapsedTime;
        }
    }

    // 获取所有活动列表
    getAllActivities() {
        return Array.from(this.timers.keys());
    }

    // 格式化时间显示
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
        }
    }

    // 获取状态文本
    getStatusText(timer) {
        if (timer.isRunning) {
            return '运行中';
        } else if (timer.elapsedTime > 0) {
            return '已暂停';
        } else {
            return '未开始';
        }
    }

    // 获取状态CSS类
    getStatusClass(timer) {
        if (timer.isRunning) {
            return 'running';
        } else if (timer.elapsedTime > 0) {
            return 'paused';
        } else {
            return 'stopped';
        }
    }

    // 初始化主页面UI
    initMainPageUI() {
        console.log('MultiStopwatchManager: 正在初始化主页面UI...');
        
        // 清理旧系统数据
        this.migrateOldData();
        
        // 修改开始按钮行为
        const startBtn = document.getElementById('start-btn');
        const activityNameInput = document.getElementById('activity-name');

        if (startBtn && activityNameInput) {
            // 移除原有事件监听器
            const newStartBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newStartBtn, startBtn);

            // 添加新的事件监听器
            newStartBtn.addEventListener('click', () => {
                const activityName = activityNameInput.value.trim();
                
                if (!activityName) {
                    alert('请输入活动名称');
                    return;
                }

                // 创建计时器并跳转到计时页面
                this.getTimer(activityName);
                this.saveData();
                
                // 跳转到计时页面
                window.location.href = `stopwatch.html?activity=${encodeURIComponent(activityName)}`;
            });
        }

        // 隐藏旧的当前活动区域
        this.hideOldCurrentActivity();

        this.updateMainPageUI();
    }

    // 迁移旧系统数据
    migrateOldData() {
        try {
            const oldData = localStorage.getItem('timeTrackerData');
            if (oldData) {
                const parsed = JSON.parse(oldData);
                
                // 如果有正在进行的活动，将其迁移到新系统
                if (parsed.currentActivity) {
                    const activity = parsed.currentActivity;
                    const timer = this.getTimer(activity.activityName);
                    timer.startTime = new Date(activity.startTime).getTime();
                    timer.elapsedTime = Date.now() - timer.startTime;
                    timer.isRunning = true;
                    
                    console.log(`MultiStopwatchManager: 迁移活动 "${activity.activityName}"`);
                }
                
                // 将旧的活动记录迁移到新的存储位置
                if (parsed.activities && parsed.activities.length > 0) {
                    localStorage.setItem('timeTrackerActivities', JSON.stringify(parsed.activities));
                    console.log(`MultiStopwatchManager: 迁移了 ${parsed.activities.length} 条历史记录`);
                }
                
                this.saveData();
            }
        } catch (error) {
            console.error('MultiStopwatchManager: 迁移数据失败:', error);
        }
    }

    // 隐藏旧的当前活动区域
    hideOldCurrentActivity() {
        const currentActivitySection = document.getElementById('current-activity-section');
        if (currentActivitySection) {
            // 只隐藏当前活动部分，保留统计功能
            const activityDetails = currentActivitySection.querySelector('.activity-details');
            const noActivity = currentActivitySection.querySelector('.no-activity');
            
            if (activityDetails) activityDetails.style.display = 'none';
            if (noActivity) {
                noActivity.textContent = '使用上方的活动计时器进行计时';
                noActivity.style.display = 'block';
            }
            
            console.log('MultiStopwatchManager: 已更新当前活动区域显示');
        }
    }

    // 更新主页面UI
    updateMainPageUI() {
        console.log('MultiStopwatchManager: 正在更新主页面UI...');
        
        const timersContainer = document.getElementById('activity-timers');
        const noTimersElement = document.getElementById('no-timers');

        if (!timersContainer) {
            console.error('MultiStopwatchManager: 找不到activity-timers容器！');
            return;
        }

        const activities = this.getAllActivities();

        if (activities.length === 0) {
            if (noTimersElement) {
                noTimersElement.style.display = 'block';
            }
            // 清空其他内容
            Array.from(timersContainer.children).forEach(child => {
                if (child.id !== 'no-timers') {
                    child.remove();
                }
            });
            return;
        }

        if (noTimersElement) {
            noTimersElement.style.display = 'none';
        }

        // 清空现有内容（除了no-timers元素）
        Array.from(timersContainer.children).forEach(child => {
            if (child.id !== 'no-timers') {
                child.remove();
            }
        });

        // 为每个活动创建计时器卡片
        activities.forEach(activityName => {
            const timer = this.getTimer(activityName);
            const timerCard = this.createTimerCard(timer);
            timersContainer.appendChild(timerCard);
        });

        // 启动实时更新
        this.startRealTimeUpdate();
    }

    // 创建计时器卡片
    createTimerCard(timer) {
        const card = document.createElement('div');
        card.className = `timer-card ${this.getStatusClass(timer)}`;
        card.dataset.activity = timer.name;

        const currentTime = this.getCurrentTime(timer.name);

        card.innerHTML = `
            <div class="timer-header">
                <div class="timer-name">${timer.name}</div>
                <div class="timer-status">
                    <span class="status-dot ${this.getStatusClass(timer)}"></span>
                    <span>${this.getStatusText(timer)}</span>
                </div>
            </div>
            <div class="timer-time">${this.formatTime(currentTime)}</div>
            <div class="timer-actions">
                ${this.getActionButtons(timer)}
            </div>
        `;

        // 添加点击事件 - 点击卡片进入计时页面
        card.addEventListener('click', (e) => {
            // 如果点击的是按钮，不触发卡片点击事件
            if (e.target.classList.contains('timer-btn')) {
                return;
            }
            
            window.location.href = `stopwatch.html?activity=${encodeURIComponent(timer.name)}`;
        });

        // 添加按钮事件监听器
        this.addButtonListeners(card, timer);

        return card;
    }

    // 获取操作按钮HTML
    getActionButtons(timer) {
        if (timer.isRunning) {
            return `
                <button class="timer-btn secondary" data-action="stop">停止</button>
                <button class="timer-btn primary" data-action="complete">完成</button>
                <button class="timer-btn danger" data-action="delete">删除</button>
            `;
        } else if (timer.elapsedTime > 0) {
            return `
                <button class="timer-btn primary" data-action="start">继续</button>
                <button class="timer-btn primary" data-action="complete">完成</button>
                <button class="timer-btn secondary" data-action="reset">重置</button>
                <button class="timer-btn danger" data-action="delete">删除</button>
            `;
        } else {
            return `
                <button class="timer-btn primary" data-action="start">开始</button>
                <button class="timer-btn danger" data-action="delete">删除</button>
            `;
        }
    }

    // 添加按钮事件监听器
    addButtonListeners(card, timer) {
        const buttons = card.querySelectorAll('.timer-btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                
                const action = button.dataset.action;
                console.log(`MultiStopwatchManager: 按钮点击 - 活动: "${timer.name}", 操作: "${action}"`);
                
                switch (action) {
                    case 'start':
                        this.start(timer.name);
                        break;
                    case 'stop':
                        this.stop(timer.name);
                        break;
                    case 'complete':
                        this.completeActivityAndReset(timer.name);
                        break;
                    case 'reset':
                        if (confirm(`确定要重置"${timer.name}"的计时器吗？这将清除所有数据。`)) {
                            this.reset(timer.name);
                        }
                        break;
                    case 'delete':
                        if (confirm(`确定要删除"${timer.name}"计时器吗？`)) {
                            this.delete(timer.name);
                        }
                        break;
                }
            });
        });
    }

    // 启动实时更新
    startRealTimeUpdate() {
        // 清除现有的更新间隔
        this.updateIntervals.forEach((intervalId) => {
            clearInterval(intervalId);
        });
        this.updateIntervals.clear();

        // 为运行中的计时器启动更新
        this.timers.forEach((timer, activityName) => {
            if (timer.isRunning) {
                const intervalId = setInterval(() => {
                    this.updateTimerCard(activityName);
                }, 100); // 每100ms更新一次
                
                this.updateIntervals.set(activityName, intervalId);
            }
        });
    }

    // 更新单个计时器卡片
    updateTimerCard(activityName) {
        const card = document.querySelector(`.timer-card[data-activity="${activityName}"]`);
        if (!card) return;

        const timer = this.getTimer(activityName);
        const currentTime = this.getCurrentTime(activityName);
        
        // 更新时间显示
        const timeElement = card.querySelector('.timer-time');
        if (timeElement) {
            timeElement.textContent = this.formatTime(currentTime);
        }

        // 检查状态是否发生变化，只有变化时才更新按钮
        const currentStatusClass = this.getStatusClass(timer);
        const cardStatusClass = card.className.split(' ').find(cls => ['running', 'paused', 'stopped'].includes(cls));
        
        if (currentStatusClass !== cardStatusClass) {
            // 状态发生变化，需要更新
            card.className = `timer-card ${currentStatusClass}`;
            
            const statusDot = card.querySelector('.status-dot');
            if (statusDot) {
                statusDot.className = `status-dot ${currentStatusClass}`;
            }
            
            const statusText = card.querySelector('.timer-status span:last-child');
            if (statusText) {
                statusText.textContent = this.getStatusText(timer);
            }

            // 只有状态变化时才更新按钮，避免频繁重新绑定事件
            const actionsContainer = card.querySelector('.timer-actions');
            if (actionsContainer) {
                actionsContainer.innerHTML = this.getActionButtons(timer);
                this.addButtonListeners(card, timer);
            }
        } else {
            // 状态没有变化，只更新状态文本（不重新绑定按钮事件）
            const statusText = card.querySelector('.timer-status span:last-child');
            if (statusText) {
                statusText.textContent = this.getStatusText(timer);
            }
        }
    }

    // 保存数据
    saveData() {
        const data = {};
        this.timers.forEach((timer, name) => {
            data[name] = {
                ...timer
            };
        });
        localStorage.setItem('multiStopwatchData', JSON.stringify(data));
        
        // 同时保存兼容旧统计系统的数据格式
        this.saveCompatibleData();
    }

    // 保存兼容旧统计系统的数据
    saveCompatibleData() {
        // 收集所有已完成的活动记录（用于统计）
        let completedActivities = [];
        
        // 从localStorage中获取已存在的完成记录
        const existingData = localStorage.getItem('timeTrackerActivities');
        if (existingData) {
            try {
                completedActivities = JSON.parse(existingData);
            } catch (error) {
                console.error('加载现有活动记录失败:', error);
            }
        }

        // 保存当前正在运行的活动状态（如果有的话）
        let currentActivity = null;
        this.timers.forEach((timer, name) => {
            if (timer.isRunning) {
                currentActivity = {
                    id: `stopwatch_${name}_${Date.now()}`,
                    activityName: name,
                    startTime: new Date(timer.startTime),
                    endTime: null,
                    duration: Math.floor((Date.now() - timer.startTime) / (1000 * 60))
                };
            }
        });

        // 保存兼容格式的数据供统计系统使用
        const compatibleData = {
            activities: completedActivities,
            currentActivity: currentActivity
        };

        localStorage.setItem('timeTrackerData', JSON.stringify(compatibleData));
    }

    // 完成活动时添加到统计记录
    completeActivity(activityName, startTime, endTime) {
        let completedActivities = [];
        
        // 获取现有记录
        const existingData = localStorage.getItem('timeTrackerActivities');
        if (existingData) {
            try {
                completedActivities = JSON.parse(existingData);
            } catch (error) {
                completedActivities = [];
            }
        }

        // 添加新记录
        const activityRecord = {
            id: `stopwatch_${activityName}_${Date.now()}`,
            activityName: activityName,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            duration: Math.floor((endTime - startTime) / (1000 * 60))
        };

        completedActivities.unshift(activityRecord);
        
        // 保存更新后的记录
        localStorage.setItem('timeTrackerActivities', JSON.stringify(completedActivities));
        
        // 更新兼容数据
        this.saveCompatibleData();

        console.log(`MultiStopwatchManager: 活动记录已保存 - ${activityName}, 持续 ${activityRecord.duration} 分钟`);
    }

    // 完成活动并重置计时器
    completeActivityAndReset(activityName) {
        const timer = this.getTimer(activityName);
        const endTime = Date.now();
        
        // 只有当计时器有时间记录时才保存
        if (timer.elapsedTime > 0 || timer.isRunning) {
            const actualEndTime = timer.isRunning ? endTime : (timer.startTime + timer.elapsedTime);
            const actualStartTime = timer.startTime || (endTime - timer.elapsedTime);
            
            // 保存活动记录
            this.completeActivity(activityName, actualStartTime, actualEndTime);
        }
        
        // 重置计时器
        this.reset(activityName);
        
        // 显示完成提示
        const minutes = Math.floor((timer.elapsedTime || 0) / (1000 * 60));
        if (minutes > 0) {
            alert(`活动"${activityName}"已完成！\n总用时: ${minutes} 分钟\n记录已保存到统计中。`);
        }
    }

    // 加载数据
    loadData() {
        const data = localStorage.getItem('multiStopwatchData');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                Object.entries(parsed).forEach(([name, timer]) => {
                    this.timers.set(name, {
                        ...timer
                    });
                });
            } catch (error) {
                console.error('加载数据失败:', error);
            }
        }
    }

    // 清理资源
    cleanup() {
        this.updateIntervals.forEach((intervalId) => {
            clearInterval(intervalId);
        });
        this.updateIntervals.clear();
    }
}

// 全局实例
let multiStopwatchManager = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他脚本已加载完成
    setTimeout(() => {
        multiStopwatchManager = new MultiStopwatchManager();
    }, 100);
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (multiStopwatchManager) {
        multiStopwatchManager.cleanup();
    }
}); 