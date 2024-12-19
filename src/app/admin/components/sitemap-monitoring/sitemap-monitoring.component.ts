import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, Subscription, finalize, takeUntil } from 'rxjs';
import { SitemapMonitoringReport } from 'src/app/contracts/sitemap/sitemap.model';
import { FileSizePipe } from 'src/app/pipes/file-size.pipe';
import {SitemapMonitoringService } from 'src/app/services/admin/sitemap-monitoring.service';
import { SitemapService } from 'src/app/services/common/seo/sitemap.service';


@Component({
  selector: 'app-sitemap-monitoring',
  standalone: true,
  imports: [CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FileSizePipe],
  templateUrl: './sitemap-monitoring.component.html',
  styleUrls: ['./sitemap-monitoring.component.scss']
})
export class SitemapMonitoringComponent implements OnInit, OnDestroy {
  report: SitemapMonitoringReport | null = null;
  isRefreshing = false;
  private destroy$ = new Subject<void>();
  
  constructor(
    private monitoringService: SitemapMonitoringService,
    private sitemapService: SitemapService
  ) {}

  ngOnInit() {
    this.checkSitemaps();
    this.startPeriodicMonitoring();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkSitemaps() {
    this.monitoringService.monitorAllSitemaps()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: report => this.report = report,
        error: error => console.error('Error checking sitemaps:', error)
      });
  }

  startPeriodicMonitoring() {
    this.monitoringService.startPeriodicMonitoring(60)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: report => this.report = report,
        error: error => console.error('Error in periodic monitoring:', error)
      });
  }

  refreshSitemaps() {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    this.sitemapService.refreshSitemaps()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isRefreshing = false)
      )
      .subscribe({
        next: response => {
          if (response.success) {
            this.checkSitemaps();
          }
        },
        error: error => console.error('Error refreshing sitemaps:', error)
      });
  }

  getHealthScoreClass(): string {
    if (!this.report) return 'unknown';
    if (this.report.healthScore > 80) return 'good';
    if (this.report.healthScore > 60) return 'warning';
    return 'critical';
  }
  getHealthScoreIcon(): string {
    if (!this.report) return 'help_outline';
    if (this.report.healthScore > 80) return 'check_circle';
    if (this.report.healthScore > 60) return 'warning';
    return 'error';
  }

  getIssueIcon(severity: string): string {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'help';
    }
  }
}