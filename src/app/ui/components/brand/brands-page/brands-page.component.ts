import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MainHeaderComponent } from '../../main-header/main-header.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { DownbarComponent } from '../../downbar/downbar.component';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { Brand } from 'src/app/contracts/brand/brand';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { BreadcrumbService } from 'src/app/services/common/breadcrumb.service';
import { FooterComponent } from '../../footer/footer.component';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-brands-page',
  standalone: true,
  imports: [CommonModule,RouterModule, MainHeaderComponent, NavbarComponent, DownbarComponent, BreadcrumbComponent,FooterComponent],
  templateUrl: './brands-page.component.html',
  styleUrl: './brands-page.component.scss'
})
export class BrandsPageComponent extends BaseComponent implements OnInit {
  brands: Brand[] = [];
  totalBrandCount: number = 0;

  constructor(
    private breadcrumbService: BreadcrumbService,
    private brandService: BrandService,
    spinner: SpinnerService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Brands', url: '/brands-page' }
    ]);
    await this.loadBrands();
  }

  async loadBrands() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    const data = await this.brandService.list(
      { pageIndex: 0, pageSize: 20 },
      () => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
      }
    );
    this.brands = data.items;
    this.totalBrandCount = data.count;
  }
}