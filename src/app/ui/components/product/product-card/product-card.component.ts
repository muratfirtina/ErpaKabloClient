import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Product } from 'src/app/contracts/product/product';
import { ProductOperationsService } from 'src/app/services/ui/product/product-operations.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() listView: boolean = false;
  @Input() gridView: boolean = false;

  constructor(private productOperations: ProductOperationsService) {}

  onLikeClick(event: Event) {
    event.stopPropagation();
    this.productOperations.toggleLike(this.product);
  }

  onAddToCart(event: Event) {
    event.stopPropagation();
    this.productOperations.addToCart(this.product);
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY' 
    }).format(value);
  }
}
