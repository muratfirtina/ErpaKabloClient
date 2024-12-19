export interface SitemapStatus {
    url: string;
    lastChecked: Date;
    isAccessible: boolean;
    responseTime: number;
    fileSize: number;
    urlCount: number;
    lastModified: Date | null;
    errors?: string[];
  }
  
  export interface SitemapIssue {
    severity: 'high' | 'medium' | 'low';
    message: string;
    sitemap?: string;
  }
  
  export interface SitemapMonitoringReport {
    sitemaps: SitemapStatus[];
    totalUrls: number;
    lastFullCheck: Date;
    healthScore: number;
    issues: SitemapIssue[];
  }
  
  export interface SitemapOperationResponse {
    success: boolean;
    message: string;
    errors?: string[];
  }

  export interface SitemapResponse {
    success: boolean;
    message: string;
  }
  