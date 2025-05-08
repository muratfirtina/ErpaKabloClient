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
import { DefaultImages } from 'src/app/contracts/defaultImages';
import { SpinnerComponent } from 'src/app/base/spinner/spinner.component';


@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [
    CommonModule,RouterModule, 
    MainHeaderComponent, 
    NavbarComponent, 
    DownbarComponent, 
    BreadcrumbComponent,
    FooterComponent,
    SpinnerComponent
  ],
  templateUrl: './brand.component.html',
  styleUrls: ['./brand.component.scss']
})
export class BrandComponent extends BaseComponent implements OnInit {
  brands: Brand[] = [];
  totalBrandCount: number = 0;
  defaultBrandImageUrl: string = DefaultImages.defaultBrandImage;
  isLoading: boolean = true; // Loading state ekleyin
  loadingProgress: number = 0; // Progress değeri ekleyin

  constructor(
    private breadcrumbService: BreadcrumbService,
    private brandService: BrandService,
    spinner: SpinnerService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    this.isLoading = true;
    this.loadingProgress = 0;
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Brands', url: '/brand' }
    ]);
    await this.loadBrands();
  }

  async loadBrands() {
    this.showSpinner(SpinnerType.SquareLoader);
    
    try {
      // Progress değerini artıralım
      this.loadingProgress = 20;
      
      const data = await this.brandService.list(
        { pageIndex: 0, pageSize: 50 }
      );
      
      // Veriler yüklenince progress'i ilerletelim
      this.loadingProgress = 80;
      
      this.brands = data.items;
      this.totalBrandCount = data.count;
      
      // İşlem tamamlandı
      this.loadingProgress = 100;
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      // Kısa bir gecikme ile loading state'i kapatalım
      setTimeout(() => {
        this.isLoading = false;
        this.hideSpinner(SpinnerType.SquareLoader);
      }, 300);
    }
  }
}