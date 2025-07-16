// utils/apiClient.ts
import { TokenManager } from './tokenUtils';

export class ApiClient {
  private static readonly BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // 기본 fetch 래퍼 (토큰 자동 포함)
  static async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = TokenManager.getToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        // 토큰이 있으면 Authorization 헤더에 추가
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const url = `${this.BASE_URL}${endpoint}`;
    
    console.log('🌐 API 요청:', {
      method: config.method || 'GET',
      url,
      hasToken: !!token,
      headers: config.headers
    });

    try {
      const response = await fetch(url, config);
      
      // 401 Unauthorized 처리 (토큰 만료)
      if (response.status === 401) {
        console.log('🚫 401 Unauthorized - 토큰 만료, 로그아웃 처리');
        TokenManager.removeToken();
        window.location.href = '/login';
        throw new Error('Token expired');
      }

      return response;
    } catch (error) {
      console.error('❌ API 요청 실패:', error);
      throw error;
    }
  }

  // GET 요청
  static async get(endpoint: string, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  // POST 요청
  static async post(endpoint: string, data?: unknown, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT 요청
  static async put(endpoint: string, data?: unknown, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE 요청
  static async delete(endpoint: string, options?: RequestInit): Promise<Response> {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // JSON 응답 파싱 헬퍼
  static async getJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await this.get(endpoint, options);
    return response.json();
  }

  static async postJson<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const response = await this.post(endpoint, data, options);
    return response.json();
  }

  static async putJson<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    const response = await this.put(endpoint, data, options);
    return response.json();
  }

  static async deleteJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await this.delete(endpoint, options);
    return response.json();
  }
}

// 편의성을 위한 기본 export
export default ApiClient;