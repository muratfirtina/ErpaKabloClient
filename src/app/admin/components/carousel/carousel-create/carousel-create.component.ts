import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CarouselService } from 'src/app/services/common/models/carousel.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-carousel-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './carousel-create.component.html',
  styleUrl: './carousel-create.component.scss'
})
export class CarouselCreateComponent extends BaseComponent {
  carouselData = {
    name: '',
    description: '',
    order: 0,
    isActive: true,
    mediaType: 'image', // Default to image type
    videoType: 'upload', // Default to upload type for videos
    videoUrl: '', // For YouTube or Vimeo URLs
    carouselImageFiles: null,
    carouselVideoFile: null
  };
  selectedFiles: File[] = [];
  selectedVideoFile: File | null = null;

  constructor(
    private carouselService: CarouselService,
    private customToastrService: CustomToastrService,
    spinner: SpinnerService
  ) {
    super(spinner);
  }

  onFileSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  onVideoFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedVideoFile = files[0]; // Only get the first file for videos
    }
  }

  createCarousel() {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formData = new FormData();
    formData.append('name', this.carouselData.name);
    formData.append('description', this.carouselData.description);
    formData.append('order', this.carouselData.order.toString());
    formData.append('isActive', this.carouselData.isActive ? 'true' : 'false');
    formData.append('mediaType', this.carouselData.mediaType);

    if (this.carouselData.mediaType === 'image' && this.selectedFiles.length > 0) {
      this.selectedFiles.forEach((file, index) => {
        formData.append(`carouselImageFiles`, file, file.name);
      });
    } else if (this.carouselData.mediaType === 'video') {
      formData.append('videoType', this.carouselData.videoType);
      
      if (this.carouselData.videoType === 'upload' && this.selectedVideoFile) {
        formData.append('carouselVideoFile', this.selectedVideoFile, this.selectedVideoFile.name);
      } else if (['youtube', 'vimeo'].includes(this.carouselData.videoType) && this.carouselData.videoUrl) {
        formData.append('videoUrl', this.carouselData.videoUrl);
      }
    }

    this.carouselService.create(
      formData,
      () => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
        this.customToastrService.message("Carousel successfully created", "Success", {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        this.resetForm();
      },
      (error) => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
        this.customToastrService.message("An error occurred while creating carousel", "Error", {
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
      mediaType: 'image',
      videoType: 'upload',
      videoUrl: '',
      carouselImageFiles: null,
      carouselVideoFile: null
    };
    this.selectedFiles = [];
    this.selectedVideoFile = null;
  }
}