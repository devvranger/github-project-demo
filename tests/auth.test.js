/**
 * 认证模块测试
 * 测试登录、注册和相关功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AuthService from '../src/auth/login.js';
import RegisterService from '../src/auth/register.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = vi.fn();

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('应该成功登录并保存令牌', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          user: { id: 1, email: 'test@example.com' },
          token: 'mock-jwt-token'
        })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('test@example.com');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'mock-jwt-token');
    });

    it('应该处理登录失败', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Unauthorized'
      };
      
      fetch.mockResolvedValueOnce(mockResponse);

      const result = await AuthService.login('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.message).toContain('登录失败');
    });

    it('应该处理网络错误', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await AuthService.login('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });

  describe('logout', () => {
    it('应该清除本地存储并重定向', () => {
      // Mock window.location
      delete window.location;
      window.location = { href: '' };

      AuthService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_profile');
      expect(window.location.href).toBe('/login');
    });
  });

  describe('isAuthenticated', () => {
    it('应该在有有效令牌时返回true', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjo5OTk5OTk5OTk5fQ.Lp-38RKzJl_DgZeq6HjBqVdHhHt8rLzV8rI5CKZyFk8';
      localStorageMock.getItem.mockReturnValue(validToken);

      const result = AuthService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('应该在没有令牌时返回false', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = AuthService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getAuthHeaders', () => {
    it('应该返回包含Authorization头的对象', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      const headers = AuthService.getAuthHeaders();

      expect(headers).toEqual({ Authorization: 'Bearer mock-token' });
    });

    it('应该在没有令牌时返回空对象', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const headers = AuthService.getAuthHeaders();

      expect(headers).toEqual({});
    });
  });
});

describe('RegisterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUserData', () => {
    it('应该验证有效的用户数据', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        username: 'testuser',
        fullName: 'Test User'
      };

      const result = RegisterService.validateUserData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测无效的邮箱', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        username: 'testuser',
        fullName: 'Test User'
      };

      const result = RegisterService.validateUserData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('请输入有效的邮箱地址');
    });

    it('应该检测弱密码', () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: '123456',
        confirmPassword: '123456',
        username: 'testuser',
        fullName: 'Test User'
      };

      const result = RegisterService.validateUserData(weakPasswordData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('密码'))).toBe(true);
    });

    it('应该检测密码不匹配', () => {
      const mismatchData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        username: 'testuser',
        fullName: 'Test User'
      };

      const result = RegisterService.validateUserData(mismatchData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('两次输入的密码不一致');
    });
  });

  describe('isValidEmail', () => {
    it('应该验证有效邮箱', () => {
      expect(RegisterService.isValidEmail('test@example.com')).toBe(true);
      expect(RegisterService.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('应该拒绝无效邮箱', () => {
      expect(RegisterService.isValidEmail('invalid')).toBe(false);
      expect(RegisterService.isValidEmail('test@')).toBe(false);
      expect(RegisterService.isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('应该验证强密码', () => {
      expect(RegisterService.isStrongPassword('Password123!')).toBe(true);
      expect(RegisterService.isStrongPassword('MyStr0ng@Pass')).toBe(true);
    });

    it('应该拒绝弱密码', () => {
      expect(RegisterService.isStrongPassword('password')).toBe(false);
      expect(RegisterService.isStrongPassword('PASSWORD')).toBe(false);
      expect(RegisterService.isStrongPassword('12345678')).toBe(false);
      expect(RegisterService.isStrongPassword('Password123')).toBe(false); // 缺少特殊字符
    });
  });

  describe('register', () => {
    it('应该成功注册用户', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: '注册成功',
          user: { id: 1, email: 'test@example.com' }
        })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);

      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        username: 'testuser',
        fullName: 'Test User'
      };

      const result = await RegisterService.register(userData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('注册成功');
    });

    it('应该处理注册失败', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({
          message: '邮箱已存在',
          errors: ['该邮箱已被注册']
        })
      };
      
      fetch.mockResolvedValueOnce(mockResponse);

      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        username: 'testuser',
        fullName: 'Test User'
      };

      const result = await RegisterService.register(userData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('邮箱已存在');
    });
  });
});
