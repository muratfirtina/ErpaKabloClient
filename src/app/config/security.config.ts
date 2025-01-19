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
    };
  }
  
  export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    rateLimiting: {
      requestsPerMinute: 60, // Frontend'de daha düşük tutuyoruz, backend ana kontrol
      windowSizeInMinutes: 1
    },
    monitoring: {
      performance: {
        highLatencyThresholdMs: 1000,    // 1 saniye
        criticalLatencyThresholdMs: 3000  // 3 saniye
      }
    },
    auth: {
      tokenRefreshThresholdMinutes: 5
    }
  };