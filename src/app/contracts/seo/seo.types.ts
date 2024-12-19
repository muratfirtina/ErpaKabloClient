export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  type?: string;
  image?: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  };
  url?: string;
  canonicalUrl?: string;
  alternateLanguages?: {
    [key: string]: string;
  };
  product?: ProductSeoConfig;
  structuredData?: object;
}

export interface ProductSeoConfig {
  price?: string;
  currency?: string;
  availability?: 'in stock' | 'out of stock';
  brand?: string;
  category?: string;
  condition?: 'new' | 'used' | 'refurbished';
  sku?: string;
}

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export type PageType = 'product' | 'category' | 'brand' | 'home' | 'blog' | 'article';

export interface SeoStatusResponse {
  sitemaps: SitemapStatus[];
  lastCheck: Date;
  healthScore: number;
  issues: SeoIssue[];
}

export interface SitemapStatus {
  url: string;
  lastModified: Date;
  urlCount: number;
  isAccessible: boolean;
  responseTime: number;
  fileSize: number;
  errors?: string[];
}

export interface SeoIssue {
  severity: 'high' | 'medium' | 'low';
  message: string;
  sitemap?: string;
}

export interface OptimizedImage {
  src: string;
  srcset: string;
  sizes: string;
  width: number;
  height: number;
  alt: string;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high' | 'low' | 'auto';
  format: string;
  fileSize: number;
  isWebpVersion: boolean;
  isAvifVersion: boolean;
}
