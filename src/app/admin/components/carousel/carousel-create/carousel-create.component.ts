import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CarouselService } from 'src/app/services/common/models/carousel.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-carousel-create',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './carousel-create.component.html',
  styleUrl: './carousel-create.component.scss'
})
export class CarouselCreateComponent extends BaseComponent {
  carouselData = {
    name: '',
    description: '',
    order: 0,
    isActive: true,
    carouselImageFiles: null
  };
  selectedFiles: File[] = [];

  constructor(
    private carouselService: CarouselService,
    private customToastrService: CustomToastrService,
    spinner: NgxSpinnerService
  ) {
    super(spinner);
  }

  onFileSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  createCarousel() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formData = new FormData();
    formData.append('name', this.carouselData.name);
    formData.append('description', this.carouselData.description);
    formData.append('order', this.carouselData.order.toString());
    formData.append('isActive', this.carouselData.isActive ? 'true' : 'false');

    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach((file, index) => {
        formData.append(`carouselImageFiles`, file, file.name);
      });
    }

    this.carouselService.create(
      formData,
      () => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
        this.customToastrService.message("Carousel başarıyla oluşturuldu", "Başarılı", {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        // Burada formu sıfırlayabilir veya başka bir sayfaya yönlendirebilirsiniz
        this.resetForm();
      },
      (error) => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
        this.customToastrService.message("Carousel oluşturulurken bir hata oluştu", "Hata", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
        console.error('Error creating carousel:', error);
      }
    );
  }

  private resetForm() {
    this.carouselData = {
      name: '',
      description: '',
      order: 0,
      isActive: true,
      carouselImageFiles: null
    };
    this.selectedFiles = [];
  }
}