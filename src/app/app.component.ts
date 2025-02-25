import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ProductComponent } from './ui/components/product/product.component';
import { CookieConsentComponent } from './ui/components/cookie/cookie-consent/cookie-consent.component';
import { SeoService } from './services/common/seo/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet,CookieConsentComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private seoService: SeoService) {}

  ngOnInit() {
    // Web Vitals izlemeyi başlat
    this.seoService.initWebVitals();
  }

  title = 'TumdexClient';
}
