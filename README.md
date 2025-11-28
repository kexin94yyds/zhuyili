# Attention—Span—Tracker

一个功能强大的时间追踪和专注力管理应用，采用现代化的深色主题设计。

## ✨ 主要功能

- **时间追踪**: 记录和追踪各种活动的时间
- **多重计时器**: 同时为多个活动计时
- **统计分析**: 详细的数据统计和可视化图表
- **年度统计表**: 全年活动数据的热力图展示
- **数据管理**: 导入/导出功能，支持数据备份
- **PWA应用**: 支持离线使用和桌面安装
- **💳 微信支付**: 集成Native支付，支持二维码扫码购买
- **🎁 免费试用**: 2次免费体验高级功能
- **👤 Google登录**: 支持Google账号登录和头像显示

## 🎨 界面特色

- 现代化深色主题
- 响应式设计，支持移动端和桌面端
- 流畅的动画效果
- 直观的用户界面

## 🚀 快速开始

1. 直接在浏览器中打开 `index.html` 文件
2. 或者通过任何HTTP服务器运行项目
3. 开始记录您的活动时间

## 📱 PWA安装

- 在支持PWA的浏览器中访问应用
- 点击地址栏的"安装"按钮
- 应用将添加到您的桌面或应用列表

## 🛠️ 技术栈

- HTML5 / CSS3 / JavaScript (ES6+)
- Chart.js (图表库)
- Service Worker (PWA支持)
- LocalStorage (数据持久化)
- Supabase (云端数据库和用户认证)
- 微信支付SDK (Native支付)
- QRCode.js (二维码生成)

## 🌐 在线访问

- **生产环境**: [https://attention-span-tracker.netlify.app](https://attention-span-tracker.netlify.app)
- **GitHub仓库**: [https://github.com/kexin94yyds/zhuyili](https://github.com/kexin94yyds/zhuyili)
- **Netlify管理**: [https://app.netlify.com/projects/attention-span-tracker](https://app.netlify.com/projects/attention-span-tracker)

## 📦 部署

### 自动部署（推荐）
项目已配置自动部署，推送到GitHub后会自动触发Netlify部署。

```bash
git add .
git commit -m "更新内容"
git push origin main
```

### 本地开发
```bash
# 1. 克隆项目
git clone https://github.com/kexin94yyds/zhuyili.git

# 2. 打开项目
cd zhuyili

# 3. 使用本地服务器运行
python -m http.server 8000
# 或
npx serve .
```

### 支付服务器部署
详见 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 和 [PAYMENT_GUIDE.md](./PAYMENT_GUIDE.md)

## 📄 许可证

MIT License

---

开始追踪您的时间，提高专注力和工作效率！

## 项目结构

- `index.html` - 主页面
- `styles.css` - 主样式表
- `combined.js` - 主要JavaScript逻辑
- `chart_functions.js` - 图表相关功能
- `stats_functions.js` - 统计功能
- `annual_table.js` - 年度表格功能
- `export_import.js` - 数据导入导出功能

## 贡献

欢迎提交问题和改进建议！
# 2025年11月28日 星期五 16时26分35秒 CST
