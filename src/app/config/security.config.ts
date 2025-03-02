export interface SecurityConfig {
    rateLimiting: {
      requestsPerMinute: number;
      windowSizeInMinutes: number;
    };
    monitoring: {
      performance: {
        highLatencyThresholdMs: number;
        criticalLatencyThresholdMs: number;
      };
    };
    auth: {
      tokenRefreshThresholdMinutes: number;
      maxLoginAttempts: number;
      loginLockoutMinutes: number;
    };
    routes: {
      secureRoutePatterns: {
        product: RegExp;
        category: RegExp;
        brand: RegExp;
      };
    };
    inputs: {
      maxInputLength: number;
      emailRegex: RegExp;
      passwordMinLength: number;
    };
  }
  
  export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    rateLimiting: {
      requestsPerMinute: 60, // Frontend'de daha düşük tutuyoruz, backend ana kontrol
      windowSizeInMinutes: 1
    },
    monitoring: {
      performance: {
        highLatencyThresholdMs: 2000,    // 1 saniye
        criticalLatencyThresholdMs: 5000  // 3 saniye
      }
    },
    auth: {
      tokenRefreshThresholdMinutes: 5,
      maxLoginAttempts: 5,
      loginLockoutMinutes: 15
    },
    routes: {
      secureRoutePatterns: {
        product: /^([\w-]+)-p-([a-f0-9]{8})$/,
        category: /^([\w-]+)-c-([a-f0-9]{8})$/,
        brand: /^[\w-]+$/
      }
    },
    inputs: {
      maxInputLength: 255,
      emailRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      passwordMinLength: 8
    }
  };