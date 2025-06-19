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
