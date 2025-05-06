import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from 'src/app/contracts/product/product';
import { ProductCardComponent } from '../product-card/product-card.component';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { SpinnerComponent } from 'src/app/base/spinner/spinner.component';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, SpinnerComponent],
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.scss']
})
export class ProductGridComponent extends BaseComponent implements OnChanges {
  @Input() products: Product[] = [];
  @Input() title?: string;
  @Input() showNavigationButtons: boolean = true;
  @Input() loading: boolean = false;
  @Input() loadingProgress: number = 0; // Yeni: ilerleme yüzdesi
  @Input() loadingText: string = ''; // Yeni: yükleme metni

  @ViewChild('productGrid') productGrid!: ElementRef;

  constructor(private spinnerService: SpinnerService) {
    super(spinnerService);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['loading']) {
      if (this.loading) {
        this.showSpinner(SpinnerType.SquareLoader);
      } else {
        this.hideSpinner(SpinnerType.SquareLoader);
      }
    }
    
    // Progress değişikliklerini ele al
    if (changes['loadingProgress'] && this.loadingProgress) {
      this.spinnerService.updateProgress(SpinnerType.SquareLoader, this.loadingProgress);
    }
  }

  scrollLeft() {
    const grid = this.productGrid.nativeElement;
    grid.scrollBy({ left: -250, behavior: 'smooth' });
  }

  scrollRight() {
    const grid = this.productGrid.nativeElement;
    grid.scrollBy({ left: 250, behavior: 'smooth' });
  }
}