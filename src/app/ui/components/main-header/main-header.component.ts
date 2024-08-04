import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main-header',
  standalone: true,
  imports: [CommonModule, RouterModule,FormsModule],
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.scss']
})
export class MainHeaderComponent implements OnInit {
  searchTerm: string = '';
  categories: string[] = ['Erkek', 'Kadın', 'Çocuk', 'Ayakkabı', 'Aksesuar'];

  constructor() { }

  ngOnInit(): void { }

  onSearch(): void {
    console.log('Searching for:', this.searchTerm);
    // Implement search functionality
  }
}