// ==================== 微信支付功能 ====================

const PAYMENT_CONFIG = {
    API_URL: 'https://wechat-y-server-vjfbztievl.cn-shanghai.fcapp.run',
    PRODUCT_INFO: {
        id: 'premium_access',
        name: 'Attention Span Tracker 完整版',
        price: 99.00, // 元
        amount: 9900    // 分
    },
    DEV_MODE: false  // 生产模式：使用真实微信支付
};

let currentOrderNo = null;
let pollInterval = null;

// 免费试用配置
const FREE_TRIAL_LIMIT = 2; // 免费查看次数

// 初始化支付功能
function initPayment() {
    console.log('初始化支付功能...');
    checkPaymentStatus();
    
    // 绑定购买按钮事件
    const buyBtn = document.getElementById('premium-buy-btn');
    if (buyBtn) {
        buyBtn.addEventListener('click', handlePurchaseClick);
    }
    
    // 绑定模态框关闭事件
    const closeModalBtn = document.getElementById('payment-close-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePaymentModal);
    }
    
    const closeSuccessBtn = document.getElementById('payment-success-close-btn');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', closeSuccessModal);
    }
    
    // 点击模态框背景关闭
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
        paymentModal.addEventListener('click', (e) => {
            if (e.target.id === 'payment-modal') {
                closePaymentModal();
            }
        });
    }
    
    const successModal = document.getElementById('payment-success-modal');
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target.id === 'payment-success-modal') {
                closeSuccessModal();
            }
        });
    }
}

// 检查支付状态
function checkPaymentStatus() {
    const isPaid = localStorage.getItem('isPremiumUser') === 'true';
    console.log('检查支付状态:', isPaid ? '已付费' : '未付费');
    
    if (isPaid) {
        unlockPremiumFeatures();
    } else {
        lockPremiumFeatures();
    }
}

// 检查试用次数
function checkTrialUsage() {
    const trialCount = parseInt(localStorage.getItem('trialViewCount') || '0');
    return trialCount < FREE_TRIAL_LIMIT;
}

// 增加试用次数
function incrementTrialUsage() {
    const trialCount = parseInt(localStorage.getItem('trialViewCount') || '0');
    localStorage.setItem('trialViewCount', (trialCount + 1).toString());
    console.log(`试用次数：${trialCount + 1}/${FREE_TRIAL_LIMIT}`);
}

// 获取剩余试用次数
function getRemainingTrials() {
    const trialCount = parseInt(localStorage.getItem('trialViewCount') || '0');
    return Math.max(0, FREE_TRIAL_LIMIT - trialCount);
}

// 锁定高级功能
function lockPremiumFeatures() {
    console.log('锁定高级功能');
    
    const remainingTrials = getRemainingTrials();
    
    // 更新购买提示文字
    const lockMessage = document.querySelector('.premium-lock-message');
    if (lockMessage) {
        const messageText = lockMessage.querySelector('p');
        if (remainingTrials > 0) {
            messageText.textContent = `剩余 ${remainingTrials} 次免费查看机会，试用后解锁所有功能`;
            lockMessage.style.display = 'none'; // 有试用次数时先隐藏
        } else {
            messageText.textContent = '试用次数已用完，购买后永久使用所有高级功能';
            lockMessage.style.display = 'block';
        }
    }
    
    // 锁定统计功能
    const statsSection = document.querySelector('.statistics');
    if (statsSection) {
        if (remainingTrials > 0) {
            statsSection.classList.remove('premium-locked');
        } else {
            statsSection.classList.add('premium-locked');
        }
    }
    
    // 锁定活动记录
    const timelineSection = document.querySelector('.timeline');
    if (timelineSection) {
        if (remainingTrials > 0) {
            timelineSection.classList.remove('premium-locked');
        } else {
            timelineSection.classList.add('premium-locked');
        }
    }
    
    // 监听统计按钮点击
    addTrialClickListeners();
}

// 解锁高级功能
function unlockPremiumFeatures() {
    console.log('解锁高级功能');
    
    // 隐藏购买遮罩
    const lockMessage = document.querySelector('.premium-lock-message');
    if (lockMessage) {
        lockMessage.style.display = 'none';
    }
    
    // 解锁统计功能
    const statsSection = document.querySelector('.statistics');
    if (statsSection) {
        statsSection.classList.remove('premium-locked');
    }
    
    // 解锁活动记录
    const timelineSection = document.querySelector('.timeline');
    if (timelineSection) {
        timelineSection.classList.remove('premium-locked');
    }
}

// 处理购买按钮点击
async function handlePurchaseClick() {
    console.log('点击购买按钮');
    await createPaymentOrder();
}

// 创建支付订单
async function createPaymentOrder() {
    try {
        console.log('正在创建支付订单...');
        
        const response = await fetch(`${PAYMENT_CONFIG.API_URL}/api/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoId: PAYMENT_CONFIG.PRODUCT_INFO.id,
                videoTitle: PAYMENT_CONFIG.PRODUCT_INFO.name,
                amount: PAYMENT_CONFIG.PRODUCT_INFO.amount
            })
        });
        
        const result = await response.json();
        console.log('支付订单创建结果:', result);
        
        if (result.success && result.codeUrl) {
            currentOrderNo = result.orderNo;
            showPaymentModal(result.codeUrl, result.orderNo);
            startPaymentPolling(result.orderNo);
        } else {
            alert('支付订单创建失败: ' + (result.message || '未知错误'));
        }
        
    } catch (error) {
        console.error('创建支付订单失败:', error);
        alert('网络错误，请确保支付服务器已启动\n\n运行命令: cd /Users/apple/Downloads/nativePaySDK && node payment-server.js');
    }
}

// 显示支付模态框
function showPaymentModal(codeUrl, orderNo) {
    console.log('显示支付模态框');
    
    const modal = document.getElementById('payment-modal');
    const qrcodeElement = document.getElementById('payment-qrcode');
    
    if (!modal || !qrcodeElement) {
        console.error('找不到支付模态框元素');
        return;
    }
    
    // 清空之前的二维码
    qrcodeElement.innerHTML = '';
    
    // 显示订单信息
    const orderNoElement = document.getElementById('payment-order-no');
    if (orderNoElement) {
        orderNoElement.textContent = orderNo;
    }
    
    // 开发模式：显示模拟支付按钮
    if (PAYMENT_CONFIG.DEV_MODE) {
        qrcodeElement.innerHTML = `
            <div style="text-align: center;">
                <div style="padding: 30px; background: #f0f9ff; border-radius: 12px; margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🧪</div>
                    <h3 style="color: #0369a1; margin-bottom: 10px;">开发测试模式</h3>
                    <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
                        由于微信商户号未开通Native支付权限<br/>
                        当前使用模拟支付模式进行测试
                    </p>
                    <button id="mock-pay-btn" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 12px 32px;
                        font-size: 16px;
                        font-weight: 600;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">
                        点击模拟支付成功
                    </button>
                </div>
                <p style="color: #999; font-size: 12px;">
                    提示：真实环境需要在微信商户平台开通Native支付权限
                </p>
            </div>
        `;
        
        // 绑定模拟支付按钮
        const mockPayBtn = document.getElementById('mock-pay-btn');
        if (mockPayBtn) {
            mockPayBtn.addEventListener('click', () => mockPayment(orderNo));
            mockPayBtn.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
            });
            mockPayBtn.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        }
    } else {
        // 生产模式：生成真实二维码
        try {
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrcodeElement, {
                    text: codeUrl,
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                console.log('✅ 二维码生成成功');
            } else {
                throw new Error('QRCode库未加载');
            }
        } catch (error) {
            console.error('❌ 二维码生成失败:', error);
            // 降级方案：使用在线API
            qrcodeElement.innerHTML = `
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(codeUrl)}" 
                     alt="支付二维码" style="width: 200px; height: 200px; border-radius: 8px;">
            `;
        }
    }
    
    // 显示模态框
    modal.classList.add('active');
}

// 模拟支付
async function mockPayment(orderNo) {
    console.log('🧪 执行模拟支付:', orderNo);
    
    try {
        const response = await fetch(`${PAYMENT_CONFIG.API_URL}/api/mock-payment/${orderNo}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('模拟支付结果:', result);
        
        if (result.success) {
            // 等待一下，模拟真实支付的延迟
            setTimeout(() => {
                console.log('🎉 模拟支付成功，等待轮询检测...');
            }, 500);
        }
    } catch (error) {
        console.error('模拟支付失败:', error);
        alert('模拟支付失败: ' + error.message);
    }
}

// 关闭支付模态框
function closePaymentModal() {
    console.log('关闭支付模态框');
    
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // 停止轮询
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

// 开始轮询支付状态
function startPaymentPolling(orderNo) {
    console.log('开始轮询支付状态，订单号:', orderNo);
    
    pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`${PAYMENT_CONFIG.API_URL}/api/payment-status/${orderNo}`);
            const result = await response.json();
            
            console.log('支付状态查询结果:', result);
            
            if (result.success && result.status === 'success') {
                console.log('✅ 支付成功！');
                clearInterval(pollInterval);
                
                // 保存支付状态
                localStorage.setItem('isPremiumUser', 'true');
                localStorage.setItem('premiumOrderNo', orderNo);
                localStorage.setItem('premiumActivatedAt', new Date().toISOString());
                
                // 关闭支付模态框
                closePaymentModal();
                
                // 显示成功提示
                showSuccessModal();
                
                // 解锁功能
                unlockPremiumFeatures();
            }
            
        } catch (error) {
            console.error('查询支付状态失败:', error);
        }
    }, 3000); // 每3秒查询一次
    
    // 5分钟后停止轮询
    setTimeout(() => {
        if (pollInterval) {
            console.log('轮询超时，停止检查');
            clearInterval(pollInterval);
        }
    }, 5 * 60 * 1000);
}

// 显示成功模态框
function showSuccessModal() {
    console.log('显示支付成功模态框');
    
    const modal = document.getElementById('payment-success-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// 关闭成功模态框
function closeSuccessModal() {
    console.log('关闭支付成功模态框');
    
    const modal = document.getElementById('payment-success-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPayment);
} else {
    initPayment();
}

