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

  constructor(spinner: SpinnerService) {
    super(spinner);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['loading']) {
      if (this.loading) {
        this.showSpinner(SpinnerType.SquareLoader);
      } else {
        this.hideSpinner(SpinnerType.SquareLoader);
      }
    }
  }
}