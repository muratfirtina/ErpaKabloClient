import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { RouterModule, provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { ToastrModule } from 'ngx-toastr';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatTreeModule } from '@angular/material/tree';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideAnimations(),
  importProvidersFrom(BrowserModule,FormsModule,HttpClientModule,ReactiveFormsModule,BrowserAnimationsModule
    ,MatSidenavModule,MatListModule,MatCardModule,MatButtonModule,
    MatFormFieldModule,MatInputModule,MatPaginatorModule,MatTableModule,
    MatSelectModule,NgxMatSelectSearchModule,MatTreeModule,
    ToastrModule.forRoot()),
  { provide: "baseUrl", useValue: "http://localhost:5199/api", multi: true },]
};
