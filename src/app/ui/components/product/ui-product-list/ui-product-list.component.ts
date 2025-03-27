import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { SpinnerComponent } from 'src/app/base/spinner/spinner.component';
import { Product } from 'src/app/contracts/product/product';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-ui-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, SpinnerComponent],
  templateUrl: './ui-product-list.component.html',
  styleUrl: './ui-product-list.component.scss'
})
export class UiProductListComponent extends BaseComponent implements OnChanges {
  @Input() products: Product[] = [];
  @Input() listView: boolean = false;
  @Input() loading: boolean = false;
  
  // Daha önce ürün yüklenip yüklenmediğini takip etmek için
  private hasHadProducts = false;
  
  constructor(spinner: SpinnerService) {
    super(spinner);
    console.log("UiProductListComponent constructed");
  }
  
  ngOnInit() {
    console.log("UiProductListComponent initialized with products:", this.products?.length);
  }
  
  ngOnChanges(changes: SimpleChanges) {
    console.log("UiProductListComponent changes:", 
                "products:", this.products?.length, 
                "loading:", this.loading);
    
    // Ürünlerimiz varsa, hasHadProducts'ı güncelle
    if (changes['products'] && this.products && this.products.length > 0) {
      this.hasHadProducts = true;
      console.log("Products received:", this.products.length);
    }
    
    // Yükleme durumu değişikliklerini ele al
    if (changes['loading']) {
      if (this.loading) {
        this.showSpinner(SpinnerType.SquareLoader);
      } else {
        this.hideSpinner(SpinnerType.SquareLoader);
      }
    }
  }
  
  /**
   * Boş durumun gösterilip gösterilmeyeceğini kontrol et
   * Sadece yüklemiyorsak VE hiç ürün olmadıysa göster
   */
  get shouldShowEmptyState(): boolean {
    return !this.loading && this.products.length === 0 && !this.hasHadProducts;
  }
}