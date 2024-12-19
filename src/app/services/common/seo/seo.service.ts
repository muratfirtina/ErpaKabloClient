// seo.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { MetaTagConfig, MetaTagService } from './meta-tag.service';
import { OpenGraphData, OpenGraphService } from './open-graph.service';
import { SitemapService } from './sitemap.service';
import { Observable } from 'rxjs';
import { SeoConfig, ProductSeoConfig, WebVitalsMetric, PageType  } from 'src/app/contracts/seo/seo.types';
import { ImageOptimizationService } from './image-optimization.service';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly cacheTimeout = 3600000; // 1 saat
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly baseUrl: string = 'https://your-domain.com'; // Değiştirilmeli

  private readonly defaultConfig: SeoConfig = {
    title: 'Your Site Name',
    description: 'Default site description',
    author: 'Your Company Name',
    type: 'website',
    keywords: [],  // Boş array ekledik
  };

  private readonly webVitalsThresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 }
  };

  constructor(
    private metaTagService: MetaTagService,
    private openGraphService: OpenGraphService,
    private sitemapService: SitemapService,
    private imageOptimizationService: ImageOptimizationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initWebVitals();
    }
  }

  // Public metodlar
  
  /**
   * Ana SEO güncelleme methodu
   */
  async updateSeo(config: Partial<SeoConfig>): Promise<void> {
    try {
      const fullConfig = { ...this.defaultConfig, ...config };
      
      await Promise.all([
        this.metaTagService.updateTags(this.convertToMetaTagConfig(fullConfig)),
        this.openGraphService.setOpenGraphTags(this.convertToOpenGraphData(fullConfig))
      ]);
      
      if (fullConfig.structuredData) {
        this.addStructuredData(fullConfig.structuredData);
      }

      this.handleCanonicalAndAlternateUrls(fullConfig);
      this.updateCache(this.router.url, fullConfig);
    } catch (error) {
      console.error('Error updating SEO:', error);
    }
  }

  /**
   * Sayfa tipi bazlı SEO optimizasyonu
   */
  async optimizePageSeo(pageType: PageType, data: any): Promise<void> {
    try {
      const cachedData = this.getFromCache(this.router.url);
      if (cachedData) {
        await this.updateSeo(cachedData);
        return;
      }

      const seoConfig = this.generateSeoConfigForPageType(pageType, data);
      await this.updateSeo(seoConfig);
    } catch (error) {
      console.error('Error optimizing page SEO:', error);
    }
  }

  async optimizeProductImages(product: any): Promise<void> {
    if (product.images) {
      const optimizedImages = await Promise.all(
        product.images.map(async (image: any) => {
          return this.imageOptimizationService.optimizeImage({
            src: image.url,
            alt: `${product.name} - ${image.alt || ''}`,
          });
        })
      );
      
      // Update product with optimized images
      product.images = optimizedImages;
    }
  }

  /**
   * Sitemap yönetimi
   */
  async manageSitemap(): Promise<void> {
    try {
      const routes = await this.generateDynamicSitemap();
      await this.sitemapService.submitSitemapsToSearchEngines();
    } catch (error) {
      console.error('Error managing sitemap:', error);
    }
  }

  // Private metodlar

  public initWebVitals(): void {
    if ('PerformanceObserver' in window) {
      this.observeWebVital('largest-contentful-paint', 'LCP');
      this.observeWebVital('first-input', 'FID');
      this.observeWebVital('layout-shift', 'CLS');
    }
  }

  private observeWebVital(entryType: string, metricName: string): void {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        const value = this.getMetricValue(entry, metricName);
        if (value !== null) {
          this.processWebVitalMetric({
            name: metricName,
            value,
            rating: this.getMetricRating(metricName, value)
          });
        }
      });
    }).observe({ entryTypes: [entryType] });
  }

  private addStructuredData(data: object): void {
    if (isPlatformBrowser(this.platformId)) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
    }
  }

  private updateCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private generateSeoConfigForPageType(pageType: PageType, data: any): Partial<SeoConfig> {
    switch (pageType) {
      case 'product':
        return this.generateProductSeoConfig(data);
      case 'category':
        return this.generateCategorySeoConfig(data);
      case 'brand':
        return this.generateBrandSeoConfig(data);
      case 'article':
      case 'blog':
        return this.generateArticleSeoConfig(data);
      case 'home':
      default:
        return this.generateHomeSeoConfig(data);
    }
  }

  private generateProductSeoConfig(data: any): Partial<SeoConfig> {
    return {
      title: `${data.name} - ${data.brand}`,
      description: this.truncateDescription(data.description),
      keywords: [data.brand, data.category, ...(data.tags || [])],
      type: 'product',
      image: {
        url: data.images?.[0]?.url,
        alt: data.name
      },
      product: {
        price: data.price?.toString(),
        currency: 'TRY',
        availability: data.stock > 0 ? 'in stock' : 'out of stock',
        brand: data.brand,
        category: data.category,
        sku: data.sku
      },
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.name,
        description: data.description,
        image: data.images?.[0]?.url,
        brand: {
          '@type': 'Brand',
          name: data.brand
        },
        offers: {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: 'TRY',
          availability: data.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        }
      }
    };
  }

  private generateCategorySeoConfig(data: any): Partial<SeoConfig> {
    return {
      title: `${data.name} - Kategori`,
      description: data.description || `${data.name} kategorisindeki tüm ürünleri keşfedin`,
      keywords: [data.name, 'kategori', ...(data.tags || [])],
      type: 'website',
      image: {
        url: data.image?.url,
        alt: data.name
      },
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: data.name,
        description: data.description
      }
    };
  }

  private generateBrandSeoConfig(data: any): Partial<SeoConfig> {
    return {
      title: `${data.name} - Marka`,
      description: data.description || `${data.name} markasının tüm ürünlerini keşfedin`,
      keywords: [data.name, 'marka', ...(data.tags || [])],
      type: 'brand',
      image: {
        url: data.image?.url,
        alt: data.name
      },
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Brand',
        name: data.name,
        description: data.description,
        logo: data.image?.url
      }
    };
  }

  private generateArticleSeoConfig(data: any): Partial<SeoConfig> {
    return {
      title: data.title,
      description: this.truncateDescription(data.summary || data.content),
      keywords: [...(data.tags || []), 'blog', 'article'],
      type: 'article',
      image: {
        url: data.image?.url,
        alt: data.title
      },
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.summary,
        image: data.image?.url,
        datePublished: data.publishDate,
        dateModified: data.updateDate || data.publishDate,
        author: {
          '@type': 'Person',
          name: data.author?.name
        }
      }
    };
  }

  private generateHomeSeoConfig(data: any): Partial<SeoConfig> {
    return {
      title: this.defaultConfig.title,
      description: this.defaultConfig.description,
      type: 'website',
      image: data.image?.url ? {
        url: data.image.url,
        alt: this.defaultConfig.title
      } : undefined,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: this.defaultConfig.title,
        description: this.defaultConfig.description
      }
    };
  }

  private handleCanonicalAndAlternateUrls(config: Partial<SeoConfig>): void {
    if (!isPlatformBrowser(this.platformId)) return;
  
    const canonicalUrl = config.canonicalUrl || `${this.baseUrl}${this.router.url}`;
    this.updateCanonicalUrl(canonicalUrl);
  
    if (config.alternateLanguages) {
      this.updateAlternateLanguages(config.alternateLanguages);
    }
  }

  private updateCanonicalUrl(url: string): void {
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', url);
  }

  private updateAlternateLanguages(languages: { [key: string]: string }): void {
    Object.entries(languages).forEach(([lang, url]) => {
      let alternateLink = document.querySelector(`link[hreflang="${lang}"]`);
      if (!alternateLink) {
        alternateLink = document.createElement('link');
        alternateLink.setAttribute('rel', 'alternate');
        alternateLink.setAttribute('hreflang', lang);
        document.head.appendChild(alternateLink);
      }
      alternateLink.setAttribute('href', url);
    });
  }

  private async generateDynamicSitemap(): Promise<any[]> {
    return this.router.config
      .filter(route => !route.path.includes(':') && !route.path.includes('*'))
      .map(route => ({
        path: route.path,
        priority: this.getRoutePriority(route.path),
        changefreq: this.getChangeFrequency(route.path)
      }));
  }

  private getRoutePriority(path: string): number {
    switch (path) {
      case '':
        return 1.0;
      case 'products':
        return 0.8;
      case 'categories':
      case 'brands':
        return 0.7;
      default:
        return 0.5;
    }
  }

  private getChangeFrequency(path: string): string {
    switch (path) {
      case '':
      case 'products':
        return 'daily';
      case 'categories':
      case 'brands':
        return 'weekly';
      default:
        return 'monthly';
    }
  }

  private getMetricValue(entry: any, metricName: string): number | null {
    switch (metricName) {
      case 'LCP':
        return entry.startTime;
      case 'FID':
        return entry.processingStart - entry.startTime;
      case 'CLS':
        return entry.value;
      default:
        return null;
    }
  }

  private getMetricRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = this.webVitalsThresholds[metricName];
    if (!thresholds) return 'needs-improvement';

    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  private processWebVitalMetric(metric: WebVitalsMetric): void {
    /* console.log(`Web Vital Metric - ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating
    }); */
  }

  private truncateDescription(text: string, maxLength: number = 160): string {
    if (!text) return '';
    const plainText = text.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength ? 
      `${plainText.substring(0, maxLength)}...` : 
      plainText;
  }

  private convertToMetaTagConfig(config: Partial<SeoConfig>): MetaTagConfig {
    return {
      title: config.title || this.defaultConfig.title,
      description: config.description || this.defaultConfig.description,
      keywords: config.keywords?.join(', '),
      author: config.author,
      type: config.type,
      image: config.image?.url,
      url: config.url || `${this.baseUrl}${this.router.url}`,
      canonicalUrl: config.canonicalUrl,
      alternateLanguages: config.alternateLanguages,
      ...(config.product || {})
    };
  }
  
  private convertToOpenGraphData(config: Partial<SeoConfig>): OpenGraphData {
    return {
      title: config.title || this.defaultConfig.title,
      description: config.description || this.defaultConfig.description,
      type: config.type,
      image: config.image,
      url: config.url || `${this.baseUrl}${this.router.url}`,
      productData: config.product ? {
        price: parseFloat(config.product.price || '0'),
        currency: config.product.currency || 'TRY',
        availability: config.product.availability || 'out of stock'
      } : undefined
    };
  }
}