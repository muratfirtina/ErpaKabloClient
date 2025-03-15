import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  constructor() {}

  // İstemci tarafında şifreleme işlemlerini kaldırdık
  // Artık sadece aktivasyon için URL parametrelerini kullanıyoruz
  
  // Basit güvenlik amacıyla kullanılabilecek yardımcı fonksiyonlar ekleyebiliriz
  encodeBase64Url(data: string): string {
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  
  decodeBase64Url(data: string): string {
    let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return atob(base64);
  }
}