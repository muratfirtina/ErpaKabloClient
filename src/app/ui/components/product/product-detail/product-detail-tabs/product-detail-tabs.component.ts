import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-product-detail-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail-tabs.component.html',
  styleUrl: './product-detail-tabs.component.scss'
})
export class ProductDetailTabsComponent implements OnInit {
  activeTab: string = 'description';

  constructor() { }

  ngOnInit(): void {
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
  }
}