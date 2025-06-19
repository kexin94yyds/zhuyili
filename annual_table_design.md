# 年度统计表设计方案

## 用户界面设计

### 1. 统计视图按钮组
在现有的统计视图按钮组中添加"年度统计表"按钮：
```html
<div class="stats-view-options">
    <button id="daily-distribution-btn" class="stats-view-btn">当日活动分布</button>
    <button id="activity-daily-btn" class="stats-view-btn">活动每日统计</button>
    <button id="activity-total-btn" class="stats-view-btn">活动累计统计</button>
    <button id="annual-table-btn" class="stats-view-btn">年度统计表</button>
</div>
```

### 2. 年度统计表控制区域
```html
<div id="annual-table-controls" class="annual-table-controls hidden">
    <div class="control-group">
        <label for="annual-year-select">选择年份：</label>
        <select id="annual-year-select"></select>
    </div>
    <div class="control-group">
        <label for="annual-activity-select">选择活动：</label>
        <select id="annual-activity-select">
            <option value="all">所有活动</option>
            <!-- 动态填充活动选项 -->
        </select>
    </div>
</div>
```

### 3. 年度统计表容器
```html
<div id="annual-table-container" class="annual-table-container hidden">
    <table id="annual-table" class="annual-table">
        <thead>
            <tr>
                <th class="day-header">日期</th>
                <th>1月</th>
                <th>2月</th>
                <th>3月</th>
                <th>4月</th>
                <th>5月</th>
                <th>6月</th>
                <th>7月</th>
                <th>8月</th>
                <th>9月</th>
                <th>10月</th>
                <th>11月</th>
                <th>12月</th>
            </tr>
        </thead>
        <tbody>
            <!-- 动态生成31行（1-31日） -->
        </tbody>
    </table>
</div>
```

## CSS 样式设计

```css
/* 年度统计表样式 */
.annual-table-controls {
    margin-bottom: 15px;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.annual-table-container {
    overflow-x: auto;
    max-width: 100%;
    margin-bottom: 20px;
}

.annual-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.annual-table th, .annual-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

.annual-table th {
    background-color: #f5f5f5;
    position: sticky;
    top: 0;
    z-index: 10;
}

.annual-table .day-header {
    position: sticky;
    left: 0;
    z-index: 20;
    background-color: #f5f5f5;
}

.annual-table td:first-child {
    position: sticky;
    left: 0;
    background-color: #f5f5f5;
    font-weight: bold;
    z-index: 5;
}

.annual-table th:first-child {
    z-index: 30;
}

/* 活动单元格样式 */
.activity-cell {
    position: relative;
    min-height: 30px;
}

.activity-cell.has-activity {
    background-color: #f0f8ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .annual-table {
        font-size: 12px;
    }
    
    .annual-table th, .annual-table td {
        padding: 5px;
    }
}
```

## JavaScript 功能设计

### 1. 新增统计视图类型
```javascript
// 统计视图类型
const STATS_VIEW = {
    DAILY_DISTRIBUTION: 'daily_distribution',  // 当日所有活动分布
    ACTIVITY_DAILY: 'activity_daily',          // 特定活动的每日分布
    ACTIVITY_TOTAL: 'activity_total',          // 特定活动的累计时间
    ANNUAL_TABLE: 'annual_table'               // 年度统计表
};
```

### 2. 年度统计表初始化函数
```javascript
// 初始化年度统计表
function initAnnualTable() {
    // 生成年份选择器选项
    populateYearSelector();
    
    // 生成活动选择器选项
    populateActivitySelector();
    
    // 生成表格结构
    generateTableStructure();
    
    // 添加事件监听器
    addAnnualTableEventListeners();
}
```

### 3. 生成表格结构函数
```javascript
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
```

### 4. 填充表格数据函数
```javascript
// 填充表格数据
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
```

### 5. 按日期组织活动数据函数
```javascript
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
```

### 6. 填充表格单元格函数
```javascript
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
        }
    }
}
```

### 7. 更新统计视图函数修改
```javascript
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
    chartContainer.classList.toggle('hidden', viewType === STATS_VIEW.ANNUAL_TABLE);
    annualTableContainer.classList.toggle('hidden', viewType !== STATS_VIEW.ANNUAL_TABLE);
    
    // 根据视图类型显示相应内容
    if (viewType === STATS_VIEW.ANNUAL_TABLE) {
        const selectedYear = annualYearSelect.value || new Date().getFullYear();
        const selectedActivity = annualActivitySelect.value || 'all';
        populateAnnualTable(selectedYear, selectedActivity);
    } else {
        showStatistics();
    }
}
```

## 数据结构设计

### 1. 活动记录结构（现有）
```javascript
{
  id: "唯一ID",
  activityName: "活动名称",
  startTime: Date对象,
  endTime: Date对象,
  duration: 分钟数,
  continuedFrom: "上一次活动ID",
  isPartOfSeries: true/false,
  note: "备注或成绩信息" // 新增字段，用于存储成绩、备注等信息
}
```

### 2. 年度统计数据结构
```javascript
{
  // 按日期组织的活动数据
  // 格式: { "日-月": [活动1, 活动2, ...] }
  "1-1": [活动对象1, 活动对象2, ...],
  "2-1": [活动对象3],
  // ...
}
```

## 实现计划

1. 修改HTML结构，添加年度统计表按钮和表格容器
2. 添加CSS样式，确保表格在各种设备上正常显示
3. 实现JavaScript功能：
   - 添加年度统计表视图类型
   - 实现表格生成和数据填充功能
   - 修改现有的视图切换逻辑
4. 添加活动备注功能，允许用户为活动添加成绩或备注信息
5. 实现年份和活动筛选功能
6. 优化表格性能，确保大量数据时仍能流畅运行
