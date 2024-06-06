import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { RouterModule, provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideAnimations(),
  importProvidersFrom(BrowserModule,FormsModule,HttpClientModule,ReactiveFormsModule,MatSidenavModule,BrowserAnimationsModule,MatListModule),
  { provide: "baseUrl", useValue: "http://localhost:5199/api", multi: true },]
};
