import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable } from 'rxjs';
import { SitemapMonitoringReport, SitemapOperationResponse } from 'src/app/contracts/sitemap/sitemap.model';


@Injectable({
  providedIn: 'root'
})
export class SitemapService {
  constructor(private httpClientService: HttpClientService) {}

  /**
   * Ana sitemap dosyasını getirir
   */
  getSitemapIndex(): Observable<string> {
    return this.httpClientService.get<string>({
      controller: "sitemaps",
      action: "sitemap.xml",
      responseType: "text"
    });
  }

  /**
   * Ürün sitemap'ini getirir
   */
  getProductSitemap(): Observable<string> {
    return this.httpClientService.get<string>({
      controller: "sitemaps",
      action: "products.xml",
      responseType: "text"
    });
  }

  /**
   * Kategori sitemap'ini getirir
   */
  getCategorySitemap(): Observable<string> {
    return this.httpClientService.get<string>({
      controller: "sitemaps",
      action: "categories.xml",
      responseType: "text"
    });
  }

  /**
   * Marka sitemap'ini getirir
   */
  getBrandSitemap(): Observable<string> {
    return this.httpClientService.get<string>({
      controller: "sitemaps",
      action: "brands.xml",
      responseType: "text"
    });
  }

  /**
   * Görsel sitemap'ini getirir
   */
  getImageSitemap(): Observable<string> {
    return this.httpClientService.get<string>({
      controller: "sitemaps",
      action: "images.xml",
      responseType: "text"
    });
  }

  /**
   * Statik sayfalar sitemap'ini getirir
   */
  getStaticPagesSitemap(): Observable<string> {
    return this.httpClientService.get<string>({
      controller: "sitemaps",
      action: "static-pages.xml",
      responseType: "text"
    });
  }

  getSitemapStatus(): Observable<SitemapMonitoringReport> {
    return this.httpClientService.get<SitemapMonitoringReport>({
      controller: "sitemaps",
      action: "status"
    });
  }

  /**
   * Sitemap'leri arama motorlarına gönderir
   */
  submitSitemapsToSearchEngines(): Observable<SitemapOperationResponse> {
    return this.httpClientService.post<SitemapOperationResponse>(
      {
        controller: "sitemaps",
        action: "submit"
      },
      {}
    );
  }
  /**
   * Tüm sitemap'leri yeniler
   */
  refreshSitemaps(): Observable<SitemapOperationResponse> {
    return this.httpClientService.post<SitemapOperationResponse>(
      {
        controller: "sitemaps",
        action: "refresh"
      },
      {}
    );
}
}