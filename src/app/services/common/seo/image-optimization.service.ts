// image-optimization.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

import { OptimizedImage } from 'src/app/contracts/seo/seo.types';
import { environment } from 'src/environments/environment.prod';

interface ImageOptimizationResponse {
  optimizedUrl: string;
  width: number;
  height: number;
  formats: {
    avif: string[];
    webp: string[];
    original: string[];
  };
  placeholder: string;
  metadata: {
    alt: string;
    title?: string;
    caption?: string;
    focalPoint?: { x: number; y: number };
  };
}

interface ProcessedVersionInfo {
  url: string;
  size: string; // 'thumbnail', 'small', 'medium', 'large'
  format: string;
  fileSize: number;
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {
  private readonly versionCache = new Map<string, ProcessedVersionInfo[]>();
  private readonly apiUrl = `${environment.baseUrl}/api/images`;
  private readonly imageLoadMetrics: Map<string, number> = new Map();

  constructor(private http: HttpClient) {}

  async optimizeImage(params: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    loading?: 'lazy' | 'eager';
    fetchpriority?: 'high' | 'low' | 'auto';
  }): Promise<OptimizedImage> {
    const startTime = performance.now();

    try {
      const response = await firstValueFrom(
        this.http.post<ImageOptimizationResponse>(`${this.apiUrl}/optimize`, params)
      );

      this.imageLoadMetrics.set(params.src, performance.now() - startTime);

      return {
        src: response.optimizedUrl,
        srcset: this.generateSrcSet(response.formats),
        sizes: this.generateSizes(response.width),
        width: response.width,
        height: response.height,
        alt: response.metadata.alt || params.alt,
        loading: params.loading || 'lazy',
        fetchpriority: params.fetchpriority || 'auto',
        // Add the missing properties to match OptimizedImage interface
        format: this.determineFormat(response.formats),
        fileSize: this.calculateTotalFileSize(response.formats),
        isWebpVersion: response.formats.webp.length > 0,
        isAvifVersion: response.formats.avif.length > 0
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      return {
        src: params.src,
        srcset: '',
        sizes: '',
        width: params.width || 0,
        height: params.height || 0,
        alt: params.alt,
        loading: params.loading || 'lazy',
        fetchpriority: params.fetchpriority || 'auto',
        format: this.getFormatFromUrl(params.src),
        fileSize: 0,
        isWebpVersion: false,
        isAvifVersion: false
      };
    }
  }

  generateSourceSet(basePath: string, width: number, format: 'avif' | 'webp'): string {
    const sizes = [320, 480, 768, 1024, 1200];
    return sizes
      .map(size => {
        const scaledWidth = Math.min(size, width);
        return `${this.getOptimizedUrl(basePath, scaledWidth, format)} ${scaledWidth}w`;
      })
      .join(', ');
  }

  generateSizes(maxWidth: number): string {
    return `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`;
  }

  reportImageLoadMetrics(src: string): void {
    const loadTime = this.imageLoadMetrics.get(src);
    if (loadTime) {
      // Web Vitals metriklerine ekle
      if (window.performance && window.performance.mark) {
        window.performance.mark(`image-load-${src}`);
      }
      
      // Analytics'e gönder
      this.reportToAnalytics({
        eventName: 'image_load',
        url: src,
        loadTime: loadTime,
        timestamp: new Date().toISOString()
      });
    }
  }

  private getOptimizedUrl(basePath: string, width: number, format: string): string {
    return `${this.apiUrl}/optimize/${encodeURIComponent(basePath)}?w=${width}&fmt=${format}`;
  }

  private generateSrcSet(formats: ImageOptimizationResponse['formats']): string {
    return Object.entries(formats)
      .map(([format, urls]) =>
        urls.map(url => `${url} ${this.extractWidth(url)}w`).join(', ')
      )
      .join(', ');
  }

  private extractWidth(url: string): number {
    const match = url.match(/w=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private reportToAnalytics(data: any): void {
    // Analytics implementasyonu
    console.log('Image load metrics:', data);
  }
  private determineFormat(formats: ImageOptimizationResponse['formats']): string {
    if (formats.avif.length > 0) return 'avif';
    if (formats.webp.length > 0) return 'webp';
    return 'original';
  }

  private calculateTotalFileSize(formats: ImageOptimizationResponse['formats']): number {
    // Initialize total size
    let totalSize = 0;
    
    // Helper function to process each format type
    const processFormatUrls = (urls: string[], formatType: string) => {
      urls.forEach(url => {
        // Get the version info from cache if available
        const versionInfo = this.getVersionInfoFromCache(url);
        
        if (versionInfo) {
          // Use cached version info
          totalSize += versionInfo.fileSize;
        } else {
          // If not in cache, process the version info
          const version = this.processVersionInfo(url, formatType);
          if (version) {
            totalSize += version.fileSize;
            // Cache the version info for future use
            this.cacheVersionInfo(url, version);
          }
        }
      });
    };

    // Process each format type
    processFormatUrls(formats.avif, 'avif');
    processFormatUrls(formats.webp, 'webp');
    processFormatUrls(formats.original, 'original');

    return totalSize;
  }

  private getVersionInfoFromCache(url: string): ProcessedVersionInfo | undefined {
    const cacheKey = this.generateCacheKey(url);
    const cachedVersions = this.versionCache.get(cacheKey);
    return cachedVersions?.find(v => v.url === url);
  }

  private cacheVersionInfo(url: string, versionInfo: ProcessedVersionInfo): void {
    const cacheKey = this.generateCacheKey(url);
    const existingVersions = this.versionCache.get(cacheKey) || [];
    this.versionCache.set(cacheKey, [...existingVersions, versionInfo]);
    
    // Implement cache cleanup to prevent memory leaks
    this.cleanupCache();
  }

  private generateCacheKey(url: string): string {
    // Generate a unique key based on the base URL (without size/format parameters)
    return url.split('?')[0];
  }

  private processVersionInfo(url: string, format: string): ProcessedVersionInfo | null {
    try {
      // Extract size and dimensions from URL parameters
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const width = parseInt(urlParams.get('w') || '0');
      const size = this.getSizeFromWidth(width);
      
      return {
        url,
        size,
        format,
        fileSize: this.estimateFileSizeFromDimensions(width, format),
        width,
        height: this.calculateHeight(width)
      };
    } catch (error) {
      console.error('Error processing version info:', error);
      return null;
    }
  }

  private getSizeFromWidth(width: number): string {
    if (width <= 150) return 'thumbnail';
    if (width <= 480) return 'small';
    if (width <= 768) return 'medium';
    return 'large';
  }

  private estimateFileSizeFromDimensions(width: number, format: string): number {
    // Implement a reasonable file size estimation based on dimensions and format
    const baseSize = width * this.calculateHeight(width) * 4; // RGBA pixels
    
    // Apply format-specific compression ratios
    const compressionRatio = {
      'avif': 0.3,  // AVIF has best compression
      'webp': 0.5,  // WebP has good compression
      'original': 0.8 // Original format (assumed JPEG/PNG)
    }[format] || 0.8;

    return Math.round(baseSize * compressionRatio);
  }

  private calculateHeight(width: number): number {
    // Implement aspect ratio calculation based on your requirements
    // This is a simple 16:9 example
    return Math.round(width * (9/16));
  }

  private cleanupCache(): void {
    // Implement cache cleanup strategy
    // For example, remove entries older than 5 minutes
    const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    if (this.versionCache.size > 100) { // Arbitrary limit
      this.versionCache.clear();
    }
  }

  // Helper method to get format from URL
  private getFormatFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }
}