// utils/cookieUtils.ts
export class CookieManager {
  // 쿠키 설정
  static setCookie(name: string, value: string, days: number = 7): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
    console.log(`✅ Cookie 설정됨: ${name}`);
  }

  // 쿠키 가져오기
  static getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const value = c.substring(nameEQ.length, c.length);
        console.log(`📖 Cookie 읽기: ${name} = ${value ? `${value.substring(0, 20)}...` : 'null'}`);
        return value;
      }
    }
    
    console.log(`📖 Cookie 읽기: ${name} = null`);
    return null;
  }

  // 쿠키 제거
  static removeCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.log(`🗑️ Cookie 제거됨: ${name}`);
  }

  // 모든 쿠키 확인 (디버깅용)
  static logAllCookies(): void {
    console.log('🔍 모든 쿠키:', document.cookie);
  }
}