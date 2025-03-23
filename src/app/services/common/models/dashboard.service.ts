import { Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { Observable, firstValueFrom } from 'rxjs';
import { DashboardStatistics } from 'src/app/contracts/dashboard/dashboardStatistics';
import { RecentItem } from 'src/app/contracts/dashboard/recentItem';
import { TopLocation } from 'src/app/contracts/dashboard/topLocation';
import { TopProduct } from 'src/app/contracts/dashboard/topProduct';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private httpClientService: HttpClientService) { }

  /**
   * Dashboard için genel istatistikleri getirir
   * @param timeFrame Zaman aralığı (all, day, week, month, days10, days30)
   * @returns Dashboard istatistik verileri
   */
  async getStatistics(timeFrame: string): Promise<DashboardStatistics> {
    const observable: Observable<DashboardStatistics> = this.httpClientService.get<DashboardStatistics>({
      controller: 'dashboard',
      action: 'statistics',
      queryString: `timeFrame=${timeFrame}`
    });
    return await firstValueFrom(observable);
  }

  /**
   * En çok satılan ürünleri getirir
   * @param timeFrame Zaman aralığı (all, day, week, month, days10, days30)
   * @param count Kaç ürün getirileceği
   * @returns En çok satılan ürünler listesi
   */
  async getTopSellingProducts(timeFrame: string, count: number = 10): Promise<TopProduct[]> {
    const observable: Observable<TopProduct[]> = this.httpClientService.get<TopProduct[]>({
      controller: 'dashboard',
      action: 'top-selling-products',
      queryString: `timeFrame=${timeFrame}&count=${count}`
    });
    return await firstValueFrom(observable);
  }

  /**
   * Sepete en çok eklenen ürünleri getirir
   * @param timeFrame Zaman aralığı (all, day, week, month, days10, days30)
   * @param count Kaç ürün getirileceği
   * @returns Sepete en çok eklenen ürünler listesi
   */
  async getTopCartProducts(timeFrame: string, count: number = 10): Promise<TopProduct[]> {
    const observable: Observable<TopProduct[]> = this.httpClientService.get<TopProduct[]>({
      controller: 'dashboard',
      action: 'top-cart-products',
      queryString: `timeFrame=${timeFrame}&count=${count}`
    });
    return await firstValueFrom(observable);
  }

  /**
   * En çok sipariş verilen lokasyonları getirir
   * @param timeFrame Zaman aralığı (all, day, week, month, days10, days30)
   * @param count Kaç lokasyon getirileceği
   * @returns En çok sipariş verilen lokasyonlar listesi
   */
  async getTopOrderLocations(timeFrame: string, count: number = 10): Promise<TopLocation[]> {
    const observable: Observable<TopLocation[]> = this.httpClientService.get<TopLocation[]>({
      controller: 'dashboard',
      action: 'top-order-locations',
      queryString: `timeFrame=${timeFrame}&count=${count}`
    });
    return await firstValueFrom(observable);
  }

  /**
   * Son eklenen kategorileri getirir
   * @param count Kaç kategori getirileceği
   * @returns Son eklenen kategoriler listesi
   */
  async getRecentCategories(count: number = 5): Promise<RecentItem[]> {
    const observable: Observable<RecentItem[]> = this.httpClientService.get<RecentItem[]>({
      controller: 'dashboard',
      action: 'recent-categories',
      queryString: `count=${count}`
    });
    return await firstValueFrom(observable);
  }

  /**
   * Son eklenen markaları getirir
   * @param count Kaç marka getirileceği
   * @returns Son eklenen markalar listesi
   */
  async getRecentBrands(count: number = 5): Promise<RecentItem[]> {
    const observable: Observable<RecentItem[]> = this.httpClientService.get<RecentItem[]>({
      controller: 'dashboard',
      action: 'recent-brands',
      queryString: `count=${count}`
    });
    return await firstValueFrom(observable);
  }
}