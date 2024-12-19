import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';

import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { filter } from 'rxjs/operators';
import { BrandComponent } from 'src/app/ui/components/brand/brand.component';
import { CategoryComponent } from 'src/app/ui/components/category/category.component';
import { ProductDetailComponent } from 'src/app/ui/components/product/product-detail/product-detail.component';

@Component({
  selector: 'app-dynamic-router',
  standalone: true,
  imports: [CommonModule, ProductDetailComponent, CategoryComponent, BrandComponent],
  template: `
    <ng-container [ngSwitch]="componentType">
      <app-product-detail 
        *ngSwitchCase="'product'" 
        [productId]="id" 
        [key]="navigationCounter">
      </app-product-detail>
      <app-category 
        *ngSwitchCase="'category'" 
        [categoryId]="id" 
        [key]="navigationCounter">
      </app-category>
      <app-brand 
        *ngSwitchCase="'brand'" 
        [brandId]="id" 
        [key]="navigationCounter">
      </app-brand>
    </ng-container>
  `
})
export class DynamicRouterComponent extends BaseComponent implements OnInit {
  id: string;
  componentType: string;
  navigationCounter = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    spinner: NgxSpinnerService
  ) {
    super(spinner);

    // NavigationEnd event'ini dinle
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Her navigasyonda counter'ı artır
      this.navigationCounter++;
      this.initializeRoute();
    });
  }

  ngOnInit() {
    this.initializeRoute();
  }

  private initializeRoute() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    try {
      this.id = this.route.snapshot.paramMap.get('id');
      
      if (this.id?.includes('-p-')) {
        this.componentType = 'product';
      } else if (this.id?.includes('-c-')) {
        this.componentType = 'category';
      } else {
        this.componentType = 'brand';
      }
      
      if (!this.id || !this.componentType) {
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('Routing error:', error);
      this.router.navigate(['/']);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }
}