# 🚀 Netlify部署指南

## 📋 部署步骤

### 1️⃣ 前端部署到Netlify（已完成✅）

你的项目已经连接到Netlify: [https://app.netlify.com/projects/attention-span-tracker](https://app.netlify.com/projects/attention-span-tracker)

**当前站点ID**: `65ffd582-581f-4535-bb80-64ea054de2ce`

### 2️⃣ 部署微信支付服务器

微信支付服务器（`payment-server.js`）需要部署到支持Node.js的平台：

#### 推荐方案A：Railway.app（免费）
```bash
# 1. 安装Railway CLI
npm install -g @railway/cli

# 2. 登录Railway
railway login

# 3. 进入支付服务器目录
cd /Users/apple/Downloads/nativePaySDK

# 4. 初始化并部署
railway init
railway up
```

#### 推荐方案B：Render.com（免费）
1. 访问 [https://render.com](https://render.com)
2. 创建新的Web Service
3. 连接GitHub仓库
4. 设置构建命令：`npm install`
5. 设置启动命令：`node payment-server.js`
6. 设置环境变量：`PORT=3003`

#### 推荐方案C：Heroku（付费，最稳定）
```bash
# 1. 登录Heroku
heroku login

# 2. 创建应用
cd /Users/apple/Downloads/nativePaySDK
heroku create your-payment-server

# 3. 部署
git init
git add .
git commit -m "Deploy payment server"
heroku git:remote -a your-payment-server
git push heroku main
```

### 3️⃣ 更新前端API地址

部署支付服务器后，更新`payment.js`中的API地址：

```javascript
const PAYMENT_CONFIG = {
    API_URL: 'https://your-payment-server.railway.app',  // 替换为实际地址
    PRODUCT_INFO: {
        id: 'premium_access',
        name: 'Attention Span Tracker 完整版',
        price: 99.00,
        amount: 9900
    },
    DEV_MODE: false  // 生产模式
};
```

### 4️⃣ 推送到GitHub并自动部署

```bash
# 添加更改
git add .

# 提交
git commit -m "🚀 优化Netlify部署配置"

# 推送到GitHub
git push origin main
```

Netlify会自动检测到更新并重新部署！

## 🌐 部署后的URL

- **前端站点**: https://attention-span-tracker.netlify.app
- **支付服务器**: https://your-payment-server.railway.app（根据你选择的平台）

## 🔐 环境变量配置

### Netlify环境变量
在Netlify后台设置：[https://app.netlify.com/sites/attention-span-tracker/settings/env](https://app.netlify.com/sites/attention-span-tracker/settings/env)

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
```

### 支付服务器环境变量
根据部署平台设置：
```
WECHAT_APPID=wx038890243a70a4dd
WECHAT_MCHID=1728944790
WECHAT_API_V3_KEY=your-api-key
PORT=3003
```

## ✅ 部署检查清单

- [ ] 前端已部署到Netlify
- [ ] 支付服务器已部署（Railway/Render/Heroku）
- [ ] `payment.js`中的API_URL已更新
- [ ] 所有环境变量已配置
- [ ] 微信支付证书已上传到服务器
- [ ] 测试支付功能是否正常

## 🐛 常见问题

### Q: Netlify部署后支付功能不工作？
A: 检查`payment.js`中的`API_URL`是否指向正确的支付服务器地址。

### Q: 支付服务器需要HTTPS吗？
A: 是的，微信支付要求使用HTTPS。Railway、Render、Heroku都会自动提供HTTPS。

### Q: 如何查看部署日志？
A: Netlify: 在Netlify后台的"Deploys"标签查看
   Railway: 运行`railway logs`
   Render: 在Render后台的"Logs"标签查看

## 📞 获取帮助

- Netlify文档: [https://docs.netlify.com/](https://docs.netlify.com/)
- Railway文档: [https://docs.railway.app/](https://docs.railway.app/)
- Render文档: [https://render.com/docs](https://render.com/docs)

---

祝部署顺利！🎉

