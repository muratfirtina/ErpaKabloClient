// src/app/pipes/time-ago.pipe.ts
import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common'; // İsteğe bağlı: Tam tarih formatlaması için

@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: false // Otomatik güncellemeler için false yap (performansı etkileyebilir)
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private timer: number | null = null; // Timer referansını tutmak için

  constructor(private cdRef: ChangeDetectorRef) {} // ChangeDetectorRef inject edildi

  transform(value: string | Date | null | undefined): string {
    // null/undefined değerleri kontrol et
    if (!value) return '-';

    let date: Date;
    try {
       // Girdiyi Date nesnesine çevirmeyi dene
       date = typeof value === 'string' ? new Date(value) : value;
       // Çevirdikten sonra tarihin geçerli olup olmadığını kontrol et
       if (isNaN(date.getTime())) {
           // console.warn("TimeAgoPipe'a geçersiz tarih sağlandı:", value);
           return '-'; // Geçersiz tarihler için yer tutucu döndür
       }
    } catch (e) {
       // console.error("TimeAgoPipe'ta tarih ayrıştırma hatası:", value, e);
       return '-';
    }

    this.removeTimer(); // Önceki timer'ı temizle

    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

    // Gelecekteki tarihleri (örn. saat farkı) nazikçe ele al
    if (seconds < 0) return `az sonra`;

    // Güncelleme aralığı mantığı
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) { // İlk dakika için her saniye güncelle
        // Timer sadece tarayıcı ortamında çalışır
        if (typeof window !== 'undefined') {
            this.timer = window.setTimeout(() => this.cdRef.markForCheck(), 1000);
        }
         return seconds < 30 ? 'az önce' : `${seconds} sn önce`;
    } else if (minutes < 60) { // İlk saat için her dakika güncelle
        if (typeof window !== 'undefined') {
            this.timer = window.setTimeout(() => this.cdRef.markForCheck(), 60000);
        }
        return `${minutes} dk önce`;
    } else if (hours < 24) { // İlk gün için her saat güncelle
        if (typeof window !== 'undefined') {
            this.timer = window.setTimeout(() => this.cdRef.markForCheck(), 3600000);
        }
        return `${hours} sa önce`;
    } else if (days < 7) { // İlk hafta için günlük güncelle (timer gerekmez)
        return `${days} gün önce`;
    } else if (days < 30) {
        return `${Math.floor(days / 7)} hf önce`; // Haftalar
    } else if (days < 365) {
        return `${Math.floor(days / 30)} ay önce`; // Aylar
    } else {
        return `${Math.floor(days / 365)} yıl önce`; // Yıllar
    }

    // İsteğe bağlı: Çok eski girdiler için tam tarihi DatePipe kullanarak göster
    // const angularDatePipe = new DatePipe('tr-TR'); // Gerekirse inject et
    // return angularDatePipe.transform(date, 'dd.MM.yyyy') || '-';
  }

   ngOnDestroy(): void {
       this.removeTimer(); // Component yok edildiğinde timer'ı temizle
   }

   // Timer'ı temizleyen özel metod
   private removeTimer(): void {
       if (this.timer) {
            // Timer sadece tarayıcı ortamında çalışır
           if (typeof window !== 'undefined') {
                window.clearTimeout(this.timer);
           }
           this.timer = null;
       }
   }
}