import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
  selectedVideoFile: File | null = null;
  removedImageIndices: number[] = []; // Silinen mevcut resimlerin indeksleri

  constructor(
    private carouselService: CarouselService,
    private customToastrService: CustomToastrService,
    private sanitizer: DomSanitizer,
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
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }

  onCarouselSelect(carousel: Carousel) {
    // Mevcut carousel için derin kopya oluştur
    this.selectedCarousel = JSON.parse(JSON.stringify(carousel));
    
    // Varsayılan media type ayarla (geriye dönük uyumluluk için)
    if (!this.selectedCarousel.mediaType) {
      if (this.selectedCarousel.videoUrl || this.selectedCarousel.videoType || this.selectedCarousel.videoId) {
        this.selectedCarousel.mediaType = 'video';
      } else {
        this.selectedCarousel.mediaType = 'image';
      }
    }
    
    // URL'lerden video ID'leri çıkar (eğer seçili carousel video ise)
    if (this.selectedCarousel.mediaType === 'video' && this.selectedCarousel.videoUrl) {
      this.extractVideoId();
    }
    
    // Yeni seçim yapıldığında, silinen resim indeksleri listesini sıfırla
    this.removedImageIndices = [];
    this.selectedFiles = [];
    this.selectedVideoFile = null;
  }

  onFileSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }
  
  onVideoFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedVideoFile = files[0];
      
      // Video boyutu kontrolü
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (this.selectedVideoFile.size > maxSize) {
        alert('Video dosyası 50MB limitini aşıyor.');
        this.selectedVideoFile = null;
        return;
      }
      
      // Desteklenen format kontrolü
      const validFormats = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!validFormats.includes(this.selectedVideoFile.type)) {
        alert('Desteklenmeyen video formatı. Lütfen MP4, WebM veya MOV dosyaları kullanın.');
        this.selectedVideoFile = null;
        return;
      }
    }
  }
  
  // Silinen mevcut resimleri işaretle
  removeExistingImage(index: number) {
    if (!this.selectedCarousel) return;
    
    // İndeksi listede sakla
    this.removedImageIndices.push(index);
    
    // UI'da görünümü güncelle (asıl silme işlemi submit sırasında olacak)
    // Bu, kullanıcı formdan vazgeçerse orjinal verileri korumak için gerekli
    const carouselImagesCopy = [...this.selectedCarousel.carouselImageFiles];
    carouselImagesCopy.splice(index, 1);
    this.selectedCarousel.carouselImageFiles = carouselImagesCopy;
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
    formData.append('mediaType', this.selectedCarousel.mediaType);
    
    // Silinen resimlerin indekslerini ekle
    if (this.removedImageIndices.length > 0) {
      this.removedImageIndices.forEach((index, i) => {
        formData.append(`removedImageIndices[${i}]`, index.toString());
      });
    }

    // Medya türüne göre dosya ekleme
    if (this.selectedCarousel.mediaType === 'image') {
      // Resim dosyaları
      if (this.selectedFiles.length > 0) {
        this.selectedFiles.forEach((file, index) => {
          formData.append(`carouselImageFiles`, file, file.name);
        });
      }
    } else if (this.selectedCarousel.mediaType === 'video') {
      formData.append('videoType', this.selectedCarousel.videoType);
      
      if (this.selectedCarousel.videoType === 'upload' && this.selectedVideoFile) {
        formData.append('carouselVideoFile', this.selectedVideoFile, this.selectedVideoFile.name);
      } else if (['youtube', 'vimeo'].includes(this.selectedCarousel.videoType) && this.selectedCarousel.videoUrl) {
        formData.append('videoUrl', this.selectedCarousel.videoUrl);
      }
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
        this.selectedVideoFile = null;
        this.removedImageIndices = [];
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
  
  // Video tiplerinin görünen isimlerini getir
  getVideoTypeName(type: string): string {
    switch (type) {
      case 'upload': return 'Uploaded';
      case 'youtube': return 'YouTube';
      case 'vimeo': return 'Vimeo';
      default: return type;
    }
  }
  
  // Video URL'den ID çıkarma
  extractVideoId() {
    if (!this.selectedCarousel || !this.selectedCarousel.videoUrl) return;
    
    if (this.selectedCarousel.videoType === 'youtube') {
      const match = this.selectedCarousel.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match && match[1]) {
        this.selectedCarousel.videoId = match[1];
      }
    } else if (this.selectedCarousel.videoType === 'vimeo') {
      const match = this.selectedCarousel.videoUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|)(\d+)(?:|\/\?)/);
      if (match && match[1]) {
        this.selectedCarousel.videoId = match[1];
      }
    }
  }
  
  // YouTube embed URL'i oluştur (iframe için)
  getYouTubeEmbedUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }
  
  // Vimeo embed URL'i oluştur (iframe için)
  getVimeoEmbedUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${videoId}`);
  }
}