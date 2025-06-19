// 合并所有JavaScript功能到一个文件
// 全局变量
let activities = [];
let currentActivity = null;

// 统计视图类型
const STATS_VIEW = {
    DAILY_DISTRIBUTION: 'daily_distribution',  // 当日所有活动分布
    ACTIVITY_DAILY: 'activity_daily',          // 特定活动的每日分布
    ACTIVITY_TOTAL: 'activity_total',          // 特定活动的累计时间
    ANNUAL_TABLE: 'annual_table'               // 年度统计表
};

// 当前统计视图类型
let currentStatsView = STATS_VIEW.DAILY_DISTRIBUTION;
// 当前选中的活动（用于活动每日统计和累计统计）
let selectedActivity = null;

// DOM 元素
let currentTimeElement;
let activityNameInput;
let startButton;
let endButton;
let noActivityElement;
let activityDetailsElement;
let currentActivityNameElement;
let startTimeElement;
let durationElement;
let activityListElement;
let noRecordsElement;

// 统计相关DOM元素
let statsDateInput;
let showStatsButton;
let timeChartCanvas;
let noStatsElement;
let statsSummaryElement;

// 统计视图相关DOM元素
let dailyDistributionBtn;
let activityDailyBtn;
let activityTotalBtn;
let annualTableBtn;
let activitySelector;
let activitySelect;
let annualTableControls;
let annualTableContainer;
let dateSelector;

// 图表相关变量
let timeChart = null;

// 初始化DOM元素引用
function initDOMElements() {
    currentTimeElement = document.getElementById('current-time');
    activityNameInput = document.getElementById('activity-name');
    startButton = document.getElementById('start-btn');
    endButton = document.getElementById('end-btn');
    noActivityElement = document.getElementById('no-activity');
    activityDetailsElement = document.getElementById('activity-details');
    currentActivityNameElement = document.getElementById('current-activity-name');
    startTimeElement = document.getElementById('start-time');
    durationElement = document.getElementById('duration');
    activityListElement = document.getElementById('activity-list');
    noRecordsElement = document.getElementById('no-records');

    // 统计相关DOM元素
    statsDateInput = document.getElementById('stats-date');
    showStatsButton = document.getElementById('show-stats-btn');
    timeChartCanvas = document.getElementById('time-chart');
    noStatsElement = document.getElementById('no-stats');
    statsSummaryElement = document.getElementById('stats-summary');

    // 统计视图相关DOM元素
    dailyDistributionBtn = document.getElementById('daily-distribution-btn');
    activityDailyBtn = document.getElementById('activity-daily-btn');
    activityTotalBtn = document.getElementById('activity-total-btn');
    annualTableBtn = document.getElementById('annual-table-btn');
    activitySelector = document.getElementById('activity-selector');
    activitySelect = document.getElementById('activity-select');
    annualTableControls = document.getElementById('annual-table-controls');
    annualTableContainer = document.getElementById('annual-table-container');
    dateSelector = document.querySelector('.date-selector');
}

// 初始化应用
function initApp() {
    // 初始化DOM元素引用
    initDOMElements();
    
    // 从本地存储加载数据
    loadData();
    
    // 设置当前时间显示
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 如果有正在进行的活动，更新UI并开始计时
    if (currentActivity) {
        updateCurrentActivityUI();
        startDurationTimer();
    }
    
    // 更新活动列表
    updateActivityList();
    
    // 设置统计日期默认为今天
    const today = new Date();
    statsDateInput.valueAsDate = today;
    
    // 更新活动选择器
    updateActivitySelector();
    
    // 添加事件监听器
    startButton.addEventListener('click', startActivity);
    endButton.addEventListener('click', endActivity);
    showStatsButton.addEventListener('click', showStatistics);
    
    // 添加统计视图切换事件监听器
    dailyDistributionBtn.addEventListener('click', () => updateStatsView(STATS_VIEW.DAILY_DISTRIBUTION));
    activityDailyBtn.addEventListener('click', () => {
        if (activitySelect.value) {
            updateStatsView(STATS_VIEW.ACTIVITY_DAILY, activitySelect.value);
        }
    });
    activityTotalBtn.addEventListener('click', () => updateStatsView(STATS_VIEW.ACTIVITY_TOTAL));
    annualTableBtn.addEventListener('click', () => updateStatsView(STATS_VIEW.ANNUAL_TABLE));
    activitySelect.addEventListener('change', () => {
        if (currentStatsView === STATS_VIEW.ACTIVITY_DAILY && activitySelect.value) {
            updateStatsView(STATS_VIEW.ACTIVITY_DAILY, activitySelect.value);
        }
    });
    
    // 初始化年度统计表
    initAnnualTable();
    
    // 初始显示今日统计
    showStatistics();
}

// 更新当前时间显示
function updateCurrentTime() {
    const now = new Date();
    if (currentTimeElement) {
        currentTimeElement.textContent = formatDateTime(now);
    }
}

// 开始新活动
function startActivity() {
    const activityName = activityNameInput.value.trim();
    
    if (!activityName) {
        alert('请输入活动名称');
        return;
    }
    
    // 查找最近的同名活动记录
    const lastActivity = findLastActivityByName(activityName);
    let continuedFrom = null;
    let isPartOfSeries = false;
    
    if (lastActivity) {
        continuedFrom = lastActivity.id;
        isPartOfSeries = true;
    }
    
    // 如果有正在进行的活动，先结束它
    if (currentActivity) {
        endActivity();
    }
    
    // 创建新活动
    const now = new Date();
    currentActivity = {
        id: generateId(),
        activityName: activityName,
        startTime: now,
        endTime: null,
        duration: 0,
        continuedFrom: continuedFrom,
        isPartOfSeries: isPartOfSeries
    };
    
    // 更新UI
    updateCurrentActivityUI();
    startDurationTimer();
    
    // 清空输入框
    activityNameInput.value = '';
    
    // 保存数据
    saveData();
}

// 查找最近的同名活动
function findLastActivityByName(name) {
    return activities.find(activity => activity.activityName === name);
}

// 结束当前活动
function endActivity() {
    if (!currentActivity) return;
    
    // 设置结束时间和持续时间
    const now = new Date();
    currentActivity.endTime = now;
    currentActivity.duration = calculateDuration(currentActivity.startTime, now);
    
    // 添加到活动列表
    activities.unshift(currentActivity);
    
    // 清除当前活动
    currentActivity = null;
    
    // 更新UI
    updateCurrentActivityUI();
    updateActivityList();
    
    // 保存数据
    saveData();
}

// 更新当前活动UI
function updateCurrentActivityUI() {
    if (currentActivity) {
        noActivityElement.classList.add('hidden');
        activityDetailsElement.classList.remove('hidden');
        
        currentActivityNameElement.textContent = currentActivity.activityName;
        startTimeElement.textContent = formatDateTime(currentActivity.startTime);
        updateDurationDisplay();
    } else {
        noActivityElement.classList.remove('hidden');
        activityDetailsElement.classList.add('hidden');
    }
}

// 开始持续时间计时器
function startDurationTimer() {
    // 清除可能存在的旧计时器
    if (window.durationTimer) {
        clearInterval(window.durationTimer);
    }
    
    // 设置新计时器，每秒更新一次
    window.durationTimer = setInterval(updateDurationDisplay, 1000);
}

// 更新持续时间显示
function updateDurationDisplay() {
    if (!currentActivity) {
        if (window.durationTimer) {
            clearInterval(window.durationTimer);
        }
        return;
    }
    
    const now = new Date();
    const duration = calculateDuration(currentActivity.startTime, now);
    durationElement.textContent = formatDuration(duration);
}

// 更新活动列表
function updateActivityList() {
    // 如果没有活动记录，显示提示信息
    if (activities.length === 0) {
        noRecordsElement.classList.remove('hidden');
        return;
    }
    
    // 隐藏提示信息
    noRecordsElement.classList.add('hidden');
    
    // 清空列表
    while (activityListElement.firstChild && activityListElement.firstChild !== noRecordsElement) {
        activityListElement.removeChild(activityListElement.firstChild);
    }
    
    // 添加活动记录
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.style.borderLeftColor = getColorForActivity(activity.activityName);
        
        // 如果是连续活动，添加标记
        if (activity.isPartOfSeries) {
            activityItem.classList.add('continued-activity');
        }
        
        const header = document.createElement('div');
        header.className = 'activity-item-header';
        
        const name = document.createElement('div');
        name.className = 'activity-item-name';
        name.textContent = activity.activityName;
        
        const duration = document.createElement('div');
        duration.className = 'activity-item-duration';
        duration.textContent = formatDuration(activity.duration);
        
        header.appendChild(name);
        header.appendChild(duration);
        
        const time = document.createElement('div');
        time.className = 'activity-item-time';
        
        const startTime = document.createElement('div');
        startTime.textContent = `开始: ${formatDateTime(activity.startTime)}`;
        
        const endTime = document.createElement('div');
        endTime.textContent = `结束: ${formatDateTime(activity.endTime)}`;
        
        time.appendChild(startTime);
        time.appendChild(endTime);
        
        activityItem.appendChild(header);
        activityItem.appendChild(time);
        
        activityListElement.appendChild(activityItem);
    });
    
    // 更新活动选择器
    updateActivitySelector();
}

// 更新活动选择器
function updateActivitySelector() {
    // 清空选择器
    activitySelect.innerHTML = '';
    
    // 获取所有活动名称
    const activityNames = getActivityNames();
    
    // 为每个活动名称创建选项
    activityNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
    });
    
    // 如果有活动，默认选择第一个
    if (activityNames.length > 0) {
        activitySelect.value = activityNames[0];
        selectedActivity = activityNames[0];
    }
}

// 获取所有活动名称（去重）
function getActivityNames() {
    const namesSet = new Set();
    
    activities.forEach(activity => {
        namesSet.add(activity.activityName);
    });
    
    return Array.from(namesSet);
}

// 保存数据到本地存储
function saveData() {
    const data = {
        activities: activities,
        currentActivity: currentActivity
    };
    
    localStorage.setItem('timeTrackerData', JSON.stringify(data));
}

// 从本地存储加载数据
function loadData() {
    const dataString = localStorage.getItem('timeTrackerData');
    
    if (!dataString) return;
    
    try {
        const data = JSON.parse(dataString);
        
        // 恢复日期对象
        activities = data.activities.map(activity => ({
            ...activity,
            startTime: new Date(activity.startTime),
            endTime: activity.endTime ? new Date(activity.endTime) : null
        }));
        
        if (data.currentActivity) {
            currentActivity = {
                ...data.currentActivity,
                startTime: new Date(data.currentActivity.startTime),
                endTime: data.currentActivity.endTime ? new Date(data.currentActivity.endTime) : null
            };
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        activities = [];
        currentActivity = null;
    }
}

// 工具函数

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 计算持续时间（分钟）
function calculateDuration(startTime, endTime) {
    return Math.floor((endTime - startTime) / (1000 * 60));
}

// 格式化日期时间
function formatDateTime(date) {
    if (!date) return '';
    
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    
    return new Date(date).toLocaleString('zh-CN', options);
}

// 格式化持续时间
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} 分钟`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
        return `${hours} 小时`;
    }
    
    return `${hours} 小时 ${remainingMinutes} 分钟`;
}

// 根据活动名称生成颜色
function getColorForActivity(activityName) {
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

// 更新统计视图
function updateStatsView(viewType, activityName = null) {
    currentStatsView = viewType;
    selectedActivity = activityName;
    
    // 更新按钮状态
    dailyDistributionBtn.classList.toggle('active', viewType === STATS_VIEW.DAILY_DISTRIBUTION);
    activityDailyBtn.classList.toggle('active', viewType === STATS_VIEW.ACTIVITY_DAILY);
    activityTotalBtn.classList.toggle('active', viewType === STATS_VIEW.ACTIVITY_TOTAL);
    annualTableBtn.classList.toggle('active', viewType === STATS_VIEW.ANNUAL_TABLE);
    
    // 显示/隐藏相关控件
    activitySelector.classList.toggle('hidden', viewType !== STATS_VIEW.ACTIVITY_DAILY);
    dateSelector.classList.toggle('hidden', viewType === STATS_VIEW.ANNUAL_TABLE);
    annualTableControls.classList.toggle('hidden', viewType !== STATS_VIEW.ANNUAL_TABLE);
    annualTableContainer.classList.toggle('hidden', viewType !== STATS_VIEW.ANNUAL_TABLE);
    
    // 隐藏/显示图表容器
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.classList.toggle('hidden', viewType === STATS_VIEW.ANNUAL_TABLE);
    
    // 根据视图类型显示相应内容
    if (viewType === STATS_VIEW.ANNUAL_TABLE) {
        // 初始化年度统计表
        initAnnualTable();
        
        // 显示年度统计表数据
        const selectedYear = document.getElementById('annual-year-select').value;
        const selectedActivity = document.getElementById('annual-activity-select').value;
        populateAnnualTable(selectedYear, selectedActivity);
        
        // 隐藏统计摘要和无数据提示
        noStatsElement.classList.add('hidden');
        statsSummaryElement.innerHTML = '';
    } else {
        showStatistics();
    }
}

// 显示统计数据
function showStatistics() {
    const selectedDate = statsDateInput.valueAsDate;
    if (!selectedDate) return;
    
    // 根据当前视图类型显示不同的统计数据
    switch (currentStatsView) {
        case STATS_VIEW.DAILY_DISTRIBUTION:
            showDailyDistribution(selectedDate);
            break;
        case STATS_VIEW.ACTIVITY_DAILY:
            if (selectedActivity) {
                showActivityDailyStats(selectedActivity);
            }
            break;
        case STATS_VIEW.ACTIVITY_TOTAL:
            showActivityTotalStats();
            break;
        case STATS_VIEW.ANNUAL_TABLE:
            // 年度统计表由专门的函数处理
            break;
    }
}

// 显示当日活动分布
function showDailyDistribution(selectedDate) {
    // 格式化日期为YYYY-MM-DD格式，用于比较
    const dateString = selectedDate.toISOString().split('T')[0];
    
    // 获取所选日期的活动
    const dailyActivities = getDailyActivities(dateString);
    
    // 如果没有活动记录，显示提示信息
    if (dailyActivities.length === 0) {
        noStatsElement.classList.remove('hidden');
        statsSummaryElement.innerHTML = '';
        
        // 清除现有图表
        if (timeChart) {
            timeChart.destroy();
            timeChart = null;
        }
        
        return;
    }
    
    // 隐藏提示信息
    noStatsElement.classList.add('hidden');
    
    // 处理数据
    const statsData = processStatsData(dailyActivities);
    
    // 更新图表 - 饼图
    updatePieChart(statsData);
    
    // 更新统计摘要
    updateStatsSummary(statsData);
}

// 显示特定活动的每日统计
function showActivityDailyStats(activityName) {
    const activityStats = calculateActivityStats();
    
    if (!activityStats[activityName]) {
        noStatsElement.classList.remove('hidden');
        statsSummaryElement.innerHTML = '';
        
        // 清除现有图表
        if (timeChart) {
            timeChart.destroy();
            timeChart = null;
        }
        
        return;
    }
    
    // 隐藏提示信息
    noStatsElement.classList.add('hidden');
    
    const dailyData = activityStats[activityName].dailyStats;
    const labels = Object.keys(dailyData).sort();
    const data = labels.map(date => dailyData[date]);
    const backgroundColor = Array(labels.length).fill(activityStats[activityName].color);
    
    // 更新图表 - 条形图
    updateBarChart(labels, data, backgroundColor, activityName);
    
    // 更新统计摘要
    updateActivityDailySummary(activityName, dailyData, activityStats[activityName].totalMinutes);
}

// 显示所有活动的累计统计
function showActivityTotalStats() {
    const activityStats = calculateActivityStats();
    const activityNames = Object.keys(activityStats);
    
    if (activityNames.length === 0) {
        noStatsElement.classList.remove('hidden');
        statsSummaryElement.innerHTML = '';
        
        // 清除现有图表
        if (timeChart) {
            timeChart.destroy();
            timeChart = null;
        }
        
        return;
    }
    
    // 隐藏提示信息
    noStatsElement.classList.add('hidden');
    
    const labels = activityNames;
    const data = labels.map(name => activityStats[name].totalMinutes);
    const backgroundColor = labels.map(name => activityStats[name].color);
    
    // 更新图表 - 饼图
    updatePieChart({
        items: labels.map((name, index) => ({
            name: name,
            totalMinutes: data[index],
            color: backgroundColor[index],
            percentage: Math.round((data[index] / data.reduce((a, b) => a + b, 0)) * 100)
        })),
        totalMinutes: data.reduce((a, b) => a + b, 0)
    });
    
    // 更新统计摘要
    updateActivityTotalSummary(activityStats);
}

// 获取指定日期的活动记录
function getDailyActivities(dateString) {
    // 包括已完成的活动和当前进行中的活动
    const allActivities = [...activities];
    if (currentActivity) {
        // 为当前活动创建临时结束时间以计算持续时间
        const tempActivity = {
            ...currentActivity,
            endTime: new Date(),
            duration: calculateDuration(currentActivity.startTime, new Date())
        };
        allActivities.unshift(tempActivity);
    }
    
    // 筛选指定日期的活动
    return allActivities.filter(activity => {
        const activityDate = new Date(activity.startTime).toISOString().split('T')[0];
        return activityDate === dateString;
    });
}

// 处理统计数据
function processStatsData(activities) {
    // 按活动名称分组并计算总时间
    const activityGroups = {};
    
    activities.forEach(activity => {
        const name = activity.activityName;
        if (!activityGroups[name]) {
            activityGroups[name] = {
                name: name,
                totalMinutes: 0,
                color: getColorForActivity(name)
            };
        }
        
        activityGroups[name].totalMinutes += activity.duration;
    });
    
    // 转换为数组并计算百分比
    const result = Object.values(activityGroups);
    const totalMinutes = result.reduce((sum, item) => sum + item.totalMinutes, 0);
    
    result.forEach(item => {
        item.percentage = Math.round((item.totalMinutes / totalMinutes) * 100);
    });
    
    // 按时间降序排序
    result.sort((a, b) => b.totalMinutes - a.totalMinutes);
    
    return {
        items: result,
        totalMinutes: totalMinutes
    };
}

// 计算活动统计数据
function calculateActivityStats() {
    const stats = {};
    
    activities.forEach(activity => {
        const name = activity.activityName;
        const date = new Date(activity.startTime).toISOString().split('T')[0];
        
        if (!stats[name]) {
            stats[name] = {
                totalMinutes: 0,
                dailyStats: {},
                color: getColorForActivity(name)
            };
        }
        
        stats[name].totalMinutes += activity.duration;
        
        if (!stats[name].dailyStats[date]) {
            stats[name].dailyStats[date] = 0;
        }
        
        stats[name].dailyStats[date] += activity.duration;
    });
    
    return stats;
}

// 更新饼图
function updatePieChart(statsData) {
    // 准备图表数据
    const labels = statsData.items.map(item => item.name);
    const data = statsData.items.map(item => item.totalMinutes);
    const backgroundColor = statsData.items.map(item => item.color);
    
    // 如果已有图表，销毁它
    if (timeChart) {
        timeChart.destroy();
    }
    
    // 创建新图表
    timeChart = new Chart(timeChartCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percentage = Math.round((value / statsData.totalMinutes) * 100);
                            return `${label}: ${formatDuration(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 更新条形图
function updateBarChart(labels, data, backgroundColor, activityName) {
    // 如果已有图表，销毁它
    if (timeChart) {
        timeChart.destroy();
    }
    
    // 创建新图表
    timeChart = new Chart(timeChartCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: activityName,
                data: data,
                backgroundColor: backgroundColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatDuration(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${formatDuration(value)}`;
                        }
                    }
                }
            }
        }
    });
}

// 更新统计摘要
function updateStatsSummary(statsData) {
    // 清空摘要区域
    statsSummaryElement.innerHTML = '';
    
    // 添加总时间
    const totalElement = document.createElement('div');
    totalElement.className = 'stats-total';
    totalElement.textContent = `总计: ${formatDuration(statsData.totalMinutes)}`;
    statsSummaryElement.appendChild(totalElement);
    
    // 添加各活动详情
    statsData.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'stats-summary-item';
        
        const nameElement = document.createElement('div');
        nameElement.className = 'stats-summary-item-name';
        
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'color-indicator';
        colorIndicator.style.backgroundColor = item.color;
        
        nameElement.appendChild(colorIndicator);
        nameElement.appendChild(document.createTextNode(item.name));
        
        const detailElement = document.createElement('div');
        detailElement.textContent = `${formatDuration(item.totalMinutes)} (${item.percentage}%)`;
        
        itemElement.appendChild(nameElement);
        itemElement.appendChild(detailElement);
        
        statsSummaryElement.appendChild(itemElement);
    });
}

// 更新活动每日统计摘要
function updateActivityDailySummary(activityName, dailyData, totalMinutes) {
    // 清空摘要区域
    statsSummaryElement.innerHTML = '';
    
    // 添加总时间
    const totalElement = document.createElement('div');
    totalElement.className = 'stats-total';
    totalElement.textContent = `${activityName} 总计: ${formatDuration(totalMinutes)}`;
    statsSummaryElement.appendChild(totalElement);
    
    // 添加每日详情
    const dates = Object.keys(dailyData).sort().reverse();
    
    dates.forEach(date => {
        const minutes = dailyData[date];
        
        const itemElement = document.createElement('div');
        itemElement.className = 'stats-summary-item';
        
        const dateElement = document.createElement('div');
        dateElement.textContent = date;
        
        const durationElement = document.createElement('div');
        durationElement.textContent = formatDuration(minutes);
        
        itemElement.appendChild(dateElement);
        itemElement.appendChild(durationElement);
        
        statsSummaryElement.appendChild(itemElement);
    });
}

// 更新活动累计统计摘要
function updateActivityTotalSummary(activityStats) {
    // 清空摘要区域
    statsSummaryElement.innerHTML = '';
    
    // 计算总时间
    let totalMinutes = 0;
    Object.values(activityStats).forEach(stat => {
        totalMinutes += stat.totalMinutes;
    });
    
    // 添加总时间
    const totalElement = document.createElement('div');
    totalElement.className = 'stats-total';
    totalElement.textContent = `所有活动总计: ${formatDuration(totalMinutes)}`;
    statsSummaryElement.appendChild(totalElement);
    
    // 添加各活动详情
    const activityNames = Object.keys(activityStats);
    activityNames.sort((a, b) => activityStats[b].totalMinutes - activityStats[a].totalMinutes);
    
    activityNames.forEach(name => {
        const stat = activityStats[name];
        const percentage = Math.round((stat.totalMinutes / totalMinutes) * 100);
        
        const itemElement = document.createElement('div');
        itemElement.className = 'stats-summary-item';
        
        const nameElement = document.createElement('div');
        nameElement.className = 'stats-summary-item-name';
        
        const colorIndicator = document.createElement('span');
        colorIndicator.className = 'color-indicator';
        colorIndicator.style.backgroundColor = stat.color;
        
        nameElement.appendChild(colorIndicator);
        nameElement.appendChild(document.createTextNode(name));
        
        const detailElement = document.createElement('div');
        detailElement.textContent = `${formatDuration(stat.totalMinutes)} (${percentage}%)`;
        
        itemElement.appendChild(nameElement);
        itemElement.appendChild(detailElement);
        
        statsSummaryElement.appendChild(itemElement);
    });
}

// 年度统计表功能

// 初始化年度统计表
function initAnnualTable() {
    // 生成年份选择器选项
    populateYearSelector();
    
    // 生成活动选择器选项
    populateAnnualActivitySelector();
    
    // 生成表格结构
    generateTableStructure();
    
    // 添加事件监听器
    addAnnualTableEventListeners();
}

// 生成年份选择器选项
function populateYearSelector() {
    const yearSelect = document.getElementById('annual-year-select');
    yearSelect.innerHTML = '';
    
    // 获取所有活动的年份
    const years = getActivityYears();
    
    // 如果没有活动记录，添加当前年份
    if (years.length === 0) {
        const currentYear = new Date().getFullYear();
        years.push(currentYear);
    }
    
    // 为每个年份创建选项
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '年';
        yearSelect.appendChild(option);
    });
    
    // 默认选择最新的年份
    yearSelect.value = years[years.length - 1];
}

// 获取所有活动的年份
function getActivityYears() {
    const yearsSet = new Set();
    
    activities.forEach(activity => {
        const year = new Date(activity.startTime).getFullYear();
        yearsSet.add(year);
    });
    
    return Array.from(yearsSet).sort();
}

// 生成活动选择器选项
function populateAnnualActivitySelector() {
    const activitySelect = document.getElementById('annual-activity-select');
    
    // 保留"所有活动"选项
    const allOption = activitySelect.querySelector('option[value="all"]');
    activitySelect.innerHTML = '';
    activitySelect.appendChild(allOption);
    
    // 获取所有活动名称
    const activityNames = getActivityNames();
    
    // 为每个活动名称创建选项
    activityNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
    });
}

// 生成表格结构
function generateTableStructure() {
    const tableBody = document.querySelector('#annual-table tbody');
    tableBody.innerHTML = '';
    
    // 生成31行（1-31日）
    for (let day = 1; day <= 31; day++) {
        const row = document.createElement('tr');
        
        // 添加日期单元格
        const dayCell = document.createElement('td');
        dayCell.textContent = day;
        row.appendChild(dayCell);
        
        // 添加12个月份单元格
        for (let month = 1; month <= 12; month++) {
            const cell = document.createElement('td');
            cell.id = `cell-${day}-${month}`;
            cell.className = 'activity-cell';
            row.appendChild(cell);
        }
        
        tableBody.appendChild(row);
    }
}

// 添加年度统计表事件监听器
function addAnnualTableEventListeners() {
    const yearSelect = document.getElementById('annual-year-select');
    const activitySelect = document.getElementById('annual-activity-select');
    const showTableBtn = document.getElementById('show-annual-table-btn');
    
    // 显示统计表按钮点击事件
    showTableBtn.addEventListener('click', () => {
        const selectedYear = yearSelect.value;
        const selectedActivity = activitySelect.value;
        populateAnnualTable(selectedYear, selectedActivity);
    });
}

// 填充年度统计表数据
function populateAnnualTable(year, activityFilter = 'all') {
    // 清空所有单元格
    clearTableCells();
    
    // 获取选定年份的活动数据
    const yearActivities = getActivitiesByYear(year);
    
    // 按日期组织活动数据
    const organizedData = organizeActivitiesByDate(yearActivities, activityFilter);
    
    // 填充表格单元格
    fillTableCells(organizedData);
}

// 清空表格单元格
function clearTableCells() {
    const cells = document.querySelectorAll('.activity-cell');
    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.className = 'activity-cell';
    });
}

// 获取指定年份的活动
function getActivitiesByYear(year) {
    const activities = getActivities();
    return activities.filter(activity => {
        const activityYear = new Date(activity.startTime).getFullYear();
        return activityYear.toString() === year.toString();
    });
}

// 获取所有活动
function getActivities() {
    return activities;
}

// 按日期组织活动数据
function organizeActivitiesByDate(activities, activityFilter) {
    const organizedData = {};
    
    activities.forEach(activity => {
        // 如果设置了活动过滤器且不匹配，则跳过
        if (activityFilter !== 'all' && activity.activityName !== activityFilter) {
            return;
        }
        
        const date = new Date(activity.startTime);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        
        const key = `${day}-${month}`;
        
        if (!organizedData[key]) {
            organizedData[key] = [];
        }
        
        organizedData[key].push(activity);
    });
    
    return organizedData;
}

// 填充表格单元格
function fillTableCells(organizedData) {
    for (const [key, activities] of Object.entries(organizedData)) {
        const [day, month] = key.split('-').map(Number);
        const cell = document.getElementById(`cell-${day}-${month}`);
        
        if (cell && activities.length > 0) {
            cell.classList.add('has-activity');
            
            // 选择主要活动显示（可以是最长时间的活动）
            const mainActivity = activities.sort((a, b) => b.duration - a.duration)[0];
            
            // 创建活动内容
            const activityContent = document.createElement('div');
            activityContent.className = 'activity-content';
            activityContent.textContent = mainActivity.activityName;
            
            // 如果有备注或成绩，添加到单元格
            if (mainActivity.note) {
                const noteElement = document.createElement('div');
                noteElement.className = 'activity-note';
                noteElement.textContent = mainActivity.note;
                activityContent.appendChild(noteElement);
            }
            
            cell.appendChild(activityContent);
            
            // 如果有多个活动，添加指示器
            if (activities.length > 1) {
                const indicator = document.createElement('span');
                indicator.className = 'multi-activity-indicator';
                indicator.textContent = `+${activities.length - 1}`;
                cell.appendChild(indicator);
            }
            
            // 添加点击事件监听器
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', () => {
                showActivityDetails(day, month, activities);
            });
        }
    }
}

// 显示活动详情（在页面中展开）
function showActivityDetails(day, month, activities) {
    // 先清除之前的详情显示
    const existingDetails = document.querySelector('.activity-details-expanded');
    if (existingDetails) {
        existingDetails.remove();
    }
    
    // 创建详情展开区域
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'activity-details-expanded';
    detailsDiv.innerHTML = `
        <div class="details-header">
            <h3>${month}月${day}日的活动详情</h3>
            <button class="close-details-btn">收起 ×</button>
        </div>
        <div class="details-content">
            ${activities.map(activity => `
                <div class="activity-detail-item">
                    <div class="activity-name">${activity.activityName}</div>
                    <div class="activity-time">
                        ${formatDateTime(new Date(activity.startTime))} - 
                        ${formatDateTime(new Date(activity.endTime))}
                    </div>
                    <div class="activity-duration">
                        时长: ${formatDuration(activity.duration)}
                    </div>
                    ${activity.note ? `<div class="activity-note">备注: ${activity.note}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    // 将详情区域插入到年度表格后面
    const tableContainer = document.getElementById('annual-table-container');
    tableContainer.parentNode.insertBefore(detailsDiv, tableContainer.nextSibling);
    
    // 添加关闭事件
    const closeBtn = detailsDiv.querySelector('.close-details-btn');
    closeBtn.addEventListener('click', () => {
        detailsDiv.remove();
    });
    
    // 滚动到详情区域
    detailsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 扩展活动对象，添加备注字段
function addNoteToActivity(activityId, note) {
    const activities = getActivities();
    const updatedActivities = activities.map(activity => {
        if (activity.id === activityId) {
            return { ...activity, note };
        }
        return activity;
    });
    
    localStorage.setItem('activities', JSON.stringify(updatedActivities));
}

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);
