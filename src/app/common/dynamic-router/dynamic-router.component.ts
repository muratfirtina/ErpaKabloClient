import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subject, takeUntil } from 'rxjs';

import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CategoryComponent } from 'src/app/ui/components/category/category.component';
import { ProductDetailComponent } from 'src/app/ui/components/product/product-detail/product-detail.component';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { SecurityService } from 'src/app/services/common/security.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { BrandPageComponent } from 'src/app/ui/components/brand/brand-page/brand-page.component';

@Component({
  selector: 'app-dynamic-router',
  standalone: true,
  imports: [CommonModule, ProductDetailComponent, CategoryComponent, BrandPageComponent],
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
      <app-brand-page 
        *ngSwitchCase="'brand'" 
        [brandId]="id" 
        [key]="navigationCounter">
      </app-brand-page>
    </ng-container>
  `
})
export class DynamicRouterComponent extends BaseComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  id: string;
  componentType: string;
  navigationCounter = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    spinner: SpinnerService,
    private securityService: SecurityService,
    private toastrService: CustomToastrService
  ) {
    super(spinner);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.navigationCounter++;
      this.initializeRoute();
    });
  }

  ngOnInit() {
    this.initializeRoute();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeRoute() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    try {
      this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
        if (data['routeType']) {
          this.componentType = data['routeType'].type;
          this.id = this.route.snapshot.paramMap.get('id');

          if (!this.id || !this.componentType) {
            this.navigateTo404();
            return;
          }

          const validation = this.securityService.validateRouteParam(this.id);
          if (!validation.isValid) {
            this.navigateTo404();
            return;
          }

          if (validation.type !== this.componentType) {
            this.navigateTo404();
            return;
          }

          if (this.id !== validation.expectedId) {
            const timeout = setTimeout(() => {
              this.router.navigate([`/${validation.expectedId}`], {
                replaceUrl: true
              });
              clearTimeout(timeout);
            }, 0);
            return;
          }
        } else {
          this.navigateTo404();
        }
      });
    } catch (error) {
      console.error('Routing error:', error);
      this.navigateTo404();
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  private navigateTo404() {
    const timeout = setTimeout(() => {
      this.router.navigate(['/404']);
      this.toastrService.message(
        "Sayfa bulunamadı veya geçersiz URL.",
        "404 Hatası",
        {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        }
      );
      clearTimeout(timeout);
    }, 0);
  }
}