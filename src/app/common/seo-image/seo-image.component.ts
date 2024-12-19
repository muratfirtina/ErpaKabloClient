import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { OptimizedImage } from 'src/app/contracts/seo/seo.types';
import { FetchPriorityDirective } from 'src/app/directives/fetch-priority.directive';
import { ImageOptimizationService } from 'src/app/services/common/seo/image-optimization.service';

@Component({
 selector: 'app-seo-image',
 standalone: true,
 imports: [CommonModule,FetchPriorityDirective],
 templateUrl: './seo-image.component.html',
 styleUrl: './seo-image.component.scss'
})
export class SeoImageComponent implements OnInit {
  @Input() src: string;
  @Input() alt: string;
  @Input() width?: number;
  @Input() height?: number;
  @Input() loading?: 'lazy' | 'eager' = 'lazy';
  @Input() fetchpriority?: 'high' | 'low' | 'auto' = 'auto';
  @Input() sizes?: string;

  imageData: OptimizedImage | null = null;
  imageVersions: OptimizedImage[] = [];
  isLoaded = false;

  readonly imageSizes = [
    { width: 320, sizes: '320px', media: '(max-width: 320px)' },
    { width: 480, sizes: '480px', media: '(max-width: 480px)' },
    { width: 768, sizes: '768px', media: '(max-width: 768px)' },
    { width: 1024, sizes: '1024px', media: '(max-width: 1024px)' },
    { width: 1200, sizes: '1200px', media: '(min-width: 1025px)' }
  ];

  constructor(
    private imageOptimizationService: ImageOptimizationService,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    if (this.src) {
      try {
        this.imageData = await this.imageOptimizationService.optimizeImage({
          src: this.src,
          alt: this.alt,
          width: this.width,
          height: this.height,
          loading: this.loading,
          fetchpriority: this.fetchpriority
        });
      } catch (error) {
        console.error('Error optimizing image:', error);
      }
    }
  }

  getSourceSet(size: { width: number }, format: 'avif' | 'webp'): string {
    if (!this.imageData) return '';
    return this.imageOptimizationService.generateSourceSet(this.imageData.src, size.width, format);
  }
  getVersionsByFormat(format: string): OptimizedImage[] {
    return this.imageVersions?.filter(v => v.format === format) || [];
  }

  onImageLoad() {
    this.isLoaded = true;
    // Performans metriklerini raporla
    this.imageOptimizationService.reportImageLoadMetrics(this.src);
  }

  onImageError() {
    // Hata durumunda fallback görsel göster
    this.imageData = {
      ...this.imageData!,
      src: '/assets/images/fallback-image.jpg'
    };
    console.error(`Error loading image: ${this.src}`);
  }
}