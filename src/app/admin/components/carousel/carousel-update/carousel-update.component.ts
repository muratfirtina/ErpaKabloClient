import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
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
  existingImageIds: string[] = []; // Silinen resimlerin ID'leri - backend'in beklediği parametre adı

  constructor(
    private carouselService: CarouselService,
    private customToastrService: CustomToastrService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    spinner: SpinnerService
  ) {
    super(spinner);
  }

  ngOnInit() {
    // URL'den id parametresini kontrol et
    this.route.paramMap.subscribe(params => {
      const carouselId = params.get('id');
      if (carouselId) {
        this.loadCarouselById(carouselId);
      } else {
        this.loadCarousels();
      }
    });
  }

  loadCarousels() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.carouselService.list(
      { pageIndex: -1, pageSize: -1 },
      () => {
        this.showSpinner(SpinnerType.BallSpinClockwise);
      },
      (error) => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
        console.error('Error loading carousels:', error);
        this.customToastrService.message("Carousel listesi yüklenirken hata oluştu", "Hata", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    ).then((response) => {
      this.carousels = { ...response };
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }

  async loadCarouselById(id: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    try {
      // Şimdilik list metodunu kullanarak tüm karouselleri getirip filtreleme yapıyoruz
      // Backend'de GetById endpoint'i oluşturulduğunda direkt o kullanılabilir
      const response = await this.carouselService.list(
        { pageIndex: -1, pageSize: -1 },
        () => {},
        (error) => {
          this.hideSpinner(SpinnerType.BallSpinClockwise);
          console.error('Error loading carousels:', error);
        }
      );
      
      const carousel = response.items.find(c => c.id === id);
      
      if (carousel) {
        // Yüklenen carousel'i seç
        this.selectedCarousel = JSON.parse(JSON.stringify(carousel));
        
        // Media type ayarla (geriye dönük uyumluluk için)
        if (!this.selectedCarousel.mediaType) {
          if (this.selectedCarousel.videoUrl || this.selectedCarousel.videoType || this.selectedCarousel.videoId) {
            this.selectedCarousel.mediaType = 'video';
          } else {
            this.selectedCarousel.mediaType = 'image';
          }
        }
        
        // Video ID'yi çıkar (eğer varsa)
        if (this.selectedCarousel.mediaType === 'video' && this.selectedCarousel.videoUrl) {
          this.extractVideoId();
        }
        
        // Durumu sıfırla
        this.existingImageIds = [];
        this.selectedFiles = [];
        this.selectedVideoFile = null;
      } else {
        this.customToastrService.message("Carousel bulunamadı", "Hata", {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
        this.router.navigate(['/admin/carousel/carousel-update']);
      }
      
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    } catch (error) {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      console.error('Error loading carousel by ID:', error);
      this.customToastrService.message("Carousel yüklenirken hata oluştu", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }
  }

  onCarouselSelect(carousel: Carousel) {
    if (!carousel || !carousel.id) {
      this.customToastrService.message("Geçersiz carousel seçimi", "Hata", {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
      return;
    }
    
    // URL'e id ekleyerek yönlendirme yap
    // Admin routes.ts dosyasındaki tanıma uygun olarak carousel komponentini dikkate alıyoruz
    this.router.navigate(['/admin/carousel/carousel-update', carousel.id]);
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
    if (!this.selectedCarousel || !this.selectedCarousel.carouselImageFiles) return;
    
    // Resmin ID'sini sakla - Backend'in beklediği parametre adı "existingImageIds"
    const imageId = this.selectedCarousel.carouselImageFiles[index].id;
    this.existingImageIds.push(imageId);
    
    // UI'da görünümü güncelle
    const carouselImagesCopy = [...this.selectedCarousel.carouselImageFiles];
    carouselImagesCopy.splice(index, 1);
    this.selectedCarousel.carouselImageFiles = carouselImagesCopy;
  }

  updateCarousel() {
    if (!this.selectedCarousel) return;

    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formData = new FormData();
    
    // Temel bilgiler
    formData.append('id', this.selectedCarousel.id);
    formData.append('name', this.selectedCarousel.name);
    formData.append('description', this.selectedCarousel.description || '');
    formData.append('order', this.selectedCarousel.order.toString());
    formData.append('isActive', this.selectedCarousel.isActive ? 'true' : 'false');
    formData.append('mediaType', this.selectedCarousel.mediaType || 'image');
    
    // Silinen resimlerin ID'lerini ekle - DOĞRU PARAMETRE ADI: existingImageIds
    if (this.existingImageIds.length > 0) {
      this.existingImageIds.forEach((id, i) => {
        formData.append(`existingImageIds[${i}]`, id);
      });
    }

    // Medya türüne göre dosya ekleme
    if (this.selectedCarousel.mediaType === 'image') {
      // Yeni resim dosyaları ekle - DOĞRU PARAMETRE ADI: newCarouselImages
      if (this.selectedFiles.length > 0) {
        this.selectedFiles.forEach((file) => {
          formData.append('newCarouselImages', file, file.name);
        });
      }
    } else if (this.selectedCarousel.mediaType === 'video') {
      formData.append('videoType', this.selectedCarousel.videoType || '');
      
      if (this.selectedCarousel.videoType === 'upload' && this.selectedVideoFile) {
        formData.append('carouselVideoFile', this.selectedVideoFile, this.selectedVideoFile.name);
      } else if (['youtube', 'vimeo'].includes(this.selectedCarousel.videoType || '') && this.selectedCarousel.videoUrl) {
        formData.append('videoUrl', this.selectedCarousel.videoUrl);
      }
    }

    // FormData içeriğini konsola yazdırarak debug edebilirsiniz
    // FormData içeriğini kontrol et (debug için)
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    this.carouselService.update(
      formData,
      () => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
        this.customToastrService.message("Carousel başarıyla güncellendi", "Başarılı", {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        
        // Güncel verileri yeniden yükle
        if (this.selectedCarousel) {
          this.loadCarouselById(this.selectedCarousel.id);
        }
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