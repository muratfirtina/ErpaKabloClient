import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { RouterModule, provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
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
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { SafeUrlPipe } from './pipes/safeUrl.pipe';
import { JwtModule } from '@auth0/angular-jwt';
import { HttpErrorHandlerInterceptorService } from './services/common/http-error-handler-interceptor.service';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { FileSizePipe } from './pipes/file-size.pipe';
import { authInterceptor } from './interceptors/auth.interceptor';
import { TokenValidatorInterceptor } from './interceptors/tokenValidator.interceptor';
import { environment } from 'src/environments/environment.prod';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    provideAnimations(),
    importProvidersFrom(
      BrowserModule,
      FormsModule,
      HttpClientModule,
      ReactiveFormsModule,
      BrowserAnimationsModule,
      MatSidenavModule,
      MatListModule,
      MatCardModule,
      MatButtonModule,
      MatFormFieldModule,
      MatInputModule,
      MatPaginatorModule,
      MatTableModule,
      MatSelectModule,
      NgxMatSelectSearchModule,
      MatTreeModule,
      ToastrModule.forRoot(),
      JwtModule.forRoot({
        config: {
          tokenGetter: () => localStorage.getItem("accessToken"),
          allowedDomains: ["localhost:5000", "www.tumdex.com", "tumdex.com"],
          disallowedRoutes: ["localhost:5000/api/auth/login", "www.tumdex.com/api/auth/login", "tumdex.com/api/auth/login"]
        }
      })
    ),
    SafeUrlPipe,
    SafeHtmlPipe,
    FileSizePipe,
    // Her interceptor için ayrı bir provider tanımı
    {
      provide: HTTP_INTERCEPTORS, 
      useClass: HttpErrorHandlerInterceptorService,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS, 
      useClass: TokenValidatorInterceptor,
      multi: true
    },
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    { 
      provide: "baseUrl", 
      useValue: `${environment.baseUrl}/api`, 
      multi: true 
    },
    { provide: LocationStrategy, useClass: PathLocationStrategy }, 
    provideAnimationsAsync(),
  ]
};
