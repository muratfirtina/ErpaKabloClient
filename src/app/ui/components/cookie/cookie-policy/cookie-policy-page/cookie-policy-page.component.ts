import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Language } from 'src/app/enums/language';
import { COMPANY_INFO } from 'src/app/config/company-info.config';
import { CookiePolicyComponent } from '../cookie-policy.component';

@Component({
  selector: 'app-cookie-policy-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CookiePolicyComponent],
  template: `
    <div class="container py-5">
      <div class="row">
        <div class="col-12 mb-4">
          <button class="btn btn-outline-secondary" routerLink="/">
            <i class="fas fa-arrow-left me-2"></i> Geri Dön
          </button>
        </div>
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <app-cookie-policy></app-cookie-policy>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 30px 15px;
    }
  `]
})
export class CookiePolicyPageComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}