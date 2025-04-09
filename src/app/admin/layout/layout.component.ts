import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  sidebarExpanded = true;
  isMobile = false;

  ngOnInit(): void {
    // Ekran boyutunu kontrol et
    this.checkScreenSize();

    // Pencere boyutu değişikliklerini izle
    window.addEventListener('resize', () => {
      this.checkScreenSize();
    });
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    // Mobil cihazlarda bile sidebar durumunu otomatik değiştirmiyoruz
    // Varsayılan olarak açık kalabilir, kullanıcı isterse kapatır
  }

  onSidebarToggled(expanded: boolean): void {
    this.sidebarExpanded = expanded;
  }
}