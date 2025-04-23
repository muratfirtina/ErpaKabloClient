import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageRequest } from 'src/app/contracts/pageRequest';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnChanges {
  @Input() totalItems: number = 0;
  @Input() pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  @Output() pageChange = new EventEmitter<PageRequest>();

  pageList: number[] = [];
  Math = Math; // Template'de Math fonksiyonlarını kullanabilmek için

  ngOnChanges(changes: SimpleChanges): void {
    // Sadece ilgili inputlar değiştiğinde ve geçerli değerler olduğunda çalıştır
    if ((changes['totalItems'] || changes['pageRequest']) && this.totalItems >= 0 && this.pageRequest && this.pageRequest.pageSize > 0) {
       this.initializePagination();
    } else if (this.totalItems === 0) {
        // Eğer hiç item yoksa pagination'ı sıfırla
        this.pageList = [];
    }
  }

  initializePagination() {
    const totalPages = this.getPageCount();
    // pageIndex 0'dan başlar, currentPage 1'den başlar
    const currentPage = this.pageRequest.pageIndex + 1;
    this.pageList = [];

    // Eğer hiç sayfa yoksa veya tek sayfa varsa
    if (totalPages <= 1) {
        this.pageList = totalPages === 1 ? [1] : [];
        return;
    }

    // Gösterilecek maksimum sayfa düğmesi sayısı (mevcut sayfa + etrafındakiler + ilk/son + ellipsis)
    // Genellikle tek sayı olması tercih edilir (örneğin 5 veya 7 düğme: 1 ... 5 6 7 ... 10 gibi)
    const maxPagesToShow = 7; // Toplam düğme sayısı (sayılar ve ellipsis dahil)
    const sidePages = Math.floor((maxPagesToShow - 3) / 2); // Mevcut sayfanın her iki yanındaki sayfa sayısı (ilk/son ve ellipsis hariç)

    if (totalPages <= maxPagesToShow) {
        // Toplam sayfa sayısı azsa, hepsini göster
        for (let i = 1; i <= totalPages; i++) {
            this.pageList.push(i);
        }
    } else {
        // Ellipsis (...) mantığını uygula
        this.pageList.push(1); // Her zaman ilk sayfayı göster

        let rangeStart: number;
        let rangeEnd: number;

        // Başlangıca yakın sayfalar için
        if (currentPage <= sidePages + 2) {
             rangeStart = 2;
             rangeEnd = rangeStart + (sidePages * 2); // Ya da maxPagesToShow - 2
             rangeEnd = Math.min(rangeEnd, totalPages -1); // Son sayfayı geçmemeli
             for (let i = rangeStart; i <= rangeEnd; i++) {
                 this.pageList.push(i);
             }
             if (rangeEnd < totalPages - 1) {
                this.pageList.push(-1); // Ellipsis
             }
        }
        // Sona yakın sayfalar için
        else if (currentPage >= totalPages - sidePages - 1) {
            this.pageList.push(-1); // Ellipsis
            rangeStart = totalPages - (sidePages * 2) -1; // Ya da totalPages - (maxPagesToShow - 3)
            rangeStart = Math.max(rangeStart, 2); // İlk sayfayı geçmemeli
            rangeEnd = totalPages - 1;
            for (let i = rangeStart; i <= rangeEnd; i++) {
                this.pageList.push(i);
            }
        }
        // Ortadaki sayfalar için
        else {
            this.pageList.push(-1); // İlk ellipsis
            rangeStart = currentPage - sidePages;
            rangeEnd = currentPage + sidePages;
             for (let i = rangeStart; i <= rangeEnd; i++) {
                 this.pageList.push(i);
             }
             this.pageList.push(-1); // Son ellipsis
        }

        this.pageList.push(totalPages); // Her zaman son sayfayı göster
    }
  }

  getPageCount(): number {
    // Eğer pageSize 0 veya negatifse veya totalItems 0 ise 0 sayfa döndür
    if (!this.pageRequest || this.pageRequest.pageSize <= 0 || this.totalItems <= 0) {
        return 0;
    }
    return Math.ceil(this.totalItems / this.pageRequest.pageSize);
  }

  getStartItem(): number {
    if (this.totalItems === 0) return 0;
    return this.pageRequest.pageIndex * this.pageRequest.pageSize + 1;
  }

  getEndItem(): number {
    if (this.totalItems === 0) return 0;
    return Math.min(this.totalItems, (this.pageRequest.pageIndex + 1) * this.pageRequest.pageSize);
  }

  onPageChange(pageIndex: number): void {
    const totalPages = this.getPageCount();
    // Geçerli sayfa aralığında olup olmadığını kontrol et
    if (pageIndex < 0 || pageIndex >= totalPages) {
      return;
    }

    // Eğer zaten o sayfadaysa tekrar emit etme (opsiyonel)
    // if (this.pageRequest.pageIndex === pageIndex) {
    //   return;
    // }

    this.pageRequest.pageIndex = pageIndex;
    this.pageChange.emit({...this.pageRequest}); // Yeni bir obje göndererek değişimi tetikle
  }

  onPageSizeChange(): void {
    const oldPageIndex = this.pageRequest.pageIndex;
    this.pageRequest.pageIndex = 0; // Sayfa boyutu değiştiğinde her zaman ilk sayfaya dön
     // Sayfa boyutu değiştiğinde ve zaten ilk sayfada değilse emit et
     // VEYA her durumda emit et (initializePagination tetiklenmesi için)
    // if (oldPageIndex !== 0) {
       this.pageChange.emit({...this.pageRequest}); // Yeni bir obje göndererek değişimi tetikle
    // } else {
    //    // Zaten ilk sayfadaysa, sadece listeyi yeniden oluştur
    //    this.initializePagination();
    // }
  }
}