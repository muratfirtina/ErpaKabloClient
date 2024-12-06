import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductLikeService } from 'src/app/services/common/models/product-like.service';
import { Product } from 'src/app/contracts/product/product';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { UiProductListComponent } from '../../product/ui-product-list/ui-product-list.component';
import { MainHeaderComponent } from '../../main-header/main-header.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { DownbarComponent } from '../../downbar/downbar.component';
import { DesktopUserSidebarComponent } from '../desktop-user-sidebar/desktop-user-sidebar.component';

@Component({
  selector: 'app-my-favorites',
  standalone: true,
  imports: [CommonModule, UiProductListComponent, MatPaginatorModule, MainHeaderComponent,NavbarComponent,BreadcrumbComponent,DownbarComponent,DesktopUserSidebarComponent],
  templateUrl: './my-favorites.component.html',
  styleUrl: './my-favorites.component.scss'
})
export class MyFavoritesComponent extends BaseComponent implements OnInit {
  favorites: GetListResponse<Product>;
  pageSize = 12;
  pageRequest: PageRequest = {
    pageIndex: 0,
    pageSize: this.pageSize
  };

  constructor(
    private productLikeService: ProductLikeService,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
  }

  async ngOnInit() {
    await this.loadFavorites();
  }

  async loadFavorites() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
        this.favorites = await this.productLikeService.getProductsUserLiked(
            this.pageRequest,
            () => this.hideSpinner(SpinnerType.BallSpinClockwise),
            error => this.hideSpinner(SpinnerType.BallSpinClockwise)
        );

        // Beğeni durumlarını ayarla
        if(this.favorites?.items) {
            this.favorites.items = this.favorites.items.map(product => ({
                ...product,
                isLiked: true
            }));
        }
    } catch {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
}

  onPageChange(event: PageEvent) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.loadFavorites();
  }
}