# 微信支付集成使用指南

## 📋 已完成的集成

已成功将微信Native支付功能集成到 Attention Span Tracker 应用中。

## 🎯 功能说明

### 免费功能
- ✅ 基础计时器功能（多活动独立计时器）
- ✅ 当前活动显示

### 付费功能（需购买解锁）
- 🔒 时间统计分析
- 🔒 活动记录查看
- 🔒 数据导入导出

## 🚀 使用步骤

### 1. 启动支付服务器

在终端中运行以下命令：

```bash
cd /Users/apple/Downloads/nativePaySDK
node payment-server.js
```

服务器将在 `http://localhost:3003` 启动。

**重要：** 支付服务器必须保持运行状态，才能正常使用支付功能。

### 2. 打开网站

在浏览器中打开：
- 开发环境：`file:///Users/apple/zhuyili/index.html`
- 或使用本地服务器

### 3. 购买流程

1. **查看功能限制**
   - 打开网站后，统计和活动记录部分会显示锁定状态
   - 顶部会显示购买横幅

2. **点击"立即购买"**
   - 点击横幅中的"立即购买 ¥0.01"按钮
   - 系统会创建支付订单并显示二维码

3. **扫码支付**
   - 使用微信扫描二维码
   - 完成支付（仅需0.01元）

4. **自动解锁**
   - 支付成功后，系统会自动检测
   - 显示支付成功提示
   - 所有高级功能立即解锁
   - 下次访问时自动保持解锁状态

## 📁 相关文件

### 新增文件
- `payment.js` - 支付功能核心代码
- `PAYMENT_GUIDE.md` - 本使用指南

### 修改文件
- `index.html` - 添加了购买横幅、支付模态框和相关样式

### 外部依赖
- `/Users/apple/Downloads/nativePaySDK/payment-server.js` - 支付服务器
- `/Users/apple/Downloads/nativePaySDK/apiclient_key.pem` - 微信支付私钥
- `qrcode.min.js` - 二维码生成库（已存在）

## 🔧 配置说明

### 支付配置（payment.js）

```javascript
const PAYMENT_CONFIG = {
    API_URL: 'http://localhost:3003',  // 支付服务器地址
    PRODUCT_INFO: {
        id: 'premium_access',
        name: 'Attention Span Tracker 完整版',
        price: 0.01, // 元
        amount: 1    // 分
    }
};
```

### 微信支付配置（payment-server.js）

已在 `nativePaySDK/payment-server.js` 中配置：

```javascript
const WECHAT_CONFIG = {
    appid: 'wx038890243a70a4dd',
    mchid: '1728944790',
    description: '在线支付',
    privateKeyPath: './apiclient_key.pem',
    serialNo: '52F02EAF8C0DD35EA38596B1989AA75ADE0AE94E',
    apiKey: '1579482ymx94yyds91nbnbnbnbnbnbnb'
};
```

## 💾 数据存储

支付状态保存在浏览器的 `localStorage` 中：

- `isPremiumUser` - 是否为付费用户（'true'/'false'）
- `premiumOrderNo` - 订单号
- `premiumActivatedAt` - 激活时间

## 🔍 调试信息

打开浏览器控制台（F12）可以查看详细的调试信息：

- 支付状态检查
- 订单创建过程
- 二维码生成
- 支付轮询状态
- 功能解锁日志

## ⚠️ 注意事项

### 必须先启动支付服务器
如果支付服务器未运行，点击购买按钮会提示错误：
```
网络错误，请确保支付服务器已启动
运行命令: cd /Users/apple/Downloads/nativePaySDK && node payment-server.js
```

### 浏览器兼容性
- 建议使用现代浏览器（Chrome、Firefox、Safari、Edge）
- 需要支持 localStorage 和 Fetch API

### 支付限制
- 当前配置为测试环境
- 支付金额：0.01元（1分钱）
- 订单有效期：30分钟

## 🎨 界面说明

### 购买横幅
- 位置：页面顶部
- 颜色：紫色渐变背景
- 显示条件：未付费用户
- 隐藏条件：已付费用户

### 锁定遮罩
未付费时，以下功能显示锁定遮罩：
- 时间统计部分
- 活动记录部分
- 遮罩显示："🔒 解锁完整版以使用此功能"

### 支付模态框
- 深色主题设计
- 显示二维码、订单号、金额
- 实时支付状态提示
- 支持点击背景或关闭按钮关闭

### 成功模态框
- 支付成功动画效果
- 显示"✨ 已解锁完整版"徽章
- 点击"开始使用"按钮关闭

## 🔄 重置支付状态（测试用）

如需重置支付状态进行测试，在浏览器控制台运行：

```javascript
localStorage.removeItem('isPremiumUser');
localStorage.removeItem('premiumOrderNo');
localStorage.removeItem('premiumActivatedAt');
location.reload();
```

## 📞 技术支持

如遇问题，请检查：

1. ✅ 支付服务器是否正常运行
2. ✅ 控制台是否有错误信息
3. ✅ 网络连接是否正常
4. ✅ 浏览器是否支持所需功能

## 🎉 完成

现在你可以：
1. 启动支付服务器
2. 打开网站
3. 体验完整的支付购买流程
4. 享受解锁后的所有功能

祝使用愉快！🚀

