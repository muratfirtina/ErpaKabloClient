import { Injectable } from '@angular/core';
import { SecurityConfig, DEFAULT_SECURITY_CONFIG } from '../../config/security.config';


@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private readonly config: SecurityConfig;

  constructor() {
    this.config = DEFAULT_SECURITY_CONFIG;
  }

  // Token işlemleri
  validateToken(token: string): boolean {
    try {
      const decodedToken: any = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      return decodedToken.exp > currentTime;
    } catch {
      return false;
    }
  }
  

  async needsTokenRefresh(token: string): Promise<boolean> {
    try {
      const decodedToken: any = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      const thresholdSeconds = this.config.auth.tokenRefreshThresholdMinutes * 60;
      return decodedToken.exp - currentTime < thresholdSeconds;
    } catch {
      return true;
    }
  }


  validateRouteParam(param: string): { isValid: boolean; expectedId?: string; type?: 'product' | 'category' | 'brand' } {
    // Ürün format kontrolü: [ürün-adı]-p-[8 karakter hexadecimal]
    const productPattern = /^([\w-]+)-p-([a-f0-9]{8})$/;
    // Kategori format kontrolü: [kategori-adı]-c-[8 karakter hexadecimal]
    const categoryPattern = /^([\w-]+)-c-([a-f0-9]{8})$/;
    // Marka format kontrolü: [marka-adı]-b-[8 karakter hexadecimal]
    const brandPattern = /^[\w-]+$/;

    // Ürün kontrolü
    const productMatch = param.match(productPattern);
    if (productMatch) {
      const [, slug, id] = productMatch;
      return {
        isValid: true,
        expectedId: `${slug}-p-${id}`,
        type: 'product'
      };
    }

    // Kategori kontrolü
    const categoryMatch = param.match(categoryPattern);
    if (categoryMatch) {
      const [, slug, id] = categoryMatch;
      return {
        isValid: true,
        expectedId: `${slug}-c-${id}`,
        type: 'category'
      };
    }

    // Marka kontrolü
    const brandMatch = param.match(brandPattern);
    if (brandMatch) {
      return {
        isValid: true,
        expectedId: param,
        type: 'brand'
      };
    }

    return { isValid: false };
  }

  sanitizeRouteParam(param: string): string {
    // Türkçe karakterleri ve diğer özel karakterleri temizle
    return param
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-') // Birden fazla tire varsa tek tireye çevir
      .replace(/^-|-$/g, ''); // Baştaki ve sondaki tireleri kaldır
  }

  // XSS Koruma
  sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // URL Güvenliği
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Güvenli URL oluşturma
  createSafeUrl(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(
        this.sanitizeInput(key),
        this.sanitizeInput(value)
      );
    });
    return url.toString();
  }
}

function jwt_decode(token: string): any {
    throw new Error('Function not implemented.');
}
