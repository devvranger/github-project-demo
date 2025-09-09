/**
 * 用户注册模块
 * 处理新用户注册和账户验证
 */

import AuthService from './login.js';

class RegisterService {
  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
  }

  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @param {string} userData.email - 邮箱
   * @param {string} userData.password - 密码
   * @param {string} userData.confirmPassword - 确认密码
   * @param {string} userData.username - 用户名
   * @param {string} userData.fullName - 全名
   * @returns {Promise<Object>} 注册结果
   */
  async register(userData) {
    try {
      // 前端验证
      const validation = this.validateUserData(userData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          errors: validation.errors
        };
      }

      const response = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          username: userData.username,
          fullName: userData.fullName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || '注册失败',
          errors: data.errors || []
        };
      }

      return {
        success: true,
        message: '注册成功！请检查邮箱进行账户验证。',
        user: data.user
      };
    } catch (error) {
      console.error('注册错误:', error);
      return {
        success: false,
        message: '注册失败，请稍后重试'
      };
    }
  }

  /**
   * 验证用户注册数据
   * @param {Object} userData - 用户数据
   * @returns {Object} 验证结果
   */
  validateUserData(userData) {
    const errors = [];

    // 邮箱验证
    if (!userData.email) {
      errors.push('邮箱不能为空');
    } else if (!this.isValidEmail(userData.email)) {
      errors.push('请输入有效的邮箱地址');
    }

    // 密码验证
    if (!userData.password) {
      errors.push('密码不能为空');
    } else if (userData.password.length < 8) {
      errors.push('密码长度至少8位');
    } else if (!this.isStrongPassword(userData.password)) {
      errors.push('密码必须包含大小写字母、数字和特殊字符');
    }

    // 确认密码验证
    if (userData.password !== userData.confirmPassword) {
      errors.push('两次输入的密码不一致');
    }

    // 用户名验证
    if (!userData.username) {
      errors.push('用户名不能为空');
    } else if (userData.username.length < 3) {
      errors.push('用户名长度至少3位');
    } else if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
      errors.push('用户名只能包含字母、数字和下划线');
    }

    // 全名验证
    if (!userData.fullName) {
      errors.push('姓名不能为空');
    } else if (userData.fullName.length < 2) {
      errors.push('姓名长度至少2位');
    }

    return {
      isValid: errors.length === 0,
      errors,
      message: errors.length > 0 ? errors[0] : '验证通过'
    };
  }

  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @returns {boolean} 是否为强密码
   */
  isStrongPassword(password) {
    // 至少包含一个大写字母、一个小写字母、一个数字和一个特殊字符
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    return strongRegex.test(password);
  }

  /**
   * 发送邮箱验证
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object>} 发送结果
   */
  async sendEmailVerification(email) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        message: data.message || (response.ok ? '验证邮件已发送' : '发送失败')
      };
    } catch (error) {
      console.error('发送验证邮件错误:', error);
      return {
        success: false,
        message: '发送失败，请稍后重试'
      };
    }
  }

  /**
   * 验证邮箱令牌
   * @param {string} token - 验证令牌
   * @returns {Promise<Object>} 验证结果
   */
  async verifyEmail(token) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // 自动登录已验证的用户
        localStorage.setItem('auth_token', data.token);
      }

      return {
        success: response.ok,
        message: data.message || (response.ok ? '邮箱验证成功' : '验证失败'),
        autoLogin: response.ok && data.token
      };
    } catch (error) {
      console.error('邮箱验证错误:', error);
      return {
        success: false,
        message: '验证失败，请稍后重试'
      };
    }
  }
}

export default new RegisterService();
