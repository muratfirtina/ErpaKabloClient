import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { CookieConsentComponent } from './ui/components/cookie/cookie-consent/cookie-consent.component';
import { SeoService } from './services/common/seo/seo.service';
import { TokenService } from './services/common/token.service';
import { AnalyticsService } from './services/common/analytics.services';
import { TokenCheckService } from './services/common/tokenCheck.service';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { OnlineStatusService } from './services/common/online-status.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CookieConsentComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private seoService: SeoService,
    private tokenService: TokenService,
    private analyticsService: AnalyticsService,
    private tokenCheckService: TokenCheckService,
    private router: Router,
    private swUpdate: SwUpdate,
    private onlineStatusService: OnlineStatusService
  ) {}

  async ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          // Yeni bir versiyon varsa, kullanıcıya sor
          if (confirm('Uygulamanın yeni bir versiyonu mevcut. Şimdi yenilemek ister misiniz?')) {
            window.location.reload();
          }
        });
      
      // Periyodik olarak güncellemeleri kontrol et
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 60000); // Her dakika kontrol et
    }
    this.onlineStatusService.getOnlineStatus().subscribe(isOnline => {
      if (!isOnline) {
        // Kullanıcı çevrimdışı olduğunda offline sayfasına yönlendir
        this.router.navigate(['/offline']);
      } else if (this.router.url === '/offline') {
        // Kullanıcı tekrar çevrimiçi olduğunda ana sayfaya yönlendir
        this.router.navigate(['/']);
      }
    });
    // Start token checking
    this.tokenCheckService.startPeriodicCheck(30);
    
    // Handle token validation
    const token = this.tokenService.getAccessToken();
    const refreshToken = this.tokenService.getRefreshToken();
    
    // Only validate token if both tokens exist
    if (token && refreshToken) {
      await this.tokenService.ensureValidToken();
    }
    
    // Initialize web vitals monitoring
    this.seoService.initWebVitals();
    
    // Initialize analytics based on consent
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      const settings = JSON.parse(consent);
      this.analyticsService.initializeAnalytics(settings);
    }
  }

  title = 'TumdexClient';
}