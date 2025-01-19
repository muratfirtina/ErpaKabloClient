import { Injectable } from "@angular/core";
import { SecurityConfig, DEFAULT_SECURITY_CONFIG } from "src/app/config/security.config";

@Injectable({
    providedIn: 'root'
  })
  export class RateLimitService {
    private requests: Map<string, number[]> = new Map();
    private readonly config: SecurityConfig;
  
    constructor() {
      this.config = DEFAULT_SECURITY_CONFIG;
    }
  
    checkRateLimit(url: string): boolean {
      // API istekleri için kontrol
      if (!url.includes('/api/')) {
        return true; // API isteği değilse limit kontrolü yapma
      }
  
      const now = Date.now();
      const windowStart = now - (this.config.rateLimiting.windowSizeInMinutes * 60 * 1000);
      
      let requests = this.requests.get(url) || [];
      requests = requests.filter(time => time > windowStart);
      
      if (requests.length >= this.config.rateLimiting.requestsPerMinute) {
        return false;
      }
      
      requests.push(now);
      this.requests.set(url, requests);
      return true;
    }
  
    clearRateLimits() {
      this.requests.clear();
    }
  }