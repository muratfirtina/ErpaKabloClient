import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { BreadcrumbService } from 'src/app/services/common/breadcrumb.service';
import { Brand } from 'src/app/contracts/brand/brand';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { DownbarComponent } from '../downbar/downbar.component';
import { FooterComponent } from '../footer/footer.component';
import { SpinnerService } from 'src/app/services/common/spinner.service';


@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [
    CommonModule,RouterModule, MainHeaderComponent, NavbarComponent, DownbarComponent, BreadcrumbComponent,FooterComponent
  ],
  templateUrl: './brand.component.html',
  styleUrls: ['./brand.component.scss']
})
export class BrandComponent extends BaseComponent implements OnInit {
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
      { label: 'Brands', url: '/brand' }
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