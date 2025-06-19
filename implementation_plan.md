# 活动连续记录与统计功能实现方案

## 数据结构修改

### 活动记录结构
```javascript
{
  id: "唯一ID",
  activityName: "活动名称",
  startTime: Date对象,
  endTime: Date对象,
  duration: 分钟数,
  continuedFrom: "上一次活动ID", // 新增字段，用于标记连续活动
  isPartOfSeries: true/false     // 新增字段，标记是否为系列活动的一部分
}
```

### 统计数据结构
```javascript
{
  activityStats: {
    "编程": {
      dailyStats: {
        "2025-04-15": 分钟数,
        "2025-04-16": 分钟数,
        // 其他日期...
      },
      totalMinutes: 总分钟数,
      color: 颜色代码
    },
    // 其他活动...
  }
}
```

## 功能实现详细设计

### 1. 活动连续记录功能

#### 修改 startActivity 函数
```javascript
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
```

### 2. 独立时间段记录

保持现有的 endActivity 函数逻辑不变，确保每次点击"结束"按钮时创建独立记录。

### 3. 分类统计功能

#### 添加统计数据计算函数
```javascript
// 计算活动统计数据
function calculateActivityStats() {
  const activityStats = {};
  
  // 包括已完成的活动和当前进行中的活动
  const allActivities = [...activities];
  if (currentActivity) {
    const tempActivity = {
      ...currentActivity,
      endTime: new Date(),
      duration: calculateDuration(currentActivity.startTime, new Date())
    };
    allActivities.unshift(tempActivity);
  }
  
  // 计算每个活动的统计数据
  allActivities.forEach(activity => {
    const name = activity.activityName;
    const date = new Date(activity.startTime).toISOString().split('T')[0];
    
    if (!activityStats[name]) {
      activityStats[name] = {
        dailyStats: {},
        totalMinutes: 0,
        color: getColorForActivity(name)
      };
    }
    
    if (!activityStats[name].dailyStats[date]) {
      activityStats[name].dailyStats[date] = 0;
    }
    
    activityStats[name].dailyStats[date] += activity.duration;
    activityStats[name].totalMinutes += activity.duration;
  });
  
  return activityStats;
}
```

#### 添加统计视图切换功能
```javascript
// 统计视图类型
const STATS_VIEW = {
  DAILY_DISTRIBUTION: 'daily_distribution',  // 当日所有活动分布
  ACTIVITY_DAILY: 'activity_daily',          // 特定活动的每日分布
  ACTIVITY_TOTAL: 'activity_total'           // 特定活动的累计时间
};

// 当前统计视图类型
let currentStatsView = STATS_VIEW.DAILY_DISTRIBUTION;
// 当前选中的活动（用于活动每日统计和累计统计）
let selectedActivity = null;

// 更新统计视图
function updateStatsView(viewType, activityName = null) {
  currentStatsView = viewType;
  selectedActivity = activityName;
  
  // 更新UI元素显示状态
  updateStatsViewUI();
  
  // 显示统计数据
  showStatistics();
}
```

### 4. UI修改

#### 添加统计视图切换控件
```html
<div class="stats-view-controls">
  <div class="stats-view-title">统计视图：</div>
  <div class="stats-view-options">
    <button id="daily-distribution-btn" class="stats-view-btn active">当日活动分布</button>
    <button id="activity-daily-btn" class="stats-view-btn">活动每日统计</button>
    <button id="activity-total-btn" class="stats-view-btn">活动累计统计</button>
  </div>
  <div id="activity-selector" class="hidden">
    <label>选择活动：</label>
    <select id="activity-select"></select>
  </div>
</div>
```

#### 修改活动记录显示，添加连续标记
```javascript
function updateActivityList() {
  // 现有代码...
  
  // 添加活动记录
  activities.forEach(activity => {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.style.borderLeftColor = getColorForActivity(activity.activityName);
    
    // 如果是连续活动，添加标记
    if (activity.isPartOfSeries) {
      activityItem.classList.add('continued-activity');
    }
    
    // 其余现有代码...
  });
}
```

### 5. 图表显示修改

#### 修改图表显示逻辑
```javascript
// 更新图表
function updateChart(statsData) {
  // 准备图表数据
  let labels, data, backgroundColor, chartType, chartOptions;
  
  switch (currentStatsView) {
    case STATS_VIEW.DAILY_DISTRIBUTION:
      // 当日所有活动分布（现有逻辑）
      labels = statsData.items.map(item => item.name);
      data = statsData.items.map(item => item.totalMinutes);
      backgroundColor = statsData.items.map(item => item.color);
      chartType = 'pie';
      chartOptions = {
        // 现有配置...
      };
      break;
      
    case STATS_VIEW.ACTIVITY_DAILY:
      // 特定活动的每日分布
      const activityStats = calculateActivityStats()[selectedActivity];
      if (!activityStats) return;
      
      const dailyData = activityStats.dailyStats;
      labels = Object.keys(dailyData).sort();
      data = labels.map(date => dailyData[date]);
      backgroundColor = Array(labels.length).fill(activityStats.color);
      chartType = 'bar';
      chartOptions = {
        // 条形图配置...
      };
      break;
      
    case STATS_VIEW.ACTIVITY_TOTAL:
      // 特定活动的累计时间
      const allStats = calculateActivityStats();
      labels = Object.keys(allStats);
      data = labels.map(name => allStats[name].totalMinutes);
      backgroundColor = labels.map(name => allStats[name].color);
      chartType = 'pie';
      chartOptions = {
        // 饼图配置...
      };
      break;
  }
  
  // 如果已有图表，销毁它
  if (timeChart) {
    timeChart.destroy();
  }
  
  // 创建新图表
  timeChart = new Chart(timeChartCanvas, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColor,
        borderWidth: 1
      }]
    },
    options: chartOptions
  });
}
```

## 实现计划

1. 修改数据结构，添加新字段
2. 实现活动连续记录功能
3. 实现分类统计功能
4. 添加统计视图切换UI
5. 修改图表显示逻辑
6. 更新活动记录显示
7. 测试新功能
