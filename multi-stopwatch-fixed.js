// 多活动计时器管理器
class MultiStopwatchManager {
    constructor() {
        // --- Debug instrumentation ---
        this.__debug = {
            enabled: true,
            tag: 'JITTER',
            updateMainPageUICount: 0,
            lastUpdateMainPageUITs: 0,
            statusHistory: new Map(), // activity -> { last: 'running|paused|stopped', ts: number, flipsIn1s: number }
        };
        this.__d = (...args) => {
            if (!this.__debug.enabled) return;
            try {
                console.log(`[${this.__debug.tag}]`, ...args);
            } catch (_) {}
        };
        // 简单的动作护栏，防止DOM切换期间的误触
        this.__actionGuardUntil = 0;
        // (debug-only) no behavior switches here
        // --- end debug ---
        this.timers = new Map(); // 存储所有活动的计时器
        this.updateIntervals = new Map(); // 存储更新间隔ID
        this.supabase = null; // Supabase 客户端
        this.initSupabase();
        this.loadData().then(() => {
            this.initMainPageUI();
        });
    }

    // 初始化 Supabase 客户端
    initSupabase() {
        console.log('🚀 MultiStopwatchManager: 开始初始化 Supabase...');
        console.log('🔍 检查 window.supabaseClient:', !!window.supabaseClient);
        
        try {
            if (window.supabaseClient && window.supabaseClient.init()) {
                this.supabase = window.supabaseClient.getClient();
                console.log('✅ MultiStopwatchManager: Supabase 客户端初始化成功');
                console.log('🔗 Supabase 客户端对象:', this.supabase);
            } else {
                console.warn('⚠️ MultiStopwatchManager: Supabase 客户端初始化失败');
                console.log('❌ 可能的原因: supabaseClient 未定义或 init() 返回 false');
            }
        } catch (error) {
            console.error('❌ MultiStopwatchManager: Supabase 初始化失败:', error);
        }
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
        console.log(`▶️ 开始计时活动: "${activityName}"`);
        this.__d('start()', { activityName, intervalsBefore: this.updateIntervals.size });
        
        const timer = this.getTimer(activityName);
        if (!timer.isRunning) {
            timer.startTime = Date.now() - timer.elapsedTime;
            timer.isRunning = true;
            
            // 启动实时更新间隔
            if (this.updateIntervals.has(activityName)) {
                clearInterval(this.updateIntervals.get(activityName));
            }
            
                            const intervalId = setInterval(() => {
                    // *** 关键修复：每次执行前检查最新状态，如果已暂停则自杀 ***
                    const latestData = localStorage.getItem('multiStopwatchData');
                    if (latestData) {
                        try {
                            const parsed = JSON.parse(latestData);
                            const latestTimer = parsed[activityName];
                            if (!latestTimer || !latestTimer.isRunning) {
                                console.log(`🔫 检测到"${activityName}"已暂停，interval自杀`);
                                clearInterval(intervalId);
                                this.updateIntervals.delete(activityName);
                                return;
                            }
                        } catch (e) {
                            console.warn('检查状态失败，停止interval:', e);
                            clearInterval(intervalId);
                            this.updateIntervals.delete(activityName);
                            return;
                        }
                    }
                    this.updateTimerCard(activityName);
                }, 100); // 每100ms更新一次
            
            this.updateIntervals.set(activityName, intervalId);
            console.log(`⏱️ 已启动"${activityName}"的更新间隔`);
            this.__d('start()', { activityName, intervalsAfter: this.updateIntervals.size });
            
            this.saveData();
            this.updateMainPageUI();
            
            console.log(`✅ 活动 "${activityName}" 已开始计时`);
        } else {
            console.log(`⚠️ 活动 "${activityName}" 已经在运行中`);
        }
    }

    // 停止计时
    stop(activityName) {
        console.log(`⏸️ 尝试停止活动 "${activityName}"`);
        this.__d('stop()', { activityName, intervalsBefore: this.updateIntervals.size });
        const timer = this.getTimer(activityName);
        if (timer.isRunning) {
            // 立即标记为非运行状态，防止状态不一致
            timer.isRunning = false;
            const endTime = Date.now();
            timer.elapsedTime = endTime - timer.startTime;
            
            // 立即清除所有相关的更新循环
            if (this.updateIntervals.has(activityName)) {
                clearInterval(this.updateIntervals.get(activityName));
                this.updateIntervals.delete(activityName);
                console.log(`⏹️ 已清除"${activityName}"的更新间隔`);
            }
            this.__d('stop() after clearInterval', { activityName, intervalsAfter: this.updateIntervals.size });
            
            // *** 关键修复：立即清除currentActivity记录 ***
            this.clearCurrentActivityRecord();
            
            // 立即保存状态
            this.saveData();
            // 广播storage事件，强制所有页面同步
            try {
                localStorage.setItem('multiStopwatchData', localStorage.getItem('multiStopwatchData'));
            } catch (e) { console.warn('storage广播失败', e); }
            // 立即更新显示
            this.updateTimerCard(activityName);
            console.log(`✅ 活动 "${activityName}" 已停止，用时 ${Math.floor(timer.elapsedTime / 1000)} 秒`);
            // *** 修复：不在stop函数中自动保存记录，避免与complete按钮重复 ***
            // 注释掉自动保存逻辑，让用户手动点击"完成"按钮来保存记录
            // if (timer.elapsedTime >= 60000) {
            //     this.completeActivity(activityName, timer.startTime, endTime);
            // }
            // 延迟更新主界面UI，确保状态已保存
            setTimeout(() => {
                this.__d('stop() -> delayed updateMainPageUI(50ms)');
                this.updateMainPageUI();
            }, 50);
        } else {
            console.log(`⚠️ 活动 "${activityName}" 未在运行中`);
        }
    }

    // 重置计时器
    reset(activityName) {
        console.log(`🔄 重置计时器: "${activityName}"`);
        
        const timer = this.getTimer(activityName);
        
        // 清除更新间隔
        if (this.updateIntervals.has(activityName)) {
            clearInterval(this.updateIntervals.get(activityName));
            this.updateIntervals.delete(activityName);
            console.log(`⏹️ 已清除"${activityName}"的更新间隔`);
        }
        
        // 重置计时器状态
        timer.startTime = null;
        timer.elapsedTime = 0;
        timer.isRunning = false;
        timer.laps = [];
        
        console.log(`✅ 计时器"${activityName}"已重置`);
        
        this.saveData();
        this.updateMainPageUI();
    }

    // 删除计时器
    async delete(activityName) {
        if (this.timers.has(activityName)) {
            // 停止更新间隔
            if (this.updateIntervals.has(activityName)) {
                clearInterval(this.updateIntervals.get(activityName));
                this.updateIntervals.delete(activityName);
            }
            
            // 从Supabase数据库中删除记录
            if (this.supabase) {
                try {
                    const { data: { user } } = await this.supabase.auth.getUser();
                    if (user) {
                        const { error } = await this.supabase
                            .from('multi_timers')
                            .delete()
                            .eq('user_id', user.id)
                            .eq('timer_name', activityName);
                        
                        if (error) {
                            console.error('❌ 删除计时器记录失败:', error);
                        } else {
                            console.log('✅ 计时器记录已从数据库删除');
                        }
                    }
                } catch (error) {
                    console.error('❌ 删除计时器记录时出错:', error);
                }
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
            
            // 添加Enter键快捷启动
            activityNameInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    // 添加按钮反馈动画
                    newStartBtn.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        newStartBtn.style.transform = '';
                    }, 150);
                    
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
                }
            });
            
            // 添加输入框焦点状态反馈
            activityNameInput.addEventListener('focus', () => {
                newStartBtn.style.boxShadow = '0 6px 20px rgba(74, 144, 226, 0.4)';
            });
            
            activityNameInput.addEventListener('blur', () => {
                newStartBtn.style.boxShadow = '';
            });
        }

        // 隐藏旧的当前活动区域
        this.hideOldCurrentActivity();

        // 添加页面焦点监听，确保页面间状态同步
        window.addEventListener('focus', () => {
            console.log('🎯 页面重新获得焦点，刷新状态...');
            this.loadData();
            this.updateMainPageUI();
        });

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
        // 节流，避免短时间内重复重建导致抖动
        const nowTs = Date.now();
        if (this.__lastUIUpdate && (nowTs - this.__lastUIUpdate) < 150) {
            this.__d('updateMainPageUI() throttled', { sinceLastMs: nowTs - this.__lastUIUpdate });
            return;
        }
        this.__lastUIUpdate = nowTs;
        // Debug: count frequency and detect bursts
        const delta = nowTs - (this.__debug.lastUpdateMainPageUITs || 0);
        this.__debug.updateMainPageUICount++;
        this.__debug.lastUpdateMainPageUITs = nowTs;
        this.__d('updateMainPageUI()', { count: this.__debug.updateMainPageUICount, sinceLastMs: delta, intervals: this.updateIntervals.size });
        
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

        // 增量更新：保留已存在的卡片，只为新增活动创建卡片
        const existingCards = new Map();
        Array.from(timersContainer.querySelectorAll('.timer-card')).forEach(card => {
            existingCards.set(card.dataset.activity, card);
        });

        const activitySet = new Set(activities);

        activities.forEach(activityName => {
            const timer = this.getTimer(activityName);
            let card = existingCards.get(activityName);
            if (!card) {
                card = this.createTimerCard(timer);
                timersContainer.appendChild(card);
            } else {
                // 就地更新状态与时间，不重建节点
                this.updateTimerCard(activityName);
            }
        });

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
        card.dataset.createdAt = String(Date.now());
        this.__d('createTimerCard()', { activityName: timer.name, status: this.getStatusClass(timer), createdAt: card.dataset.createdAt });

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
                <button class="timer-btn secondary" data-action="stop">暂停</button>
                <button class="timer-btn primary" data-action="lap">分段</button>
                <button class="timer-btn primary" data-action="complete">完成</button>
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
                e.preventDefault();
                e.stopPropagation();
                if (Date.now() < this.__actionGuardUntil) {
                    this.__d('click ignored by guard', { activity: timer.name });
                    return;
                }
                
                const action = button.dataset.action;
                console.log(`按钮点击 - 活动: "${timer.name}", 操作: "${action}"`);
                
                this.handleButtonAction(action, timer);
            });
        });
    }

    // 处理按钮操作
    handleButtonAction(action, timer) {
        console.log(`🔘 主界面按钮操作: ${action} - ${timer.name}`);
        this.__d('handleButtonAction()', { action, activityName: timer.name, intervals: this.updateIntervals.size, running: timer.isRunning, elapsed: timer.elapsedTime });
        // 在按钮操作期间短暂开启护栏，防止DOM重绘引发的误点击
        this.__actionGuardUntil = Date.now() + 400;
        
        // 禁用所有相关按钮，防止重复点击
        const card = document.querySelector(`.timer-card[data-activity="${timer.name}"]`);
        if (card) {
            const buttons = card.querySelectorAll('.timer-btn');
            buttons.forEach(btn => btn.disabled = true);
        }
        
        switch (action) {
            case 'start':
                this.start(timer.name);
                this.showNotification(`"${timer.name}" 已开始计时`);
                break;
                
            case 'stop':
                console.log(`⏸️ 主界面暂停操作: ${timer.name}`);
                this.stop(timer.name);
                this.showNotification(`"${timer.name}" 已暂停`);
                break;
                
            case 'lap':
                this.addLap(timer.name);
                this.showNotification(`已添加第 ${timer.laps.length} 个分段`);
                break;
                
            case 'complete':
                if (confirm(`确定要完成"${timer.name}"活动吗？这将保存活动记录并重置计时器。`)) {
                    this.completeActivityAndReset(timer.name);
                    this.showNotification(`"${timer.name}" 活动已完成并保存`);
                }
                break;
                
            case 'reset':
                if (confirm(`确定要重置"${timer.name}"的计时器吗？这将清除当前计时数据。`)) {
                    this.reset(timer.name);
                    this.showNotification(`"${timer.name}" 计时器已重置`);
                }
                break;
                
            case 'delete':
                if (confirm(`确定要删除"${timer.name}"计时器吗？删除后将无法恢复。`)) {
                    this.delete(timer.name).then(() => {
                        this.showNotification(`"${timer.name}" 计时器已删除`);
                    });
                }
                break;
        }
        
        // 延迟重新启用按钮和更新UI，确保状态稳定
        setTimeout(() => {
            this.startRealTimeUpdate(); // 重新检查所有更新循环
            this.updateMainPageUI();
            
            // 重新启用按钮
            if (card) {
                const buttons = card.querySelectorAll('.timer-btn');
                buttons.forEach(btn => btn.disabled = false);
            }
            
            console.log(`✅ 主界面操作"${action}"完成，UI已更新`);
            this.__d('handleButtonAction() done', { action, activityName: timer.name, intervals: this.updateIntervals.size, running: this.getTimer(timer.name)?.isRunning });
        }, 300); // 增加延迟时间，确保状态稳定
    }

    // 显示通知
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    // 启动实时更新
    startRealTimeUpdate() {
        console.log('🔄 检查并启动实时更新...');
        this.__d('startRealTimeUpdate() clearing', { existingIntervals: Array.from(this.updateIntervals.keys()) });
        
        // 先清除所有现有的更新循环
        this.updateIntervals.forEach((intervalId, activityName) => {
            clearInterval(intervalId);
            console.log(`⏹️ 清除"${activityName}"的旧更新间隔`);
        });
        this.updateIntervals.clear();
        
        // 为运行中的计时器启动更新
        this.timers.forEach((timer, activityName) => {
            if (timer.isRunning) {
                console.log(`⏱️ 为运行中的活动"${activityName}"启动更新间隔`);
                
                const intervalId = setInterval(() => {
                    // *** 关键修复：每次执行前检查最新状态，如果已暂停则自杀 ***
                    const latestData = localStorage.getItem('multiStopwatchData');
                    if (latestData) {
                        try {
                            const parsed = JSON.parse(latestData);
                            const latestTimer = parsed[activityName];
                            if (!latestTimer || !latestTimer.isRunning) {
                                console.log(`🔫 实时更新检测到"${activityName}"已暂停，interval自杀`);
                                clearInterval(intervalId);
                                this.updateIntervals.delete(activityName);
                                return;
                            }
                        } catch (e) {
                            console.warn('实时更新检查状态失败，停止interval:', e);
                            clearInterval(intervalId);
                            this.updateIntervals.delete(activityName);
                            return;
                        }
                    }
                    this.updateTimerCard(activityName);
                }, 100); // 每100ms更新一次
                
                this.updateIntervals.set(activityName, intervalId);
            }
        });
        
        console.log(`✅ 实时更新检查完成，当前活跃间隔数: ${this.updateIntervals.size}`);
        this.__d('startRealTimeUpdate() done', { activeIntervals: Array.from(this.updateIntervals.keys()) });
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
        
        // 添加防抖机制，避免频繁状态切换
        const cardActivityName = card.dataset.activity;
        const lastUpdateKey = `lastUpdate_${cardActivityName}`;
        const now = Date.now();
        
        if (!this[lastUpdateKey]) {
            this[lastUpdateKey] = 0;
        }
        
        // 如果距离上次更新不足200ms，且不是从运行状态变为停止状态，则跳过更新
        if (now - this[lastUpdateKey] < 200 && !(cardStatusClass === 'running' && currentStatusClass !== 'running')) {
            // 只更新时间，不更新状态和按钮
            if (!timer.isRunning && timer.elapsedTime > 0) {
                const timeElement = card.querySelector('.timer-time');
                if (timeElement) {
                    timeElement.textContent = this.formatTime(timer.elapsedTime);
                }
            }
            return;
        }
        
        if (currentStatusClass !== cardStatusClass) {
            // 状态发生变化，需要更新
            this[lastUpdateKey] = now;
            // Debug: detect rapid flips
            const hist = this.__debug.statusHistory.get(activityName) || { last: null, ts: 0, flipsIn1s: 0 };
            if (hist.last && hist.last !== currentStatusClass) {
                const within1s = now - (hist.ts || 0) <= 1000;
                hist.flipsIn1s = within1s ? (hist.flipsIn1s + 1) : 1;
            } else if (!hist.last) {
                hist.flipsIn1s = 0;
            }
            hist.last = currentStatusClass;
            hist.ts = now;
            this.__debug.statusHistory.set(activityName, hist);
            if (hist.flipsIn1s >= 2) {
                this.__d('Oscillation detected', { activityName, flipsIn1s: hist.flipsIn1s, from: cardStatusClass, to: currentStatusClass });
            } else {
                this.__d('Status change', { activityName, from: cardStatusClass, to: currentStatusClass });
            }
            
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
                // 使用requestAnimationFrame延迟更新，避免闪烁
                requestAnimationFrame(() => {
                    this.__d('Re-render actions', { activityName, status: currentStatusClass });
                    actionsContainer.innerHTML = this.getActionButtons(timer);
                    this.addButtonListeners(card, timer);
                    // DOM切换后短时间禁用点击，避免一次点击被新按钮吞掉
                    actionsContainer.style.pointerEvents = 'none';
                    setTimeout(() => { actionsContainer.style.pointerEvents = ''; }, 200);
                });
            }
        } else {
            // 状态没有变化，只更新状态文本（不重新绑定按钮事件）
            const statusText = card.querySelector('.timer-status span:last-child');
            if (statusText) {
                statusText.textContent = this.getStatusText(timer);
            }
        }
        
        // 如果计时器已暂停，确保时间显示固定（不跳动）
        if (!timer.isRunning && timer.elapsedTime > 0) {
            const timeElement = card.querySelector('.timer-time');
            if (timeElement) {
                timeElement.textContent = this.formatTime(timer.elapsedTime);
            }
        }
    }

    // 保存数据到本地存储和 Supabase
    async saveData() {
        console.log('\n💾 ========== 开始保存数据 ==========');
        console.log(`📱 设备: ${navigator.userAgent.includes('Mobile') ? '手机' : '电脑'}`);
        console.log(`⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
        
        const data = {};
        const now = Date.now();
        this.timers.forEach((timer, name) => {
            // 标记本地最新更新时间，避免被较旧的云端状态覆盖
            timer.lastUpdate = now;
            data[name] = { ...timer };
            console.log(`📋 准备保存计时器: ${name}`, {
                运行中: timer.isRunning,
                已用时: Math.floor((timer.elapsedTime || 0) / 1000) + '秒'
            });
        });
        localStorage.setItem('multiStopwatchData', JSON.stringify(data));
        console.log(`✅ 已保存到本地存储 (${this.timers.size} 个计时器)`);
        
        // 同时保存兼容旧统计系统的数据格式
        this.saveCompatibleData();
        
        // 如果 Supabase 连接成功，也保存到云端
        if (this.supabase) {
            try {
                console.log('\n☁️ 开始同步到云端...');
                
                // 获取当前用户
                const { data: { user } } = await this.supabase.auth.getUser();
                if (!user) {
                    console.warn('⚠️ 用户未登录，跳过云端同步');
                    return;
                }
                
                console.log(`👤 当前用户: ${user.email}`);
                
                const timersToSync = Array.from(this.timers.entries()).map(([name, timer]) => {
                    const record = {
                        id: timer.id || crypto.randomUUID(), // 使用真正的 UUID
                        user_id: user.id, // 关联用户ID
                        timer_name: name,
                        start_time: timer.startTime ? new Date(timer.startTime).toISOString() : null,
                        elapsed_time_ms: timer.elapsedTime || 0,
                        is_running: timer.isRunning || false,
                        laps: timer.laps || [],
                        created_at: new Date(timer.created).toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    console.log(`☁️ 将同步到云端: ${name}`, {
                        运行中: record.is_running,
                        已用时: Math.floor(record.elapsed_time_ms / 1000) + '秒'
                    });
                    
                    return record;
                });
                
                // 保存多计时器数据
                const { data: supabaseData, error } = await this.supabase
                    .from('multi_timers')
                    .upsert(timersToSync, {
                        onConflict: 'user_id,timer_name' // 使用 user_id 和 timer_name 作为冲突检测字段
                    });
                
                if (error) {
                    console.error('❌ 保存到 Supabase 失败:', error);
                } else {
                    console.log(`✅ 数据已同步到 Supabase (${timersToSync.length} 个计时器)`);
                    console.log(`📢 其他设备刷新后将看到这些变化`);
                }
                
            } catch (error) {
                console.error('❌ Supabase 同步异常:', error);
            }
        } else {
            console.log('⚠️ Supabase 未初始化，跳过云端同步');
        }
        
        console.log(`========== 保存数据结束 ==========\n`);
    }

    // *** 关键修复：清除当前活动记录 ***
    clearCurrentActivityRecord() {
        console.log('🧹 [FIXED] 清除currentActivity记录，防止统计系统误认为还在运行');
        
        const compatibleData = {
            activities: JSON.parse(localStorage.getItem('timeTrackerActivities') || '[]'),
            currentActivity: null  // 强制设为null
        };
        
        localStorage.setItem('timeTrackerData', JSON.stringify(compatibleData));
        console.log('✅ [FIXED] currentActivity记录已清除');
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
    async completeActivity(activityName, startTime, endTime) {
        console.log(`\n💾 ========== 保存活动记录 ==========`);
        console.log(`📌 活动: "${activityName}"`);
        
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

        // *** 关键修复：使用计时器的实际运行时间，而不是开始到结束的总时间 ***
        const timer = this.getTimer(activityName);
        const actualDuration = timer.elapsedTime; // 这是实际的活动时间（不包括暂停期间）
        
        // 计算实际的活动开始和结束时间
        // 开始时间：从计时器开始时间计算
        const actualStartTime = new Date(timer.startTime || startTime);
        // 结束时间：开始时间 + 实际持续时间
        const actualEndTime = new Date(actualStartTime.getTime() + actualDuration);

        // 添加新记录
        const activityRecord = {
            id: `stopwatch_${activityName}_${Date.now()}`,
            activityName: activityName,
            startTime: actualStartTime,
            endTime: actualEndTime,
            duration: Math.floor(actualDuration / (1000 * 60)) // 使用实际持续时间
        };

        completedActivities.unshift(activityRecord);
        
        // 保存更新后的记录到本地
        localStorage.setItem('timeTrackerActivities', JSON.stringify(completedActivities));
        console.log(`✅ 已保存到本地存储 (持续 ${activityRecord.duration} 分钟)`);
        
        // 更新兼容数据
        this.saveCompatibleData();

        // *** 核心修复：同步活动记录到 Supabase ***
        if (this.supabase) {
            try {
                console.log(`☁️ 开始同步活动记录到云端...`);
                
                // 获取当前用户
                const { data: { user } } = await this.supabase.auth.getUser();
                if (!user) {
                    console.warn('⚠️ 用户未登录，活动记录不会同步到云端');
                    console.log(`========== 活动记录保存结束 (仅本地) ==========\n`);
                    return;
                }
                
                console.log(`👤 当前用户: ${user.email}`);
                
                // 保存到 activities 表（使用 insert 而不是 upsert，因为每次都是新记录）
                const { error } = await this.supabase
                    .from('activities')
                    .insert({
                        id: activityRecord.id,
                        user_id: user.id,
                        activity_name: activityRecord.activityName,
                        start_time: actualStartTime.toISOString(),
                        end_time: actualEndTime.toISOString(),
                        duration_minutes: activityRecord.duration,
                        note: '',
                        color: this.getColorForActivity(activityRecord.activityName),
                        created_at: actualStartTime.toISOString(),
                        updated_at: new Date().toISOString()
                    });
                
                if (error) {
                    console.error('❌ 保存活动记录到云端失败:', error);
                } else {
                    console.log(`✅ 活动记录已同步到云端！`);
                    console.log(`📢 其他设备刷新后将看到这条记录`);
                }
                
            } catch (error) {
                console.error('❌ 云端同步异常:', error);
            }
        } else {
            console.warn('⚠️ Supabase 未初始化，活动记录不会同步到云端');
        }
        
        console.log(`========== 活动记录保存结束 ==========\n`);
    }
    
    // 根据活动名称生成颜色
    getColorForActivity(activityName) {
        // 简单的哈希函数生成颜色
        let hash = 0;
        for (let i = 0; i < activityName.length; i++) {
            hash = activityName.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const colors = [
            '#3498db', // 蓝色
            '#2ecc71', // 绿色
            '#e74c3c', // 红色
            '#f39c12', // 橙色
            '#9b59b6', // 紫色
            '#1abc9c', // 青色
            '#d35400', // 深橙色
            '#2c3e50'  // 深蓝色
        ];
        
        return colors[Math.abs(hash) % colors.length];
    }

    // 完成活动并重置计时器
    async completeActivityAndReset(activityName) {
        console.log(`\n🏁 ========== 开始完成活动 ==========`);
        console.log(`📌 活动名称: "${activityName}"`);
        console.log(`📱 设备: ${navigator.userAgent.includes('Mobile') ? '手机' : '电脑'}`);
        console.log(`⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
        
        const timer = this.getTimer(activityName);
        const endTime = Date.now();
        
        console.log(`📊 当前计时器状态:`, {
            isRunning: timer.isRunning,
            elapsedTime: timer.elapsedTime,
            startTime: timer.startTime,
            laps: timer.laps?.length || 0
        });
        
        // 首先停止计时器的实时更新
        if (this.updateIntervals.has(activityName)) {
            clearInterval(this.updateIntervals.get(activityName));
            this.updateIntervals.delete(activityName);
            console.log(`⏹️ 已清除"${activityName}"的更新间隔`);
        }
        
        // 如果计时器正在运行，先停止它
        if (timer.isRunning) {
            console.log(`⏸️ 停止正在运行的计时器: "${activityName}"`);
            timer.elapsedTime = endTime - timer.startTime;
            timer.isRunning = false;
        }
        
        // 只有当计时器有时间记录时才保存
        if (timer.elapsedTime > 0) {
            // *** 关键修复：使用计时器的实际开始时间和实际持续时间 ***
            const actualStartTime = timer.startTime || (endTime - timer.elapsedTime);
            const actualEndTime = actualStartTime + timer.elapsedTime; // 开始时间 + 实际持续时间
            
            console.log(`💾 准备保存活动记录:`, {
                activityName,
                实际用时秒: Math.floor(timer.elapsedTime / 1000),
                开始时间: new Date(actualStartTime).toLocaleString('zh-CN'),
                结束时间: new Date(actualEndTime).toLocaleString('zh-CN')
            });
            
            // 保存活动记录（异步等待）
            await this.completeActivity(activityName, actualStartTime, actualEndTime);
            console.log(`✅ 活动记录保存完成`);
        }
        
        // *** 关键步骤：从云端删除计时器状态 ***
        console.log(`🗑️ 准备从云端删除计时器状态...`);
        await this.deleteTimerFromCloud(activityName);
        
        // 重置计时器（本地）
        console.log(`🔄 重置本地计时器: "${activityName}"`);
        this.reset(activityName);
        
        // 显示完成提示
        const minutes = Math.floor((timer.elapsedTime || 0) / (1000 * 60));
        const seconds = Math.floor(((timer.elapsedTime || 0) % (1000 * 60)) / 1000);
        
        let timeMessage = '';
        if (minutes > 0) {
            timeMessage = `${minutes} 分钟 ${seconds} 秒`;
        } else if (seconds > 0) {
            timeMessage = `${seconds} 秒`;
        } else {
            timeMessage = '0 秒';
        }
        
        console.log(`✅ 活动"${activityName}"已完成，总用时: ${timeMessage}`);
        console.log(`========== 完成活动结束 ==========\n`);
        
        if (timer.elapsedTime > 0) {
            alert(`活动"${activityName}"已完成！\n总用时: ${timeMessage}\n记录已保存到统计中。`);
        } else {
            alert(`活动"${activityName}"已重置。`);
        }
    }

    // 从云端删除计时器状态
    async deleteTimerFromCloud(activityName) {
        if (!this.supabase) {
            console.warn('⚠️ Supabase 未初始化，无法删除云端计时器');
            return;
        }

        try {
            console.log(`🗑️ 开始从云端删除计时器: "${activityName}"`);
            
            // 获取当前用户
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                console.warn('⚠️ 用户未登录，无法删除云端计时器');
                return;
            }

            console.log(`👤 当前用户: ${user.email} (${user.id})`);

            // 从 multi_timers 表中删除
            const { error } = await this.supabase
                .from('multi_timers')
                .delete()
                .eq('user_id', user.id)
                .eq('timer_name', activityName);

            if (error) {
                console.error('❌ 删除云端计时器失败:', error);
            } else {
                console.log(`✅ 成功从云端删除计时器: "${activityName}"`);
                console.log(`📢 其他设备刷新后将不会再看到这个计时器`);
            }
        } catch (error) {
            console.error('❌ 删除云端计时器异常:', error);
        }
    }

    // 从本地存储和 Supabase 加载数据
    async loadData() {
        console.log('\n🔍 ========== 开始加载数据 ==========');
        console.log(`📱 设备: ${navigator.userAgent.includes('Mobile') ? '手机' : '电脑'}`);
        console.log(`⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
        
        // 首先从本地存储加载
        const data = localStorage.getItem('multiStopwatchData');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                console.log(`📦 从本地存储加载了 ${Object.keys(parsed).length} 条计时器`);
                Object.entries(parsed).forEach(([name, timer]) => {
                    this.timers.set(name, {
                        ...timer
                    });
                    console.log(`📋 本地计时器: ${name}`, {
                        运行中: timer.isRunning,
                        已用时: Math.floor((timer.elapsedTime || 0) / 1000) + '秒',
                        最后更新: timer.lastUpdate ? new Date(timer.lastUpdate).toLocaleString('zh-CN') : '未知'
                    });
                    // 如果计时器正在运行，重启更新间隔
                    if (timer.isRunning) {
                        console.log(`🚀 恢复本地运行状态: ${name}`);
                        const intervalId = setInterval(() => {
                            this.updateTimerCard(name);
                        }, 100);
                        this.updateIntervals.set(name, intervalId);
                    }
                });
                const running = Array.from(this.timers.entries()).filter(([, t]) => t.isRunning).map(([n]) => n);
                this.__d('loadData() summary', { timers: this.timers.size, running });
            } catch (error) {
                console.error('❌ 加载本地数据失败:', error);
            }
        } else {
            console.log('⚠️ 没有找到本地存储的数据');
        }
        
        // 如果 Supabase 连接成功，尝试从云端加载最新数据
        if (this.supabase) {
            try {
                console.log('\n☁️ 开始从云端加载数据...');
                
                // 获取当前用户
                const { data: { user } } = await this.supabase.auth.getUser();
                if (!user) {
                    console.warn('⚠️ 用户未登录，跳过云端同步');
                    return;
                }
                
                console.log(`👤 当前用户: ${user.email}`);
                
                const { data: supabaseData, error } = await this.supabase
                    .from('multi_timers')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });
                
                if (error) {
                    console.error('❌ 从 Supabase 加载失败:', error);
                } else if (supabaseData && supabaseData.length > 0) {
                    console.log(`☁️ 从云端加载了 ${supabaseData.length} 条计时器记录`);
                    
                    // 转换数据格式并合并
                    supabaseData.forEach(timerData => {
                        const name = timerData.timer_name;
                        const existingTimer = this.timers.get(name);
                        
                        const cloudUpdatedAt = new Date(timerData.updated_at);
                        const localUpdatedAt = existingTimer?.lastUpdate ? new Date(existingTimer.lastUpdate) : new Date(0);
                        
                        console.log(`\n🔄 比较计时器: "${name}"`);
                        console.log(`  ☁️  云端状态:`, {
                            运行中: timerData.is_running,
                            已用时: Math.floor((timerData.elapsed_time_ms || 0) / 1000) + '秒',
                            更新时间: cloudUpdatedAt.toLocaleString('zh-CN')
                        });
                        
                        if (existingTimer) {
                            console.log(`  💻 本地状态:`, {
                                运行中: existingTimer.isRunning,
                                已用时: Math.floor((existingTimer.elapsedTime || 0) / 1000) + '秒',
                                更新时间: localUpdatedAt.toLocaleString('zh-CN')
                            });
                        } else {
                            console.log(`  💻 本地无此计时器`);
                        }
                        
                        // 如果本地没有这个计时器，或者云端数据更新，则使用云端数据
                        if (!existingTimer || cloudUpdatedAt > localUpdatedAt) {
                            const decision = !existingTimer ? '本地无数据' : '云端更新';
                            console.log(`  ✅ 决定: 使用云端数据 (${decision})`);
                            
                            const cloudTimer = {
                                id: timerData.id, // 保存云端 ID
                                name: name,
                                startTime: timerData.start_time ? new Date(timerData.start_time).getTime() : null,
                                elapsedTime: timerData.elapsed_time_ms || 0,
                                isRunning: timerData.is_running || false,
                                laps: timerData.laps || [],
                                created: timerData.created_at ? new Date(timerData.created_at).getTime() : Date.now(),
                                lastUpdate: cloudUpdatedAt.getTime()
                            };
                            
                            this.timers.set(name, cloudTimer);
                            
                            // 如果计时器正在运行，重启更新间隔
                            if (cloudTimer.isRunning) {
                                console.log(`  🚀 启动云端计时器: ${name}`);
                                const intervalId = setInterval(() => {
                                    this.updateTimerCard(name);
                                }, 100);
                                this.updateIntervals.set(name, intervalId);
                            }
                        } else {
                            console.log(`  ⏭️  决定: 保留本地数据 (本地更新)`);
                        }
                    });
                    
                    console.log(`\n✅ 云端数据加载完成`);
                } else {
                    console.log('☁️ 云端没有计时器记录');
                }
                
            } catch (error) {
                console.error('❌ 从 Supabase 加载数据失败:', error);
            }
        } else {
            console.log('⚠️ Supabase 未初始化，跳过云端加载');
        }
        
        console.log(`========== 数据加载结束 ==========\n`);
    }

    // 清理资源
    cleanup() {
        this.updateIntervals.forEach((intervalId) => {
            clearInterval(intervalId);
        });
        this.updateIntervals.clear();
    }
}

// 避免重复实例化：如果 combined.js 已经创建了实例，这里复用
// 全局实例（仅在未存在时创建）
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.multiStopwatchManager) {
            window.multiStopwatchManager = new MultiStopwatchManager();
            console.log('🆕 Created MultiStopwatchManager instance (fixed.js)');
        } else {
            console.log('♻️ Reusing existing MultiStopwatchManager instance (from combined.js)');
        }
    }, 100);
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (multiStopwatchManager) {
        multiStopwatchManager.cleanup();
    }
}); 

    // 页面同步逻辑
    if (typeof window !== 'undefined') {
        window.addEventListener('focus', () => {
            if (window.multiStopwatchManager) {
                window.multiStopwatchManager.loadData().then(() => {
                    window.multiStopwatchManager.updateMainPageUI();
                    window.multiStopwatchManager.startRealTimeUpdate();
                    console.log('🔄 页面focus，已强制同步状态');
                });
            }
        });
        window.addEventListener('storage', (e) => {
            if (e.key === 'multiStopwatchData' && window.multiStopwatchManager) {
                window.multiStopwatchManager.loadData().then(() => {
                    window.multiStopwatchManager.updateMainPageUI();
                    window.multiStopwatchManager.startRealTimeUpdate();
                    console.log('🔄 storage事件，已强制同步状态');
                });
            }
        });
        // 页面初次加载也同步一次
        window.addEventListener('DOMContentLoaded', () => {
            if (window.multiStopwatchManager) {
                window.multiStopwatchManager.loadData().then(() => {
                    window.multiStopwatchManager.updateMainPageUI();
                    window.multiStopwatchManager.startRealTimeUpdate();
                    console.log('🔄 DOMContentLoaded，已强制同步状态');
                });
            }
        });
    } 
