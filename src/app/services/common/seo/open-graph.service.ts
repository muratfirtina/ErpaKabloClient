import { Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';

export interface OpenGraphData {
  title: string;
  description: string;
  image?: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  };
  type?: string;
  siteName?: string;
  url?: string;
  // Ürün spesifik OG tagları
  productData?: {
    price: number;
    currency: string;
    availability: string;
    condition?: 'new' | 'used' | 'refurbished';
    retailerItemId?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OpenGraphService {
  constructor(private meta: Meta) {}

  setOpenGraphTags(data: OpenGraphData): void {
    // Temel OG tagları
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: data.type || 'website' });
    
    if (data.url) {
      this.meta.updateTag({ property: 'og:url', content: data.url });
    }

    if (data.siteName) {
      this.meta.updateTag({ property: 'og:site_name', content: data.siteName });
    }

    // Görsel OG tagları
    if (data.image) {
      this.meta.updateTag({ property: 'og:image', content: data.image.url });
      
      if (data.image.width) {
        this.meta.updateTag({ property: 'og:image:width', content: data.image.width.toString() });
      }
      
      if (data.image.height) {
        this.meta.updateTag({ property: 'og:image:height', content: data.image.height.toString() });
      }
      
      if (data.image.alt) {
        this.meta.updateTag({ property: 'og:image:alt', content: data.image.alt });
      }
    }

    // Ürün OG tagları
    if (data.productData) {
      this.meta.updateTag({ property: 'product:price:amount', content: data.productData.price.toString() });
      this.meta.updateTag({ property: 'product:price:currency', content: data.productData.currency });
      this.meta.updateTag({ property: 'product:availability', content: data.productData.availability });
      
      if (data.productData.condition) {
        this.meta.updateTag({ property: 'product:condition', content: data.productData.condition });
      }
      
      if (data.productData.retailerItemId) {
        this.meta.updateTag({ property: 'product:retailer_item_id', content: data.productData.retailerItemId });
      }
    }
  }
}
