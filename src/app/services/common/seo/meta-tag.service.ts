import { Injectable } from '@angular/core';
import { Meta, Title, MetaDefinition } from '@angular/platform-browser';
import { Router } from '@angular/router';

export interface MetaTagConfig {
    title: string;
    description: string;
    keywords?: string;
    author?: string;
    type?: string;
    image?: string;
    url?: string;
     canonicalUrl?: string;
    alternateLanguages?: { [lang: string]: string };
   // Ürün spesifik meta tagları
    price?: string;
    currency?: string;
    availability?: 'in stock' | 'out of stock';
     brand?: string;
    category?: string;
}

@Injectable({
    providedIn: 'root'
})
export class MetaTagService {
    private baseUrl: string = 'https://your-domain.com'; // Domaininizi buraya ekleyin

    constructor(
        private meta: Meta,
        private title: Title,
        private router: Router
    ) {}

    updateTags(config: MetaTagConfig): void {
        // Temel meta tagları
        this.title.setTitle(config.title);
        this.meta.updateTag({ name: 'description', content: config.description });

        if (config.keywords) {
            this.meta.updateTag({ name: 'keywords', content: config.keywords });
        }

        // Canonical URL
        const url = config.url || `${this.baseUrl}${this.router.url}`;
        this.updateOrCreateCanonicalLink(url, config.canonicalUrl);
      
          if (config.alternateLanguages) {
            this.updateOrCreateAlternateLinks(config.alternateLanguages);
         }

        // OpenGraph meta tagları
        this.meta.updateTag({ property: 'og:title', content: config.title });
        this.meta.updateTag({ property: 'og:description', content: config.description });
        this.meta.updateTag({ property: 'og:type', content: config.type || 'website' });
       this.meta.updateTag({ property: 'og:url', content: url });

        if (config.image) {
            this.meta.updateTag({ property: 'og:image', content: config.image });
        }

      // Twitter Card meta tagları
     this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
     this.meta.updateTag({ name: 'twitter:title', content: config.title });
     this.meta.updateTag({ name: 'twitter:description', content: config.description });

    // Ürün sayfaları için ekstra meta taglar
      if (config.price) {
        this.meta.updateTag({ property: 'product:price:amount', content: config.price });
            this.meta.updateTag({ property: 'product:price:currency', content: config.currency || 'TRY' });
        }

       if (config.availability) {
          this.meta.updateTag({ property: 'product:availability', content: config.availability });
        }

       if (config.brand) {
        this.meta.updateTag({ property: 'product:brand', content: config.brand });
        }

     if (config.category) {
        this.meta.updateTag({ property: 'product:category', content: config.category });
      }
    }
   updateStructuredData(structuredData: any): void {
       const scriptTag: MetaDefinition = {
            property: 'application/ld+json',
            content: JSON.stringify(structuredData),
            type: 'application/ld+json'
        };
      this.meta.addTag(scriptTag);
    }

    private updateOrCreateCanonicalLink(url: string, canonicalUrl?: string): void {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', canonicalUrl || url);
    }
    private updateOrCreateAlternateLinks(alternateLanguages: { [lang: string]: string }): void {
        this.removeExistingAlternateLinks();
        for (const lang in alternateLanguages) {
        const link = document.createElement('link');
          link.setAttribute('rel', 'alternate');
          link.setAttribute('hreflang', lang);
         link.setAttribute('href', alternateLanguages[lang]);
          document.head.appendChild(link);
       }
    }
    private removeExistingAlternateLinks(): void {
        const existingLinks = document.querySelectorAll('link[rel="alternate"]');
         existingLinks.forEach(link => {
          document.head.removeChild(link);
        });
     }
}