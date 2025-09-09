/**
 * 用户登录模块
 * 实现用户认证和会话管理功能
 */

class AuthService {
  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
    this.tokenKey = 'auth_token';
  }

  /**
   * 用户登录
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`登录失败: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 保存认证令牌
      if (data.token) {
        localStorage.setItem(this.tokenKey, data.token);
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
        message: '登录成功'
      };
    } catch (error) {
      console.error('登录错误:', error);
      return {
        success: false,
        message: error.message || '登录失败，请稍后重试'
      };
    }
  }

  /**
   * 用户登出
   */
  logout() {
    localStorage.removeItem(this.tokenKey);
    // 清除其他用户相关数据
    localStorage.removeItem('user_profile');
    
    // 重定向到登录页面
    window.location.href = '/login';
  }

  /**
   * 获取当前认证令牌
   * @returns {string|null} 认证令牌
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * 检查用户是否已登录
   * @returns {boolean} 登录状态
   */
  isAuthenticated() {
    const token = this.getToken();
    return token !== null && !this.isTokenExpired(token);
  }

  /**
   * 检查令牌是否过期
   * @param {string} token - JWT令牌
   * @returns {boolean} 是否过期
   */
  isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('令牌解析错误:', error);
      return true;
    }
  }

  /**
   * 获取认证头部
   * @returns {Object} 包含Authorization头的对象
   */
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// 导出单例实例
export default new AuthService();
