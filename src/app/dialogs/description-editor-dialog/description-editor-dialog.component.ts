import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularEditorConfig, AngularEditorModule, UploadResponse } from '@kolkov/angular-editor';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpClientModule, HttpEvent, HttpEventType } from '@angular/common/http';
import { ProductService } from 'src/app/services/common/models/product.service';
import { Observable, from, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'app-description-editor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    AngularEditorModule,
    HttpClientModule,
    MatTabsModule
  ],
  templateUrl: './description-editor-dialog.component.html',
  styleUrls: ['./description-editor-dialog.component.scss']
})
export class DescriptionEditorDialogComponent implements OnInit {
  description = '';
  videoType = 'upload'; // Varsayılan olarak 'upload' seçeneğini gösterelim
  videoUrl = '';
  videoPoster = '';
  videoWidth = '560';
  videoHeight = '315';
  videoPreviewHtml = '';
  selectedTab = 0;
  
  // Video yükleme işlemi için değişkenler
  selectedVideoFile: File | null = null;
  uploadedVideoUrl: string | null = null;
  uploadProgress = 0;
  imageUploadProgress = 0;

  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: 'auto',
    minHeight: '300px',
    maxHeight: 'auto',
    width: 'auto',
    minWidth: '0',
    translate: 'yes',
    enableToolbar: true,
    showToolbar: true,
    placeholder: 'Enter product description here...',
    defaultParagraphSeparator: 'p',
    defaultFontName: '',
    defaultFontSize: '',
    fonts: [
      {class: 'arial', name: 'Arial'},
      {class: 'times-new-roman', name: 'Times New Roman'},
      {class: 'calibri', name: 'Calibri'},
      {class: 'comic-sans-ms', name: 'Comic Sans MS'}
    ],
    uploadUrl: 'api/products/upload-description-image',
    upload: (file: File): Observable<HttpEvent<UploadResponse>> => {
      // FormData oluştur ve dosyayı ekle
      const formData = new FormData();
      formData.append('Image', file);
      
      // Observable olarak doğrudan HTTP isteği yap
      return this.productService.uploadDescriptionImageWithProgress(formData)
        .pipe(
          tap((event: any) => {
            // İlerleme durumunu izle
            if (event.type === HttpEventType.UploadProgress && event.total) {
              this.imageUploadProgress = Math.round(100 * event.loaded / event.total);
            }
          }),
          map((event: any) => {
            // Response event'ini döndürülecek formata çevir
            if (event.type === HttpEventType.Response) {
              return {
                type: HttpEventType.Response,
                body: { imageUrl: event.body.url }
              } as HttpEvent<UploadResponse>;
            }
            return event as HttpEvent<UploadResponse>;
          }),
          catchError(error => {
            console.error('Error uploading image:', error);
            return of({
              type: HttpEventType.Response,
              body: { imageUrl: '' }
            } as HttpEvent<UploadResponse>);
          })
        );
    },
    sanitize: false, // HTML içeriği düzgün işlenebilsin diye false
    toolbarPosition: 'top',
    toolbarHiddenButtons: [] 
  };

  constructor(
    private dialogRef: MatDialogRef<DescriptionEditorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private productService: ProductService
  ) {
    this.description = data?.description || '';
  }

  ngOnInit() {
    // Videonun silinmesi için stil eklemeleri
    this.addVideoStyles();
    
    // Sekme seçimi için önceki seçimi koruyalım
    if (localStorage.getItem('descriptionEditorTab')) {
      this.selectedTab = parseInt(localStorage.getItem('descriptionEditorTab') || '0');
    }
    
    // Editör hazır olduğunda olay dinleyiciyi kur
    setTimeout(() => {
      this.setupEditorEventListeners();
      this.makeVideosEditable();
    }, 500);
  }
  
  // Editör olaylarını ayarlama - yeni metot
  setupEditorEventListeners() {
    const editorElement = document.querySelector('.angular-editor-textarea');
    if (!editorElement) return;
    
    // Olay delegasyonu kullanarak tüm tıklamaları yakalayalım
    editorElement.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Video silme butonuna tıklandı mı?
      if (target.classList.contains('video-delete-btn')) {
        // Butonun üst wrapper'ını bul ve sil
        const wrapper = target.closest('.video-wrapper');
        if (wrapper) {
          wrapper.remove();
          // Editör içeriğini güncelle
          this.description = editorElement.innerHTML;
          console.log('Video silindi!');
        }
        
        // Olayın yayılmasını engelle
        event.preventDefault();
        event.stopPropagation();
      }
    });
    
    // Değişiklik olayını dinle
    editorElement.addEventListener('input', () => {
      // Editör içeriğini güncelle
      this.description = editorElement.innerHTML;
    });
  }
  
  // makeVideosEditable metodunu güncelle
  makeVideosEditable() {
    const editorElement = document.querySelector('.angular-editor-textarea');
    if (!editorElement) return;
    
    // Tüm video containerları bul
    const videoContainers = editorElement.querySelectorAll('.video-container');
    let hasChanges = false;
    
    videoContainers.forEach(container => {
      // Eğer zaten bir wrapper içinde değilse
      if (!container.parentElement.classList.contains('video-wrapper')) {
        // Container'ı düzenlenebilir wrapper ile sar
        const wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper';
        wrapper.setAttribute('contenteditable', 'false');
        
        // Toolbar oluştur
        const toolbar = document.createElement('div');
        toolbar.className = 'video-toolbar';
        
        // Silme butonu ekle
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'video-delete-btn';
        deleteBtn.textContent = 'Videoyu Sil';
        deleteBtn.type = 'button';
        
        // Butonun click olayını BURADA ekleme - bunu global olay dinleyici ile yapacağız
        
        // Elementleri birleştir
        toolbar.appendChild(deleteBtn);
        
        // Orijinal container'ı kopyala
        const containerClone = container.cloneNode(true);
        
        // Wrapper'a toolbar ve container'ı ekle
        wrapper.appendChild(toolbar);
        wrapper.appendChild(containerClone);
        
        // Orijinal container'ı wrapper ile değiştir
        container.parentNode.replaceChild(wrapper, container);
        
        hasChanges = true;
      }
    });
    
    // Değişiklik olduysa editör içeriğini güncelle
    if (hasChanges) {
      this.description = editorElement.innerHTML;
      console.log('Videolar düzenlenebilir hale getirildi');
    }
  }

  // Video silme butonları için stil ekle
  addVideoStyles() {
    if (!document.getElementById('video-editor-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'video-editor-styles';
      styleEl.innerHTML = `
        .video-wrapper {
          position: relative;
          margin: 15px 0;
          border: 1px dashed #ccc;
          padding: 5px;
        }
        .video-toolbar {
          position: absolute;
          top: 5px;
          right: 5px;
          z-index: 100;
          background: rgba(0,0,0,0.7);
          border-radius: 3px;
          padding: 3px;
        }
        .video-delete-btn {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 3px;
          padding: 2px 8px;
          font-size: 12px;
          cursor: pointer;
        }
        .video-delete-btn:hover {
          background: #c82333;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }

  close() {
    this.dialogRef.close();
  }

  // Video dosyası seçildiğinde çağrılacak method
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
  
  // Video yükleme işlemini gerçekleştirecek method
  async uploadVideo() {
    if (!this.selectedVideoFile) return null;
    
    try {
      const formData = new FormData();
      formData.append('Video', this.selectedVideoFile);
      
      // ProductService'e video yükleme methodu eklenmiş olmalı
      const uploadResult = await this.productService.uploadDescriptionVideo(formData, (progress) => {
        this.uploadProgress = progress;
      });
      
      this.uploadedVideoUrl = uploadResult.url;
      return uploadResult.url;
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Video yükleme başarısız oldu. Lütfen tekrar deneyin.');
      return null;
    }
  }
  
  // Embed butonu devre dışı bırakma kontrolü
  isEmbedButtonDisabled(): boolean {
    if (this.videoType === 'upload') {
      return !this.selectedVideoFile && !this.uploadedVideoUrl;
    } else {
      return !this.videoUrl;
    }
  }

  // Tab değiştiğinde çağrılacak metod
  onTabChange(event: any) {
    this.selectedTab = event.index;
    localStorage.setItem('descriptionEditorTab', event.index.toString());
  }

  // Video ekleme işlemi
  async embedVideo() {
    let embedHtml = '';
    let videoUrl = '';
    
    if (this.videoType === 'upload') {
      if (this.selectedVideoFile && !this.uploadedVideoUrl) {
        // Yeni video yükleme
        videoUrl = await this.uploadVideo();
        if (!videoUrl) return;
      } else if (this.uploadedVideoUrl) {
        // Zaten yüklenmiş video
        videoUrl = this.uploadedVideoUrl;
      } else {
        alert('Lütfen yüklemek için bir video dosyası seçin.');
        return;
      }
      
      // HTML5 video player ile gömme
      embedHtml = `<div class="video-wrapper" contenteditable="false">
        <div class="video-toolbar">
          <button class="video-delete-btn" type="button">Videoyu Sil</button>
        </div>
        <div class="video-container" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; max-width:100%;">
          <video width="${this.videoWidth}" height="${this.videoHeight}" controls style="position:absolute; top:0; left:0; width:100%; height:100%;">
            <source src="${videoUrl}" type="${this.selectedVideoFile?.type || 'video/mp4'}">
            Tarayıcınız video etiketini desteklemiyor.
          </video>
        </div>
      </div>
      <p></p>`;
      
      if (this.videoPoster) {
        embedHtml = embedHtml.replace(
          '<video', 
          `<video poster="${this.videoPoster}"`
        );
      }
    }
    else if (this.videoType === 'youtube') {
      // Extract YouTube video ID from URL
      const videoIdMatch = this.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (videoIdMatch && videoIdMatch[1]) {
        const videoId = videoIdMatch[1];
        embedHtml = `<div class="video-wrapper" contenteditable="false">
          <div class="video-toolbar">
            <button class="video-delete-btn" type="button">Videoyu Sil</button>
          </div>
          <div class="video-container" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; max-width:100%;">
            <iframe width="${this.videoWidth}" height="${this.videoHeight}" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute; top:0; left:0; width:100%; height:100%;"></iframe>
          </div>
        </div>
        <p></p>`;
      } else {
        alert('Geçersiz YouTube URL. Lütfen geçerli bir YouTube video URL girin.');
        return;
      }
    } 
    else if (this.videoType === 'vimeo') {
      // Extract Vimeo video ID from URL
      const videoIdMatch = this.videoUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|)(\d+)(?:|\/\?)/);
      if (videoIdMatch && videoIdMatch[1]) {
        const videoId = videoIdMatch[1];
        embedHtml = `<div class="video-wrapper" contenteditable="false">
          <div class="video-toolbar">
            <button class="video-delete-btn" type="button">Videoyu Sil</button>
          </div>
          <div class="video-container" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; max-width:100%;">
            <iframe width="${this.videoWidth}" height="${this.videoHeight}" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute; top:0; left:0; width:100%; height:100%;"></iframe>
          </div>
        </div>
        <p></p>`;
      } else {
        alert('Geçersiz Vimeo URL. Lütfen geçerli bir Vimeo video URL girin.');
        return;
      }
    } 
    else if (this.videoType === 'html5') {
      // Direct video URL
      if (!this.videoUrl) {
        alert('Lütfen bir video URL girin.');
        return;
      }
      
      embedHtml = `<div class="video-wrapper" contenteditable="false">
        <div class="video-toolbar">
          <button class="video-delete-btn" type="button">Videoyu Sil</button>
        </div>
        <div class="video-container" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; max-width:100%;">
          <video width="${this.videoWidth}" height="${this.videoHeight}" controls style="position:absolute; top:0; left:0; width:100%; height:100%;">
            <source src="${this.videoUrl}" type="video/mp4">
            Tarayıcınız video etiketini desteklemiyor.
          </video>
        </div>
      </div>
      <p></p>`;
      
      if (this.videoPoster) {
        embedHtml = embedHtml.replace(
          '<video', 
          `<video poster="${this.videoPoster}"`
        );
      }
    }
    
    // Add video embed to description
    this.description += embedHtml;
    
    // Show preview - DOM işleme ile önizleme HTML'ini oluştur
    const previewDiv = document.createElement('div');
    previewDiv.innerHTML = embedHtml;
    
    // Silme butonunu ve toolbar'ı kaldır
    const toolbar = previewDiv.querySelector('.video-toolbar');
    if (toolbar) toolbar.remove();
    
    // Temizlenmiş HTML'i al
    this.videoPreviewHtml = previewDiv.innerHTML;
    
    // Reset upload progress
    this.uploadProgress = 0;
    
    // Reset video file if it was uploaded successfully
    if (this.videoType === 'upload' && this.uploadedVideoUrl) {
      this.selectedVideoFile = null;
    }
    
    
  }
  
  // Video silme butonlarına tıklama olayını bağla
  

  // İçeriği temizleyen metot - Editör butonlarını kaldırır
  cleanContentForSave(): string {
    // Geçici bir div oluştur ve içine HTML'i yerleştir
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.description;
    
    // Video wrapper'larını temizleme
    const videoWrappers = tempDiv.querySelectorAll('.video-wrapper');
    videoWrappers.forEach(wrapper => {
      // İçerdeki video container elementini bul
      const videoContainer = wrapper.querySelector('.video-container');
      if (videoContainer) {
        // Video container içeriğini al 
        const videoContent = videoContainer.innerHTML;
        
        // Yeni bir div oluştur, sadece video içeriği ve responsive özellikler ile
        const cleanContainer = document.createElement('div');
        cleanContainer.className = 'video-container';
        cleanContainer.style.cssText = 'position:relative; padding-bottom:56.25%; height:0; overflow:hidden; max-width:100%;';
        cleanContainer.innerHTML = videoContent;
        
        // Wrapper yerine temiz container'ı ekle
        wrapper.parentNode.replaceChild(cleanContainer, wrapper);
      }
    });
    
    // Artık gerekmeyen video toolbar'ları temizleyelim
    const toolbars = tempDiv.querySelectorAll('.video-toolbar');
    toolbars.forEach(toolbar => toolbar.remove());
    
    // Video silme butonlarını temizle
    const deleteButtons = tempDiv.querySelectorAll('.video-delete-btn');
    deleteButtons.forEach(button => button.remove());
    
    // Temizlenmiş içeriği döndür
    return tempDiv.innerHTML;
  }
  
  // Formu submit etme - temizlenmiş içerikle
  save() {
    // İçeriği temizleyerek kaydet
    const cleanedContent = this.cleanContentForSave();
    this.dialogRef.close(cleanedContent);
  }
}