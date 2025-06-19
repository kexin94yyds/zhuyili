// 数据导出/导入功能

// 导出数据到JSON文件
function exportData() {
    try {
        console.log('开始导出数据...');
        
        // 从localStorage获取所有相关数据
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        const currentActivity = JSON.parse(localStorage.getItem('currentActivity') || 'null');
        const timeTrackerData = JSON.parse(localStorage.getItem('timeTrackerData') || 'null');
        const multiStopwatchData = JSON.parse(localStorage.getItem('multiStopwatchData') || 'null');
        const timeTrackerActivities = JSON.parse(localStorage.getItem('timeTrackerActivities') || '[]');
        
        console.log('获取到的数据:', {
            activitiesCount: activities.length,
            hasCurrentActivity: currentActivity !== null,
            hasTimeTrackerData: timeTrackerData !== null,
            hasMultiStopwatchData: multiStopwatchData !== null,
            timeTrackerActivitiesCount: timeTrackerActivities.length
        });
    
    // 创建导出数据对象，包含完整的数据
    const exportData = {
        version: "2.0",
        exportDate: new Date().toISOString(),
        appName: "Attention—Span—Tracker",
        data: {
            // 主要活动数据
            activities: activities,
            currentActivity: currentActivity,
            
            // 多计时器数据
            multiStopwatchData: multiStopwatchData,
            
            // 兼容旧版本的数据
            timeTrackerData: timeTrackerData,
            timeTrackerActivities: timeTrackerActivities,
            
            // 元数据
            exportInfo: {
                totalActivities: activities.length,
                hasCurrentActivity: currentActivity !== null,
                hasMultiStopwatch: multiStopwatchData !== null,
                exportTimestamp: Date.now()
            }
        }
    };
    
    // 转换为JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 创建下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    
    // 设置文件名（格式：Attention_Span_Tracker_Complete_Data_YYYY-MM-DD.json）
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
    downloadLink.download = `Attention_Span_Tracker_Complete_Data_${formattedDate}_${formattedTime}.json`;
    
    // 触发下载
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // 释放URL对象
    URL.revokeObjectURL(downloadLink.href);
    
    console.log('导出完成！');
    
    } catch (error) {
        console.error('导出数据时出错:', error);
        alert('导出失败: ' + error.message);
    }
}

// 导入数据
function importData(file, mode) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
            // 解析JSON数据
            const importedData = JSON.parse(event.target.result);
            
            // 验证数据格式
            if (!validateImportData(importedData)) {
                showImportMessage('数据格式错误，请确保导入正确的 Attention—Span—Tracker 数据文件。', 'error');
                return;
            }
            
            // 根据选择的模式处理数据
            if (mode === 'replace') {
                // 替换模式：直接用导入的数据替换当前数据
                replaceAllData(importedData.data);
                showImportMessage(`数据导入成功！已替换当前数据。\n导入了 ${importedData.data.activities.length} 条活动记录。`, 'success');
            } else if (mode === 'merge') {
                // 合并模式：将导入的数据合并到当前数据
                mergeImportedData(importedData.data);
                showImportMessage('数据导入成功！已合并到当前数据。', 'success');
            }
            
            // 3秒后刷新页面以显示导入的数据
            setTimeout(() => {
                window.location.reload();
            }, 3000);
            
        } catch (error) {
            console.error('导入数据时出错:', error);
            showImportMessage('导入失败：' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        showImportMessage('读取文件时出错，请重试。', 'error');
    };
    
    // 开始读取文件
    reader.readAsText(file);
}

// 验证导入的数据格式
function validateImportData(data) {
    // 检查基本结构
    if (!data || typeof data !== 'object') return false;
    if (!data.version || !data.exportDate || !data.data) return false;
    
    // 检查数据部分
    if (!Array.isArray(data.data.activities)) return false;
    
    // 检查版本兼容性（支持1.0和2.0版本）
    if (data.version !== "1.0" && data.version !== "2.0") {
        showImportMessage(`数据版本不兼容，当前应用支持版本：1.0, 2.0。导入文件版本：${data.version}`, 'error');
        return false;
    }
    
    return true;
}

// 替换所有数据
function replaceAllData(importedData) {
    console.log('正在替换所有数据...', importedData);
    
    try {
        // 主要数据
        localStorage.setItem('activities', JSON.stringify(importedData.activities || []));
        localStorage.setItem('currentActivity', JSON.stringify(importedData.currentActivity || null));
        
        // 多计时器数据
        if (importedData.multiStopwatchData) {
            localStorage.setItem('multiStopwatchData', JSON.stringify(importedData.multiStopwatchData));
        } else {
            localStorage.removeItem('multiStopwatchData');
        }
        
        // 兼容数据
        if (importedData.timeTrackerData) {
            localStorage.setItem('timeTrackerData', JSON.stringify(importedData.timeTrackerData));
        } else {
            localStorage.removeItem('timeTrackerData');
        }
        
        if (importedData.timeTrackerActivities && importedData.timeTrackerActivities.length > 0) {
            localStorage.setItem('timeTrackerActivities', JSON.stringify(importedData.timeTrackerActivities));
        } else {
            localStorage.removeItem('timeTrackerActivities');
        }
        
        console.log('数据替换完成');
    } catch (error) {
        console.error('替换数据时出错:', error);
        throw error;
    }
}

// 合并导入的数据到当前数据
function mergeImportedData(importedData) {
    console.log('正在合并数据...', importedData);
    
    // 获取当前数据
    const currentActivities = JSON.parse(localStorage.getItem('activities') || '[]');
    const currentActivityData = JSON.parse(localStorage.getItem('currentActivity') || 'null');
    
    // 创建活动ID映射，避免重复
    const activityMap = {};
    currentActivities.forEach(activity => {
        activityMap[activity.id] = true;
    });
    
    // 合并活动记录，过滤掉已存在的ID
    const newActivities = importedData.activities.filter(activity => !activityMap[activity.id]);
    const mergedActivities = [...currentActivities, ...newActivities];
    
    // 按开始时间排序
    mergedActivities.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    // 保存合并后的数据
    localStorage.setItem('activities', JSON.stringify(mergedActivities));
    
    // 如果当前没有进行中的活动，但导入的数据中有，则使用导入的
    if (!currentActivityData && importedData.currentActivity) {
        localStorage.setItem('currentActivity', JSON.stringify(importedData.currentActivity));
    }
    
    // 合并多计时器数据
    if (importedData.multiStopwatchData) {
        const currentMultiData = JSON.parse(localStorage.getItem('multiStopwatchData') || '{}');
        const mergedMultiData = { ...currentMultiData, ...importedData.multiStopwatchData };
        localStorage.setItem('multiStopwatchData', JSON.stringify(mergedMultiData));
    }
    
    // 合并兼容数据
    if (importedData.timeTrackerActivities) {
        const currentTimeTrackerActivities = JSON.parse(localStorage.getItem('timeTrackerActivities') || '[]');
        const mergedTimeTrackerActivities = [...currentTimeTrackerActivities, ...importedData.timeTrackerActivities];
        localStorage.setItem('timeTrackerActivities', JSON.stringify(mergedTimeTrackerActivities));
    }
    
    console.log('数据合并完成');
}

// 显示导入消息
function showImportMessage(message, type) {
    const messageElement = document.getElementById('import-message');
    messageElement.textContent = message;
    messageElement.className = 'import-message ' + type;
    messageElement.style.display = 'block';
}

// 初始化模态框控制
function initModalControls() {
    const importModal = document.getElementById('import-modal');
    const importBtn = document.getElementById('import-btn');
    const closeModal = document.querySelector('.close-modal');
    const cancelImport = document.getElementById('cancel-import');
    const confirmImport = document.getElementById('confirm-import');
    const importFile = document.getElementById('import-file');
    
    // 打开模态框
    importBtn.addEventListener('click', () => {
        importModal.classList.remove('hidden');
        document.getElementById('import-message').style.display = 'none';
        document.getElementById('import-file').value = '';
    });
    
    // 关闭模态框的多种方式
    closeModal.addEventListener('click', () => {
        importModal.classList.add('hidden');
    });
    
    cancelImport.addEventListener('click', () => {
        importModal.classList.add('hidden');
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === importModal) {
            importModal.classList.add('hidden');
        }
    });
    
    // 确认导入
    confirmImport.addEventListener('click', () => {
        const file = importFile.files[0];
        if (!file) {
            showImportMessage('请选择要导入的文件。', 'error');
            return;
        }
        
        // 检查文件类型
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            showImportMessage('请选择JSON格式的文件。', 'error');
            return;
        }
        
        // 获取选择的导入模式
        const mode = document.querySelector('input[name="import-mode"]:checked').value;
        
        // 执行导入
        importData(file, mode);
    });
    
    // 导出按钮事件
    document.getElementById('export-btn').addEventListener('click', exportData);
}

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initModalControls);
