# 常用模式和最佳实践

- 【时间归零Bug修复】问题：计时器运行时，elapsedTime 存储的是 0（实际时间从 startTime 计算），导致保存到本地/云端时时间为 0，同步回来后时间归零。修复：1) saveData() 中实时计算 elapsedTime；2) 云端同步时实时计算；3) loadCloudDataInBackground() 中保护正在运行的计时器不被旧数据覆盖。
