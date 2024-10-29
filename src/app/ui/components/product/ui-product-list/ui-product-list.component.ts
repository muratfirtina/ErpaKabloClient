import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Product } from 'src/app/contracts/product/product';
import { ProductOperationsService } from 'src/app/services/ui/product/product-operations.service';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-ui-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, CommonModule, ProductCardComponent],
  templateUrl: './ui-product-list.component.html',
  styleUrl: './ui-product-list.component.scss'
})
export class UiProductListComponent {
  @Input() products: Product[] = [];
  @Input() listView: boolean = false;
}
