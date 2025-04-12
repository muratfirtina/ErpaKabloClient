import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnDestroy, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DefaultImages } from 'src/app/contracts/defaultImages';
import { Product } from 'src/app/contracts/product/product';
import { ProductOperationsService } from 'src/app/services/ui/product/product-operations.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent implements OnDestroy {
  @Input() product!: Product;
  @Input() listView: boolean = false;
  @Input() gridView: boolean = false;
  defaultProductImageUrl: string = DefaultImages.defaultProductImage;
  private featurePopup: HTMLElement | null = null;
  private isDesktop: boolean = window.innerWidth >= 992;
  private hoverTimer: any = null;

  constructor(
    private productOperations: ProductOperationsService,
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isDesktop = window.innerWidth >= 992;
  }


  
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (this.featurePopup) {
      this.closeFeaturePopup();
    }
  }
  
  @HostListener('window:popstate', [])
  onPopState(): void {
    if (this.featurePopup) {
      this.closeFeaturePopup();
    }
  }
  
  @HostListener('document:keydown.escape', [])
  onKeydownEscape(): void {
    if (this.featurePopup) {
      this.closeFeaturePopup();
    }
  }

  ngOnDestroy(): void {
    this.closeFeaturePopup();
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
    }
  }

  onLikeClick(event: Event) {
    event.stopPropagation(); // Tıklamanın karta yayılmasını engeller
    event.preventDefault(); // Bağlantı davranışını engeller
    this.productOperations.toggleLike(this.product);
  }
  preventNavigation(event: Event) {
    // MouseDown olayını da engelle (orta tuş tıklamaları için)
    event.stopPropagation();
    event.preventDefault();
  }
  

  addToCart(event: Event) {
    event.stopPropagation();
    event.preventDefault(); 
    this.productOperations.addToCart(this.product);
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === 0) return '*Please Request Quote';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }
  
  isProductAvailable(product: Product): boolean {
    return product.stock === -1 || product.stock > 0;
  }
  
  
  closeFeaturePopup(): void {
    if (this.featurePopup) {
      this.renderer.removeChild(document.body, this.featurePopup);
      this.featurePopup = null;
    }
  }
  
  showAllFeatures(event: Event, isHover: boolean = false): void {
    event.stopPropagation(); // Kart tıklama olayını engeller
    
    // Eğer popup zaten açıksa ve tıklama ile açıldıysa, kapat (hover ile değil)
    if (this.featurePopup && !isHover) {
      this.closeFeaturePopup();
      return;
    }
    
    // Eğer popup açıksa ve hover ile tekrar hover olduysa, yeni popup açma
    if (this.featurePopup && isHover) return;
    
    // Popup oluştur
    this.featurePopup = this.renderer.createElement('div');
    this.renderer.addClass(this.featurePopup, 'features-popup');
    
    // Popup başlığı
    const title = this.renderer.createElement('div');
    this.renderer.addClass(title, 'popup-title');
    title.textContent = 'Other Features';
    this.renderer.appendChild(this.featurePopup, title);
    
    // Özellikler container'ı
    const featuresContainer = this.renderer.createElement('div');
    this.renderer.addClass(featuresContainer, 'popup-features-container');
    
    // Her özellik için rozet oluştur - badge stil formatında
    this.product.productFeatureValues.forEach(feature => {
      const badge = this.renderer.createElement('span');
      this.renderer.addClass(badge, 'feature-badge');
      badge.textContent = feature.featureValueName;
      this.renderer.appendChild(featuresContainer, badge);
    });
    
    this.renderer.appendChild(this.featurePopup, featuresContainer);
    
    // Sadece mobil cihazlarda kapatma butonu göster
    /* if (!this.isDesktop && !isHover) {
      const closeBtn = this.renderer.createElement('button');
      this.renderer.addClass(closeBtn, 'close-btn');
      closeBtn.textContent = 'Kapat';
      this.renderer.listen(closeBtn, 'click', (e) => {
        e.stopPropagation();
        this.closeFeaturePopup();
      });
      this.renderer.appendChild(this.featurePopup, closeBtn);
    } */
    
    // Popup'ı dokümana ekle
    this.renderer.appendChild(document.body, this.featurePopup);
    
    // Popup'ı konumlandır
    const targetEl = event.target as HTMLElement;
    const rect = targetEl.getBoundingClientRect();
    
    // Popup'ı hedef elementin altında konumlandır
    this.renderer.setStyle(this.featurePopup, 'position', 'absolute');
    this.renderer.setStyle(this.featurePopup, 'top', `${rect.bottom + window.scrollY + 5}px`);
    
    // Sağ veya sol taşma olmaması için kontrol
    const popupWidth = 300; // Tahmini genişlik
    if (rect.left + popupWidth > window.innerWidth) {
      // Sağa taşıyorsa, sol tarafa hizala
      this.renderer.setStyle(this.featurePopup, 'right', `${window.innerWidth - rect.right - window.scrollX}px`);
    } else {
      // Normal hizalama
      this.renderer.setStyle(this.featurePopup, 'left', `${rect.left + window.scrollX}px`);
    }
    
    // Hover açıldıysa, mouse leave eventi ekle
    if (isHover) {
      this.renderer.listen(this.featurePopup, 'mouseleave', () => {
        this.closeFeaturePopup();
      });
    }
    
    // Popup'a tıklamaların döküman tıklaması olarak algılanmaması için
    this.renderer.listen(this.featurePopup, 'click', (e) => {
      e.stopPropagation();
    });
  }

  showFeaturePopup: boolean = false;
  
  toggleFeaturePopup(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.showFeaturePopup = !this.showFeaturePopup;
  }
  
  onMoreFeaturesMouseEnter(event: Event): void {
    if (!this.isDesktop) return;
    
    // Gecikmeli hover - 300ms bekleme süresi
    this.hoverTimer = setTimeout(() => {
      this.showFeaturePopup = true;
    }, 300);
  }
  
  onMoreFeaturesMouseLeave(): void {
    if (!this.isDesktop) return;
    
    // Timer'ı iptal et
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
    
    // Biraz gecikme ile kapat
    setTimeout(() => {
      this.showFeaturePopup = false;
    }, 300);
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Eğer card dışında bir yere tıklandıysa popup'ı kapat
    if (this.showFeaturePopup) {
      const cardElement = this.el.nativeElement;
      if (!cardElement.contains(event.target)) {
        this.showFeaturePopup = false;
      }
    }
  }

  scrollToTop(event: Event) {
    // Sadece scroll işlemini yap, yönlendirmeyi routerLink hallediyor
    window.scrollTo(0, 0);
  }
}