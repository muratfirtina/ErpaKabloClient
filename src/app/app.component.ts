import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ProductComponent } from './ui/components/product/product.component';
import { CookieConsentComponent } from './ui/components/cookie/cookie-consent/cookie-consent.component';
import { SeoService } from './services/common/seo/seo.service';
import { TokenService } from './services/common/token.service';
import { AnalyticsService } from './services/common/analytics.services';
import { environment } from 'src/enviroments/enviroment.prod';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet,CookieConsentComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private seoService: SeoService,
    private tokenService: TokenService,
    private analyticsService: AnalyticsService
    ) {}

 async ngOnInit() {
    // Web Vitals izlemeyi başlat
    const token = this.tokenService.getAccessToken();
  const refreshToken = this.tokenService.getRefreshToken();
  
  // Sadece token varsa token doğrulaması yap
  if (token && refreshToken) {
    await this.tokenService.ensureValidToken();
  }
    this.seoService.initWebVitals();
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      const settings = JSON.parse(consent);
      if (settings.analytics) {
        // Kullanıcı analitik çerezlerine onay vermiş
        this.analyticsService.initGoogleAnalytics(environment.googleAnalyticsId);
      }
    }
    
  }

  title = 'TumdexClient';
}
