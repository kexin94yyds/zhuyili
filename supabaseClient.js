// Supabase 客户端配置
// 注意：这是浏览器版本，不使用 ES6 模块

// 你的 Supabase 项目配置
const SUPABASE_URL = 'https://dpmrdhjltbhbhguuwxwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbXJkaGpsdGJoYmhndXV3eHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTE0ODgsImV4cCI6MjA3MjQ4NzQ4OH0.P8LgzNlDVXc3criWEQ3RPwKKeMb3OG8KsCtTYpiUA-w';
// 创建 Supabase 客户端
let supabaseInstance = null;

// 初始化 Supabase 客户端（单例模式，防止重复创建）
function initSupabaseClient() {
    // 已经初始化过，直接返回
    if (supabaseInstance !== null) {
        return true;
    }
    
    try {
        // 检查 Supabase SDK 是否已加载
        if (typeof window.supabase !== 'undefined') {
            supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase 客户端初始化成功');
            return true;
        } else {
            console.warn('⚠️ Supabase SDK 未加载');
            return false;
        }
    } catch (error) {
        console.error('❌ Supabase 初始化失败:', error);
        return false;
    }
}

// 导出到全局作用域（浏览器兼容）
window.supabaseClient = {
    init: initSupabaseClient,
    getClient: () => supabaseInstance,
    isConnected: () => supabaseInstance !== null,
    // 测试连接
    testConnection: async function() {
        if (!supabaseInstance) {
            console.log('❌ Supabase 客户端未初始化');
            return false;
        }
        
        try {
            // 尝试获取当前用户（不需要登录）
            const { data, error } = await supabaseInstance.auth.getUser();
            if (error && error.message !== 'Invalid JWT') {
                console.log('❌ Supabase 连接测试失败:', error.message);
                return false;
            }
            console.log('✅ Supabase 连接测试成功');
            return true;
        } catch (error) {
            console.log('❌ Supabase 连接测试异常:', error);
            return false;
        }
    }
};

// 页面加载完成后自动初始化（只注册一次）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabaseClient, { once: true });
} else {
    initSupabaseClient();
}
