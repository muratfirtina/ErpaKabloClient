import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Carousel } from 'src/app/contracts/carousel/carousel';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { CarouselService } from 'src/app/services/common/models/carousel.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-carousel-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './carousel-update.component.html',
  styleUrl: './carousel-update.component.scss'
})
export class CarouselUpdateComponent extends BaseComponent implements OnInit {
  carousels: GetListResponse<Carousel> = { index: 0, size: 0, count: 0, pages: 0, hasPrevious: false, hasNext: false, items: [] };
  selectedCarousel: Carousel | null = null;
  selectedFiles: File[] = [];

  constructor(
    private carouselService: CarouselService,
    private customToastrService: CustomToastrService,
    spinner: SpinnerService
  ) {
    super(spinner);
  }

  ngOnInit() {
    this.loadCarousels();
  }

  loadCarousels() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.carouselService.list(
      { pageIndex: 0, pageSize: 100 },
      () => {
        this.showSpinner(SpinnerType.BallSpinClockwise);
      },
      (error) => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
        console.error('Error loading carousels:', error);
      }
    ).then((response) => {
      this.carousels = { ...response };
    }
    );
  }

  onCarouselSelect(carousel: Carousel) {
    this.selectedCarousel = { ...carousel };
  }

  onFileSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  updateCarousel() {
    if (!this.selectedCarousel) return;

    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formData = new FormData();
    formData.append('id', this.selectedCarousel.id);
    formData.append('name', this.selectedCarousel.name);
    formData.append('description', this.selectedCarousel.description);
    formData.append('order', this.selectedCarousel.order.toString());
    formData.append('isActive', this.selectedCarousel.isActive ? 'true' : 'false');

    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach((file, index) => {
        formData.append(`carouselImageFiles`, file, file.name);
      });
    }

    this.carouselService.update(
      formData,
      () => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
        this.customToastrService.message("Carousel başarıyla güncellendi", "Başarılı", {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        this.loadCarousels(); // Listeyi yenile
        this.selectedCarousel = null;
        this.selectedFiles = [];
      },
      (error) => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
        this.customToastrService.message("Carousel güncellenirken bir hata oluştu", "Hata", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
        console.error('Error updating carousel:', error);
      }
    );
  }
}