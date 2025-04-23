// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CookieConsentComponent } from './ui/components/cookie/cookie-consent/cookie-consent.component';
import { SeoService } from './services/common/seo/seo.service';
import { TokenService } from './services/common/token.service';
import { AnalyticsService } from './services/common/analytics.services';
import { TokenCheckService } from './services/common/tokenCheck.service';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, Subscription } from 'rxjs'; // Removed 'take' import as it wasn't used here
import { OnlineStatusService } from './services/common/online-status.service';
import { VisitorTrackingService } from './services/common/visitor-tracking.service';
// AuthService import removed as it's not directly used here

@Component({
  selector: 'app-root',
  standalone: true,
  // Ensure CookieConsentComponent is standalone or part of an imported module
  imports: [CommonModule, RouterOutlet, CookieConsentComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private onlineStatusSubscription: Subscription | undefined;
  private swUpdateSubscription: Subscription | undefined;

  constructor(
    private seoService: SeoService,
    private tokenService: TokenService,
    private analyticsService: AnalyticsService,
    private tokenCheckService: TokenCheckService,
    private router: Router,
    private swUpdate: SwUpdate,
    private onlineStatusService: OnlineStatusService,
    private visitorTrackingService: VisitorTrackingService
  ) {}

  async ngOnInit() {
    // Service Worker Updates
    if (this.swUpdate.isEnabled) {
      this.swUpdateSubscription = this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          if (confirm('Uygulamanın yeni bir versiyonu mevcut. Şimdi yenilemek ister misiniz?')) {
            window.location.reload();
          }
        });

      // Check for updates periodically
      setInterval(() => {
        this.swUpdate.checkForUpdate().catch(err => console.error('Error checking for SW update:', err));
      }, 60 * 60 * 1000); // Check every hour
      this.swUpdate.checkForUpdate().catch(err => console.error('Error checking for SW update on init:', err)); // Check on init too
    }

    // Online Status Monitoring
    this.onlineStatusSubscription = this.onlineStatusService.getOnlineStatus().subscribe(isOnline => {
      const currentUrl = this.router.url;
      if (!isOnline && !currentUrl.startsWith('/offline')) {
          this.router.navigate(['/offline'], { skipLocationChange: true });
      } else if (isOnline && currentUrl.startsWith('/offline')) {
           this.router.navigate(['/']); // Return to home
      }
    });

    // Start periodic token checking (e.g., every 30 minutes)
    this.tokenCheckService.startPeriodicCheck(30 * 60);

    // Handle initial token validation if tokens exist
    const token = this.tokenService.getAccessToken();
    const refreshToken = this.tokenService.getRefreshToken();
    if (token && refreshToken) {
      try {
        // Attempt to validate/refresh token on startup
        await this.tokenService.ensureValidToken();
      } catch (error) {
        console.warn("Initial token validation/refresh failed:", error);
        // Optionally handle this error, e.g., by forcing logout if critical
      }
    }

    // Initialize Web Vitals monitoring
    this.seoService.initWebVitals();

    // Initialize analytics based on cookie consent
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      try {
        const settings = JSON.parse(consent);
        // Ensure settings includes the required 'analytics' property
        const analyticsConsent = settings.analytics === true; // Explicitly check for boolean true
        this.analyticsService.initializeAnalytics({
            analytics: analyticsConsent,
            marketing: settings.marketing === true // Pass marketing consent too if present
        });
        const hasAnalyticsConsent = localStorage.getItem('analytics_consent') === 'true';
    
        if (hasAnalyticsConsent) {
      this.analyticsService.initializeAnalytics({ analytics: true });
    }
      } catch (e) {
        console.error('Failed to parse cookie consent settings, initializing analytics as denied.', e);
        // Initialize with analytics denied
        this.analyticsService.initializeAnalytics({ analytics: false }); // <-- FIXED
      }
    } else {
        // No consent found in localStorage, initialize as denied
         console.log("No cookie consent found, initializing analytics as denied.");
         this.analyticsService.initializeAnalytics({ analytics: false }); // <-- FIXED
    }

    // Initialize Visitor Tracking Service
    // Call initialize once. The service handles its own connection lifecycle.
    this.visitorTrackingService.initialize().catch(err => {
      console.error("Visitor tracking service initialization failed:", err);
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.onlineStatusSubscription?.unsubscribe();
    this.swUpdateSubscription?.unsubscribe();
    // VisitorTrackingService and TokenCheckService should handle their own cleanup if needed
  }

  title = 'TumdexClient';
}